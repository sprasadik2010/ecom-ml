import React, { useState, useEffect, useRef } from 'react';
import { User } from '../context/AuthContext';
import { User as UserIcon, Plus, ArrowUp, Zap, List, Layers, Move } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface TreeData {
  id: number;
  username: string;
  full_name: string;
  status: 'active' | 'inactive';
  position: 'left' | 'right' | null;
  personal_sw: number;
  left_leg_sw: number;
  right_leg_sw: number;
  total_left_sw: number;
  total_right_sw: number;
  left_child: TreeData | null;
  right_child: TreeData | null;
}

interface BinaryTreeProps {
  data: TreeData;
  onSelectNode: (username: string) => void;
  currentUser: User;
}

export const BinaryTree: React.FC<BinaryTreeProps> = ({ data, onSelectNode, currentUser }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'visual' | 'list'>('visual');

  // Drag scroll ref & states for Visual Tree
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftVal, setScrollLeftVal] = useState(0);

  // Auto-center root node on data or view mode changes
  useEffect(() => {
    if (viewMode === 'visual' && containerRef.current) {
      const container = containerRef.current;
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;
      if (scrollWidth > clientWidth) {
        container.scrollLeft = (scrollWidth - clientWidth) / 2;
      }
    }
  }, [data, viewMode]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeftVal(containerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Scroll speed multiplier
    containerRef.current.scrollLeft = scrollLeftVal - walk;
  };

  // Helper to render a node card
  const renderNodeCard = (node: TreeData) => {
    const isActive = node.status === 'active';

    return (
      <div 
        onClick={() => onSelectNode(node.username)}
        className={`w-52 p-3 bg-slate-900 border rounded-lg shadow-md cursor-pointer transition-all hover:scale-105 select-none relative ${
          isActive 
            ? 'border-emerald-500/50 hover:border-emerald-400 hover:shadow-emerald-950/20' 
            : 'border-red-500/50 hover:border-red-400 hover:shadow-red-950/20'
        }`}
      >
        {/* Node status glow */}
        <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-lg ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />

        <div className="flex items-center gap-1.5 justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">
            {node.position ? `${node.position} leg` : 'Root'}
          </span>
          <span className={`inline-flex h-2 w-2 rounded-full ${isActive ? 'bg-emerald-500 shadow-emerald-500' : 'bg-red-500 shadow-red-500'} animate-pulse`}></span>
        </div>

        {/* Username */}
        <div className="flex items-center gap-2 mt-1.5">
          <div className={`p-1 rounded-full ${isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            <UserIcon size={14} />
          </div>
          <span className="font-extrabold text-slate-100 text-xs truncate max-w-[120px]" title={node.full_name}>
            @{node.username}
          </span>
        </div>
        
        <div className="text-[10px] text-slate-400 truncate mt-0.5">{node.full_name}</div>

        <div className="border-t border-slate-800 my-2" />

        {/* Volume Stats */}
        <div className="grid grid-cols-2 gap-1 text-[9px] font-mono leading-tight">
          <div className="flex flex-col">
            <span className="text-slate-500 uppercase text-[7px] leading-none">Left Leg</span>
            <span className="text-slate-200 font-bold leading-none mt-1">L: {node.left_leg_sw} SW</span>
            <span className="text-[7px] text-slate-500 mt-0.5">T: {node.total_left_sw}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-slate-500 uppercase text-[7px] leading-none">Right Leg</span>
            <span className="text-slate-200 font-bold leading-none mt-1">R: {node.right_leg_sw} SW</span>
            <span className="text-[7px] text-slate-500 mt-0.5">T: {node.total_right_sw}</span>
          </div>
        </div>

        <div className="mt-1.5 pt-1 border-t border-slate-850 flex items-center justify-between text-[8px] text-slate-400">
          <span>Personal:</span>
          <span className="font-bold text-amber-400 font-mono">{node.personal_sw} SW</span>
        </div>
      </div>
    );
  };

  // Helper to render an empty registerable slot
  const renderEmptySlot = (parentUsername: string, position: 'left' | 'right') => {
    const handleRegisterClick = () => {
      // Redirect to register page pre-populating sponsor and parent positions
      navigate(`/register?sponsor=${parentUsername}&position=${position}`);
    };

    return (
      <div 
        onClick={handleRegisterClick}
        className="w-52 p-4 bg-slate-900/40 border border-dashed border-slate-700 hover:border-amber-500/50 hover:bg-slate-900/80 rounded-lg shadow-sm flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 group"
      >
        <div className="p-1.5 bg-slate-850 group-hover:bg-amber-500/10 group-hover:text-amber-400 text-slate-500 rounded-full mb-1 transition-colors">
          <Plus size={16} />
        </div>
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider group-hover:text-slate-200 transition-colors">
          Add {position} Node
        </span>
        <span className="text-[8px] text-slate-500 mt-0.5">Click to place member</span>
      </div>
    );
  };

  // Helper to render empty slot list for Directory View
  const renderEmptySlotList = (parentUsername: string, position: 'left' | 'right') => {
    const handleRegisterClick = () => {
      navigate(`/register?sponsor=${parentUsername}&position=${position}`);
    };

    return (
      <div 
        onClick={handleRegisterClick}
        className="flex items-center gap-2.5 p-2 px-3.5 bg-slate-900 border border-dashed border-slate-700 hover:border-amber-500/50 hover:bg-slate-900/80 rounded-lg cursor-pointer transition-all w-fit group select-none"
      >
        <Plus size={12} className="text-slate-500 group-hover:text-amber-500 transition-colors" />
        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider group-hover:text-slate-200 transition-colors">
          Add {position} Node under @{parentUsername}
        </span>
      </div>
    );
  };

  // Recursive Tree Renderer
  // We render 3 levels: Root, Children (L1), and Grandchildren (L2)
  const renderTree = (node: TreeData | null, depth = 0): React.ReactNode => {
    if (!node) return null;

    return (
      <div className="flex flex-col items-center">
        {/* Render current node */}
        {renderNodeCard(node)}

        {/* Render lines to children (SVG or border layout) */}
        {depth < 2 && (
          <div className="flex flex-col items-center w-full mt-4">
            {/* Vertical connector line */}
            <div className="w-0.5 h-4 bg-slate-700" />
            
            {/* Horizontal bridge line connecting left and right children */}
            <div className="w-1/2 flex items-center justify-between border-t border-slate-700 relative">
              <div className="w-0.5 h-4 bg-slate-700 absolute left-0 top-0" />
              <div className="w-0.5 h-4 bg-slate-700 absolute right-0 top-0" />
            </div>

            {/* Children grid */}
            <div className="grid grid-cols-2 gap-8 w-full mt-0">
              {/* Left Side */}
              <div className="flex justify-end pr-2">
                {node.left_child ? (
                  renderTree(node.left_child, depth + 1)
                ) : (
                  renderEmptySlot(node.username, 'left')
                )}
              </div>

              {/* Right Side */}
              <div className="flex justify-start pl-2">
                {node.right_child ? (
                  renderTree(node.right_child, depth + 1)
                ) : (
                  renderEmptySlot(node.username, 'right')
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Recursive Directory List Renderer
  const renderDirectoryListNode = (node: TreeData, depth = 0): React.ReactNode => {
    const isActive = node.status === 'active';
    const isRoot = depth === 0;

    return (
      <div key={node.username} className="flex flex-col w-full">
        {/* Node card for list */}
        <div 
          className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-900 border rounded-xl shadow-sm transition-all hover:border-slate-800 select-none ${
            depth > 0 ? 'ml-6 sm:ml-8 relative' : ''
          } ${
            isActive 
              ? 'border-emerald-500/30' 
              : 'border-red-500/30'
          }`}
        >
          {/* Connector Line for Indented Nodes */}
          {depth > 0 && (
            <div className="absolute left-[-16px] sm:left-[-20px] top-1/2 w-4 sm:w-5 h-0.5 bg-slate-800" />
          )}

          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              <UserIcon size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span 
                  onClick={() => onSelectNode(node.username)}
                  className="font-extrabold text-slate-100 text-xs sm:text-sm hover:underline cursor-pointer"
                >
                  @{node.username}
                </span>
                <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                  isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {node.status}
                </span>
                {node.position && (
                  <span className="text-[8px] sm:text-[9px] uppercase font-bold text-slate-500 font-mono">
                    {node.position} leg
                  </span>
                )}
              </div>
              <div className="text-slate-400 text-[10px] sm:text-xs mt-0.5">{node.full_name}</div>
            </div>
          </div>

          <div className="mt-3 sm:mt-0 flex flex-wrap items-center gap-3 text-[10px] font-mono text-slate-400 border-t border-slate-850 pt-2.5 sm:pt-0 sm:border-0">
            <div className="flex gap-3">
              <div>
                <span className="text-slate-500 uppercase text-[8px]">Left:</span>{' '}
                <span className="font-bold text-slate-200">{node.left_leg_sw} SW</span>
                <span className="text-slate-500 text-[8px] ml-1">({node.total_left_sw})</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase text-[8px]">Right:</span>{' '}
                <span className="font-bold text-slate-200">{node.right_leg_sw} SW</span>
                <span className="text-slate-500 text-[8px] ml-1">({node.total_right_sw})</span>
              </div>
            </div>
            <div className="sm:border-l sm:border-slate-800 sm:pl-3">
              <span className="text-slate-500 uppercase text-[8px]">Personal:</span>{' '}
              <span className="font-bold text-amber-400">{node.personal_sw} SW</span>
            </div>
            {/* Action to drill down */}
            {!isRoot && (
              <button
                onClick={() => onSelectNode(node.username)}
                className="ml-auto sm:ml-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-slate-600 rounded text-[9px] font-bold transition-colors cursor-pointer"
              >
                Focus
              </button>
            )}
          </div>
        </div>

        {/* Children section wrapper */}
        {depth < 2 && (
          <div className="flex flex-col relative mt-2 mb-2 pl-6 sm:pl-8">
            {/* Vertical connector line joining left and right children */}
            <div className="absolute left-[9px] top-0 bottom-6 w-0.5 bg-slate-800" />

            {/* Left child */}
            <div className="flex flex-col w-full my-1">
              {node.left_child ? (
                renderDirectoryListNode(node.left_child, depth + 1)
              ) : (
                <div className="ml-6 sm:ml-8 relative py-1">
                  <div className="absolute left-[-16px] sm:left-[-20px] top-1/2 w-4 sm:w-5 h-0.5 bg-slate-800" />
                  {renderEmptySlotList(node.username, 'left')}
                </div>
              )}
            </div>

            {/* Right child */}
            <div className="flex flex-col w-full my-1">
              {node.right_child ? (
                renderDirectoryListNode(node.right_child, depth + 1)
              ) : (
                <div className="ml-6 sm:ml-8 relative py-1">
                  <div className="absolute left-[-16px] sm:left-[-20px] top-1/2 w-4 sm:w-5 h-0.5 bg-slate-800" />
                  {renderEmptySlotList(node.username, 'right')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full py-6 flex flex-col items-center px-2 sm:px-4">
      {/* Legend & Instructions */}
      <div className="max-w-xl bg-slate-900 border border-slate-800 rounded-lg p-3.5 mb-6 text-xs text-slate-300 w-full flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <h4 className="font-bold text-slate-100 flex items-center gap-1.5">
            <Zap size={14} className="text-amber-500" />
            Binary Genealogy Tree Guide
          </h4>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('visual')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                viewMode === 'visual'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers size={12} />
              Visual Tree
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List size={12} />
              Directory List
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] border-t border-slate-850 pt-2.5">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500 block"></span>
            <span>Active Member</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500 block"></span>
            <span>Inactive Member</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 border border-dashed border-slate-500 rounded block bg-slate-900/40"></span>
            <span>Available Slot</span>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 mt-1 border-t border-slate-850 pt-2 flex flex-col gap-1">
          <p>💡 **Navigation**: Click any user card (or focus button) to drill down and explore their downline up to 3 levels.</p>
          {viewMode === 'visual' && (
            <p className="flex items-center gap-1 text-[9px] text-slate-500 font-mono mt-0.5">
              <Move size={10} className="text-amber-500 animate-pulse" />
              Tip: You can drag/swipe the tree horizontally to pan.
            </p>
          )}
        </div>
      </div>

      {viewMode === 'visual' ? (
        <div className="w-full relative">
          {/* Scroll indicators/hints for mobile in visual mode */}
          <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-slate-900/80 border border-slate-800 p-1.5 rounded-full shadow-md pointer-events-none md:hidden animate-pulse">
            <ArrowUp className="-rotate-90 text-amber-500 animate-pulse" size={14} />
          </div>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-900/80 border border-slate-800 p-1.5 rounded-full shadow-md pointer-events-none md:hidden animate-pulse">
            <ArrowUp className="rotate-90 text-amber-500 animate-pulse" size={14} />
          </div>

          {/* Render the Tree Hierarchy inside a scrollable container */}
          <div 
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className={`w-full overflow-x-auto flex justify-start p-4 ${
              isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
            }`}
          >
            <div className="min-w-[800px] flex justify-center py-2 mx-auto">
              {renderTree(data)}
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-4xl p-4 bg-slate-950 rounded-xl border border-slate-900">
          {renderDirectoryListNode(data)}
        </div>
      )}
    </div>
  );
};
