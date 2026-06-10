import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, LogOut, Building2, Menu } from 'lucide-react';
import authService from '../services/api';

export default function Header({ showAuth = false, onHamburgerClick = () => {} }) {
  const [open, setOpen] = useState(false);
  const [user] = useState(() => authService.getCurrentUserFromStorage());
  const ref = useRef();

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }

    // use a capturing mousedown to reliably detect outside clicks
    document.addEventListener('mousedown', onDoc, true);
    return () => document.removeEventListener('mousedown', onDoc, true);
  }, []);

  const handleLogout = () => {
    authService.logoutAndRedirect();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[rgba(0,0,0,0.1)] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 px-4 md:px-8 py-4 md:py-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button onClick={onHamburgerClick} className="md:hidden p-2 rounded-md mr-1">
            <Menu className="h-5 w-5 text-slate-700" />
          </button>

          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
            <Building2 className="h-5 w-5 text-green-700" />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-lg md:text-xl m-0" style={{ fontFamily: 'Merriweather, serif', fontWeight: 700, color: '#1F2937' }}>
              EstatesComplaint
            </h1>
            <p className="text-xs text-[#6B7280] mt-1 m-0">
              Makerere University Estates Department
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 md:gap-3">
          {!showAuth && (
            <>
              <span className="text-xs md:text-sm text-[#1F2937]">New user?</span>
              <Link 
                to="/register" 
                className="text-xs md:text-sm text-green-700 no-underline hover:text-green-800 transition-colors font-medium"
              >
                Create Account
              </Link>
            </>
          )}

          {showAuth && (
            <div className="relative" ref={ref}>
              <button
                type="button"
                onClick={() => setOpen((s) => !s)}
                className="flex items-center gap-2 rounded-full px-3 py-1 border border-transparent hover:border-green-200 transition-all hover:bg-green-50"
              >
                {/* Avatar */}
                <div className="h-8 w-8 rounded-full bg-green-700 text-white flex items-center justify-center font-semibold text-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                
                {/* User Name */}
                <span className="hidden sm:block text-sm text-[#1F2937] font-medium">
                  {user?.name || user?.email || 'User'}
                </span>
                
                {/* Chevron Icon */}
                <ChevronDown size={16} className="text-green-700" />
              </button>

              {/* Dropdown Menu */}
              {open && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-green-100 shadow-lg rounded-md z-50 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
                  {/* User Info Section */}
                  <div className="p-3 border-b border-green-100">
                    <p className="text-sm font-semibold text-[#1F2937] m-0">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-[#6B7280] m-0 truncate">
                      {user?.email}
                    </p>
                  </div>
                  
                  {/* Logout Button */}
                  <div className="p-2">
                    <button 
                      onClick={handleLogout} 
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1F2937] hover:bg-green-50 rounded-md transition-colors"
                    >
                      <LogOut size={16} className="text-green-700" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}