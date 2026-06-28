import React, { useMemo, useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useMetaMask from "../hooks/useMetaMask";

// Reusable SVG Icons
const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);
// Dropdown menu Avatar Profile Icon
const UserAvatar = ({ username }) => (
  <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm cursor-pointer hover:ring-2 hover:ring-indigo-300 transition-all">
    {username ? username.charAt(0).toUpperCase() : "U"}
  </div>
);

const Header = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { walletAddress, formattedAddress, connect } = useMetaMask();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  const showAdmin = isAdmin;

  const navLinks = useMemo(
    () => [
      { to: "/home", title: "Home", show: true },
      { to: "/store", title: "Store", show: true },
      { to: "/social", title: "Social", show: true },
      { to: "/user", title: "Chat", show: true },
      { to: "/admin", title: "Admin", show: showAdmin },
    ],
    [showAdmin]
  );

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = (event) => {
    event.preventDefault();
    logout();
    setProfileDropdownOpen(false);
  };

  const copyWallet = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(walletAddress);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E2E8F0] bg-white/80 backdrop-blur-md transition-shadow hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="mx-auto flex h-[70px] max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left: Logo */}
        <Link to="/home" className="flex items-center gap-2 flex-shrink-0">
          <img src="./MetasphereswithTagLine.png" alt="MetaBrain" className="h-8 w-auto object-contain" />
        </Link>

        {/* Center: Navigation */}
        <nav className="hidden md:flex items-center space-x-2">
          {navLinks.filter(l => l.show).map(link => {
            const isActive = location.pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded-full text-[15px] font-medium transition-all duration-200 ease-in-out
                  ${isActive 
                    ? "bg-slate-100 text-[#0F172A]" 
                    : "text-[#475569] hover:bg-slate-100 hover:text-[#0F172A]"}`}
              >
                {link.title}
              </Link>
            );
          })}
        </nav>

        {/* Right: Wallet + User + CTA */}
        <div className="hidden md:flex items-center space-x-4">
          
          {/* Wallet Badge */}
          {walletAddress ? (
            <button 
              onClick={copyWallet}
              className="group relative flex items-center space-x-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all duration-200 hover:-translate-y-[1px] hover:border-slate-300 hover:shadow-md focus:outline-none"
            >
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              <span>{formattedAddress}</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-slate-400">
                <CopyIcon />
              </span>
            </button>
          ) : (
            <button
              onClick={connect}
              className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[15px] font-medium text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            >
              Connect Wallet
            </button>
          )}

          {/* User Section */}
          {isAuthenticated ? (
            <div className="relative flex items-center gap-3" ref={dropdownRef}>
              {/* Optional CTA */}
              <Link 
                to="/store"
                className="hidden lg:block rounded-[10px] bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] px-4 py-1.5 text-[14px] font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md"
              >
                Launch App
              </Link>
              
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center focus:outline-none transition-transform duration-200 hover:-translate-y-[1px]"
              >
                <UserAvatar username={user?.username} />
              </button>

              {/* Dropdown Menu */}
              <div 
                className={`absolute right-0 top-[120%] mt-2 w-56 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 transition-all duration-200 ease-in-out
                  ${profileDropdownOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}
              >
                <div className="py-1">
                  <div className="px-4 py-3 border-b border-slate-100 mb-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{user?.username}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
                  </div>
                  <Link to="/profile" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors" onClick={() => setProfileDropdownOpen(false)}>
                    Profile
                  </Link>
                  <button 
                    onClick={() => { copyWallet(); setProfileDropdownOpen(false); }}
                    className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    Wallet
                  </button>
                  <Link to="/settings" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors" onClick={() => setProfileDropdownOpen(false)}>
                    Settings
                  </Link>
                  <div className="border-t border-slate-100 mt-1"></div>
                  <button 
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 mt-1 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <Link to="/login" className="text-[15px] font-medium text-[#475569] hover:text-[#0F172A] transition-colors">
                Log In
              </Link>
              <Link to="/register" className="rounded-[10px] bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] px-4 py-1.5 text-[14px] font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md">
                Sign Up
              </Link>
            </>
          )}

        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-2 pb-4 shadow-lg absolute w-full left-0">
          <nav className="flex flex-col space-y-1">
            {navLinks.filter(l => l.show).map((link) => {
              const isActive = location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`block rounded-lg px-3 py-2 text-base font-medium transition-colors
                    ${isActive ? 'bg-slate-50 text-indigo-600' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  {link.title}
                </Link>
              );
            })}
            
            <div className="my-2 border-t border-slate-100"></div>
            
            {!isAuthenticated && (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50">
                  Log In
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-base font-medium text-indigo-600 hover:bg-slate-50">
                  Sign Up
                </Link>
              </>
            )}

            {walletAddress ? (
              <div className="px-3 py-2 text-sm text-slate-600 break-all">
                Wallet: {formattedAddress}
              </div>
            ) : (
              <button
                onClick={() => { connect(); setMenuOpen(false); }}
                className="w-full mt-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-center text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Connect Wallet
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
