// ============================================================================
// MARKET ORACLE - USER MENU
// Shows user info, credits, and account options
// Created: December 15, 2025
// ============================================================================

'use client';

import { useState, useRef, useEffect } from 'react';
import { User, CreditCard, LogOut, Settings, Coins, ExternalLink } from 'lucide-react';
import { useAuthContext } from './AuthProvider';

const MAIN_SITE = process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'https://craudiovizai.com';

export default function UserMenu() {
  const { user, credits, subscriptionTier, signOut, loading } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading || !user) return null;

  const tierColors = {
    free: 'text-gray-400',
    starter: 'text-blue-400',
    pro: 'text-purple-400',
    enterprise: 'text-amber-400',
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
          {user.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt="" className="w-8 h-8 rounded-full" />
          ) : (
            <User className="w-4 h-4 text-white" />
          )}
        </div>
        
        {/* Credits */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-amber-500/20 rounded-lg">
          <Coins className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-amber-400">{credits.toLocaleString()}</span>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
          {/* User Info */}
          <div className="p-4 border-b border-gray-700">
            <p className="font-medium text-white truncate">{user.email}</p>
            <p className={`text-sm ${tierColors[subscriptionTier as keyof typeof tierColors]} capitalize`}>
              {subscriptionTier} Plan
            </p>
          </div>

          {/* Credits Section */}
          <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Credits Balance</span>
              <span className="text-lg font-bold text-white">{credits.toLocaleString()}</span>
            </div>
            <a
              href={`${MAIN_SITE}/credits`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors text-sm"
            >
              <CreditCard className="w-4 h-4" />
              Buy Credits
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <a
              href={`${MAIN_SITE}/dashboard`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              Account Settings
              <ExternalLink className="w-3 h-3 ml-auto text-gray-500" />
            </a>
            
            <button
              onClick={async () => {
                await signOut();
                setIsOpen(false);
              }}
              className="flex items-center gap-3 w-full px-3 py-2 text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-gray-800/50 border-t border-gray-700">
            <p className="text-xs text-gray-500 text-center">
              Universal account for all CR AudioViz AI apps
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
