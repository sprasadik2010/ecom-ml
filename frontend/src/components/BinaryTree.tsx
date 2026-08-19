import React from 'react';
import { User } from '../context/AuthContext';
import { User as UserIcon, Plus, ArrowUp, Zap, HelpCircle } from 'lucide-react';
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

  // Helper to render a node card
  const renderNodeCard = (node: TreeData) => {
    const isActive = node.status === 'active';
    const isRootNode = node.username.toLowerCase() === currentUser.username.toLowerCase();

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

  // Recursive Tree Renderer
  // We render 3 levels: Root, Children (L1), and Grandchildren (L2)
  const renderTree = (node: TreeData | null, depth = 0): React.ReactNode => {
    if (!node) return null;

    const hasChildren = node.left_child || node.right_child;

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

  return (
    <div className="w-full py-8 flex flex-col items-center px-2 sm:px-4">
      {/* Legend & Instructions */}
      <div className="max-w-xl bg-slate-900 border border-slate-800 rounded-lg p-3.5 mb-6 text-xs text-slate-300 w-full">
        <h4 className="font-bold text-slate-100 mb-2.5 flex items-center gap-1.5">
          <Zap size={14} className="text-amber-500" />
          Binary Genealogy Tree Guide
        </h4>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] mb-2">
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
        <p className="text-[10px] text-slate-500 mt-2 border-t border-slate-850 pt-2">
          💡 **Navigation**: Click any user card to set them as the temporary root and explore their downline down to 3 levels.
        </p>
      </div>

      {/* Render the Tree Hierarchy inside a scrollable container */}
      <div className="w-full overflow-x-auto flex justify-start md:justify-center p-4">
        <div className="min-w-[800px] flex justify-center py-2">
          {renderTree(data)}
        </div>
      </div>
    </div>
  );
};
