import React, { Fragment } from 'react';
import { useAuth } from '../services/authContext';
import { getProxyMode } from '../services/proxyService';
import { Button } from './UI';
import { Link, useLocation } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile, logout, isAdmin, isParent, isDemo } = useAuth();
  const location = useLocation();
  const proxyMode = getProxyMode();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold">
                    O
                  </div>
                  <span className="font-bold text-xl text-gray-900 tracking-tight">OpenFamilySafe</span>
                </Link>
              </div>
              {currentUser && (
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    to="/"
                    className={`${
                      location.pathname === '/'
                        ? 'border-brand-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    Browse
                  </Link>
                  {isParent && (
                    <Link
                      to="/family"
                      className={`${
                        location.pathname === '/family'
                          ? 'border-brand-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                    >
                      My Family
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className={`${
                        location.pathname === '/admin' 
                          ? 'border-brand-500 text-gray-900' 
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                    >
                      Admin Console
                    </Link>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center">
              {currentUser ? (
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-medium text-gray-900">{userProfile?.displayName || currentUser.email}</div>
                    <div className="text-xs text-gray-500 capitalize">{userProfile?.role.toLowerCase()}</div>
                  </div>
                  <Button variant="ghost" onClick={handleLogout} className="text-sm">
                    Sign out
                  </Button>
                </div>
              ) : (
                <Link to="/login">
                  <Button variant="primary">Sign in</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Legal Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-100 tracking-wider uppercase">Project Info</h3>
              <p className="mt-4 text-xs text-gray-400">
                Open Source Family Proxy Project.<br/>
                Built with React, Firebase, and Cloudflare Workers.<br/>
                <a href="#" className="underline hover:text-white">View Source on GitHub</a>
              </p>
            </div>
            <div className="col-span-2">
              <h3 className="text-sm font-semibold text-gray-100 tracking-wider uppercase mb-2">Legal Disclaimer</h3>
              <div className="text-xs text-gray-400 space-y-2 border-l-2 border-gray-600 pl-4">
                <p>
                  <strong>1. "As Is" Basis:</strong> This software is provided "as is" without warranty of any kind. The developers assume no liability for damages or data loss resulting from the use of this software.
                </p>
                <p>
                  <strong>2. Compliance with Laws:</strong> Users are solely responsible for ensuring that their use of this software complies with all applicable local, state, and federal laws, as well as the Terms of Service of their Internet Service Provider (ISP).
                </p>
                <p>
                  <strong>3. No Circumvention:</strong> This tool should not be used for illegal activities, including but not limited to bypassing copyright protections or engaging in cyber-attacks. The project maintainers are not responsible for any misuse of this software.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center text-xs">
            <p className="mb-4 md:mb-0">&copy; {new Date().getFullYear()} OpenFamilySafe Project. All rights reserved.</p>
            
            {/* System Status Indicators */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
               {/* Auth Status */}
               <div className="flex items-center gap-2 px-3 py-1 bg-gray-900 rounded-full border border-gray-700 shadow-sm">
                  <div className={`h-2 w-2 rounded-full ${isDemo ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                  <span className="text-gray-400 font-medium">
                      Auth: <span className={isDemo ? 'text-yellow-500' : 'text-green-500'}>{isDemo ? 'Simulated' : 'Firebase'}</span>
                  </span>
              </div>

              {/* Proxy Status */}
               <div className="flex items-center gap-2 px-3 py-1 bg-gray-900 rounded-full border border-gray-700 shadow-sm">
                  <div className={`h-2 w-2 rounded-full ${proxyMode === 'LIVE' ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
                  <span className="text-gray-400 font-medium">
                      Proxy: <span className={proxyMode === 'LIVE' ? 'text-blue-500' : 'text-orange-500'}>{proxyMode === 'LIVE' ? 'Cloudflare Worker' : 'Public Demo'}</span>
                  </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};