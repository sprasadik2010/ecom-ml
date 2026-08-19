import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BinaryTree, TreeData } from '../components/BinaryTree';
import { API_BASE_URL } from '../context/AuthContext';
import { Search, ArrowLeft, RefreshCcw, Home, ShieldAlert, ArrowUpCircle } from 'lucide-react';

export const TreePage: React.FC = () => {
  const { user, token } = useAuth();
  
  const [treeData, setTreeData] = useState<TreeData | null>(null);
  const [currentRootUsername, setCurrentRootUsername] = useState(user?.username || '');
  const [history, setHistory] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTree = async (username: string) => {
    if (!token) return;
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/tree?username=${username}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to retrieve genealogy tree.');
      }
      
      const data = await response.json();
      setTreeData(data);
    } catch (err: any) {
      console.error('Error fetching tree:', err);
      setError(err.message || 'Error communicating with server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && currentRootUsername === '') {
      setCurrentRootUsername(user.username);
    }
  }, [user, currentRootUsername]);

  useEffect(() => {
    if (currentRootUsername && token) {
      fetchTree(currentRootUsername);
    }
  }, [currentRootUsername, token]);

  const handleSelectNode = (selectedUsername: string) => {
    if (selectedUsername.toLowerCase() === currentRootUsername.toLowerCase()) return;
    
    // Push current root to history stack before traversing down
    setHistory((prev) => [...prev, currentRootUsername]);
    setCurrentRootUsername(selectedUsername);
    setSearchQuery('');
  };

  const handleGoUp = () => {
    if (history.length === 0) return;
    
    const prevHistory = [...history];
    const previousRoot = prevHistory.pop();
    setHistory(prevHistory);
    if (previousRoot) {
      setCurrentRootUsername(previousRoot);
    }
  };

  const handleResetToMe = () => {
    if (!user) return;
    setHistory([]);
    setCurrentRootUsername(user.username);
    setSearchQuery('');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Clear history when jumping to a searched user, but keep a link back to self
      if (user && searchQuery.toLowerCase() !== user.username.toLowerCase()) {
        setHistory([user.username]);
      } else {
        setHistory([]);
      }
      setCurrentRootUsername(searchQuery.trim());
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 text-sm">Authenticating tree access...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Binary Genealogy Tree</h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Visualize your binary downline network. Click cards to drill down and explore team nodes.
          </p>
        </div>

        {/* Tree controls */}
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={handleGoUp}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-md font-bold text-xs text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowUpCircle size={14} className="text-amber-500" />
              Go Up
            </button>
          )}

          <button
            onClick={handleResetToMe}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-md font-bold text-xs text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCcw size={14} className="text-amber-500" />
            Reset to Me
          </button>
        </div>
      </div>

      {/* Downline Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex w-full md:max-w-md items-center text-xs font-normal">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search downline username..."
              className="w-full bg-slate-950 border border-slate-850 text-slate-200 rounded-l-md px-3.5 py-2.5 focus:outline-none focus:border-amber-500 font-mono"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-0 top-0 bottom-0 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-r-md px-4 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Search size={14} />
            </button>
          </div>
        </form>

        {/* Current Root Breadcrumb display */}
        <div className="flex items-center gap-2 self-start md:self-center font-mono text-[10px] text-slate-500">
          <span>Viewing tree root:</span>
          <span className="bg-slate-950 border border-slate-850 px-2.5 py-1.5 rounded font-black text-amber-400">
            @{currentRootUsername}
          </span>
        </div>
      </div>

      {/* Main tree render block */}
      {error && (
        <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-5 flex items-start gap-3 text-red-400 text-xs font-semibold max-w-xl mx-auto my-8 leading-relaxed">
          <ShieldAlert size={20} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold text-slate-200">Genealogy Lookup Failed</p>
            <p className="mt-1 font-normal text-slate-400">{error}</p>
            <button
              onClick={handleResetToMe}
              className="mt-3.5 bg-red-900 hover:bg-red-800 text-red-100 px-3 py-1.5 rounded font-bold transition-all text-[10px]"
            >
              Reset view to yourself
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-xs font-bold font-mono">Fetching tree downlines...</p>
        </div>
      ) : treeData && !error ? (
        <div className="bg-slate-950 border border-slate-900 rounded-xl overflow-hidden shadow-inner">
          <BinaryTree 
            data={treeData} 
            onSelectNode={handleSelectNode} 
            currentUser={user} 
          />
        </div>
      ) : null}
    </div>
  );
};
