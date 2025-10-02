
import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const activeLinkClass = "bg-primary/10 text-primary";
  const inactiveLinkClass = "text-on-surface-variant hover:bg-primary/5 hover:text-primary";
  const linkClasses = `px-3 py-2 rounded-md text-sm font-medium transition-colors`;

  return (
    <nav className="bg-surface shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <svg className="h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="font-bold text-xl text-on-surface">MVPGen</span>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {user && <NavLink to="/dashboard" className={({isActive}) => `${linkClasses} ${isActive ? activeLinkClass : inactiveLinkClass}`}>Dashboard</NavLink>}
              {user && <NavLink to="/generate-mvp" className={({isActive}) => `${linkClasses} ${isActive ? activeLinkClass : inactiveLinkClass}`}>Generate MVP</NavLink>}
            </div>
          </div>
          <div className="hidden md:block">
            {user ? (
              <div className="ml-4 flex items-center md:ml-6">
                 <div className="relative">
                  <button onClick={() => setMenuOpen(!menuOpen)} className="max-w-xs bg-surface rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-white">
                    <img className="h-8 w-8 rounded-full" src={user.avatar} alt={user.name} />
                  </button>
                  {menuOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-surface ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="px-4 py-2 text-sm text-on-surface-variant border-b border-gray-700">{user.name} ({user.role})</div>
                      <NavLink to="/profile" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-on-surface hover:bg-gray-700 w-full text-left">Profile Settings</NavLink>
                      <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="block px-4 py-2 text-sm text-on-surface hover:bg-gray-700 w-full text-left">Sign out</button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-x-2">
                <Link to="/login" className="px-4 py-2 rounded-md text-sm font-medium text-primary hover:bg-primary/5">Log in</Link>
                <Link to="/signup" className="px-4 py-2 rounded-md text-sm font-medium text-white bg-primary hover:bg-primary/90">Sign up</Link>
              </div>
            )}
          </div>
          <div className="-mr-2 flex md:hidden">
            <button onClick={() => setMenuOpen(!menuOpen)} type="button" className="bg-surface inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-on-surface hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary">
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={!menuOpen ? 'M4 6h16M4 12h16M4 18h16' : 'M6 18L18 6M6 6l12 12'} /></svg>
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
             {user ? (
               <>
                <NavLink to="/dashboard" onClick={() => setMenuOpen(false)} className={({isActive}) => `block ${linkClasses} ${isActive ? activeLinkClass : inactiveLinkClass}`}>Dashboard</NavLink>
                <NavLink to="/generate-mvp" onClick={() => setMenuOpen(false)} className={({isActive}) => `block ${linkClasses} ${isActive ? activeLinkClass : inactiveLinkClass}`}>Generate MVP</NavLink>
                <NavLink to="/profile" onClick={() => setMenuOpen(false)} className={({isActive}) => `block ${linkClasses} ${isActive ? activeLinkClass : inactiveLinkClass}`}>Profile Settings</NavLink>
                <button onClick={handleLogout} className={`block w-full text-left ${linkClasses} ${inactiveLinkClass}`}>Sign out</button>
               </>
             ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className={`block ${linkClasses} ${inactiveLinkClass}`}>Log in</Link>
                <Link to="/signup" onClick={() => setMenuOpen(false)} className={`block ${linkClasses} ${inactiveLinkClass}`}>Sign up</Link>
              </>
             )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;