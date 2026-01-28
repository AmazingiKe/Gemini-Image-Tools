import React, { useState, useRef, useEffect } from 'react';
import { 
  ImageIcon, 
  Settings, 
  Moon, 
  Sun, 
  ChevronDown, 
  Check,
  LayoutDashboard,
  History,
  User as UserIcon,
  LogOut,
  Sliders,
  Shield,
  MessageSquare,
  UserCircle
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface TopBarProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenConfig: () => void;
  model: string;
  setModel: (model: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  isDark,
  onToggleTheme,
  onOpenConfig,
  model,
  setModel
}) => {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: '/', label: '工作台', icon: LayoutDashboard },
    { id: '/history', label: '历史库', icon: History },
  ];

  const models = [
    { id: 'gemini-3-pro-image', name: 'Gemini 3 Pro', color: '#4285F4' },
    { id: 'dall-e-3', name: 'DALL-E 3', color: '#10a37f' },
  ];

  return (
    <div className="h-[48px] bg-[#F5F5F7] dark:bg-[#1d1d1f] text-[#1d1d1f] dark:text-[#f5f5f7] flex items-center justify-between px-4 shrink-0 z-50 shadow-sm select-none font-sans transition-colors duration-300 sticky top-0 backdrop-blur-xl bg-opacity-80 dark:bg-opacity-80 border-b border-gray-200 dark:border-[#424245]">

      {/* Left: Logo */}
      <div className="flex items-center w-[200px] shrink-0">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-black dark:bg-white p-1 rounded-md shadow-sm group-hover:scale-105 transition-transform">
            <ImageIcon className="text-white dark:text-black w-3.5 h-3.5" />
          </div>
          <span className="font-bold tracking-tight text-[12px] text-black dark:text-white">Gemini Image Tools</span>
        </Link>
      </div>

      {/* Center: Navigation Links */}
      <div className="flex-1 min-w-0 flex items-center justify-center h-full gap-1">
          {navItems.map(item => {
              const isActive = location.pathname === item.id;
              return (
                  <Link
                      key={item.id}
                      to={item.id}
                      className={`
                          px-4 h-full text-[11px] font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap border-b-2
                          ${isActive
                            ? 'text-black dark:text-white border-black dark:border-white'
                            : 'text-gray-500 dark:text-[#a1a1a6] hover:text-black dark:hover:text-[#f5f5f7] border-transparent'}
                      `}
                  >
                      {item.label}
                  </Link>
              );
          })}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center justify-end gap-2 w-[200px] shrink-0">
        
        {/* Model Selector */}
        <div className="relative" ref={modelDropdownRef}>
          <button
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
            className="flex items-center gap-2 text-[10px] font-bold text-gray-700 dark:text-[#e8e8ed] hover:text-black dark:hover:text-white transition-all bg-white dark:bg-[#333336] hover:bg-gray-50 dark:hover:bg-[#3a3a3d] border border-gray-200 dark:border-[#424245] px-2.5 py-1.2 rounded-md shadow-sm"
          >
            <div 
              className="w-1.5 h-1.5 rounded-full" 
              style={{ backgroundColor: models.find(m => m.id === model)?.color || '#ccc' }}
            />
            <span className="truncate max-w-[80px]">{models.find(m => m.id === model)?.name}</span>
            <ChevronDown size={8} className={`opacity-40 transition-transform duration-200 ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isModelDropdownOpen && (
            <div className="absolute top-full right-0 mt-1 w-40 bg-white/95 dark:bg-[#1d1d1f]/95 backdrop-blur-xl rounded-lg shadow-2xl border border-gray-200 dark:border-[#424245] py-1 z-50 animate-in fade-in zoom-in-95 origin-top-right overflow-hidden">
              {models.map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    setModel(m.id);
                    setIsModelDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-medium transition-colors ${
                    model === m.id 
                      ? 'bg-gray-100 dark:bg-[#333336] text-black dark:text-white' 
                      : 'text-gray-600 dark:text-[#a1a1a6] hover:bg-gray-50 dark:hover:bg-[#333336] hover:text-black dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.color }} />
                    <span>{m.name}</span>
                  </div>
                  {model === m.id && <Check size={10} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <button 
          onClick={onToggleTheme}
          className="p-1.5 text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-[#333336] rounded-md transition-all"
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        <button 
          onClick={onOpenConfig}
          className="p-1.5 text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-[#333336] rounded-md transition-all"
        >
          <Settings size={14} />
        </button>

      </div>
    </div>
  );
};
