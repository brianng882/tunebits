import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar() {
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Mock user data - in a real app this would come from context or redux
  const userData = {
    username: 'MusicExplorer',
    level: 12,
    notifications: 3,
    coins: 1250,
  };
  
  // Determine if we should show navbar on certain pages
  const isGamePage = location.pathname.includes('/game/');
  if (isGamePage) return null; // Don't show navbar on game pages
  
  return (
    <nav className="bg-gray-900 text-white shadow-lg border-b border-blue-700">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center group">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl mr-2 group-hover:shadow-glow transition-all">
            🎮
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
            TuneBits
          </span>
        </Link>
        
        {/* Middle nav links */}
        <div className="hidden md:flex items-center space-x-1">
          <NavLink to="/" active={location.pathname === '/'}>Home</NavLink>
          <NavLink to="/discovery" active={location.pathname === '/discovery'}>Games</NavLink>
          <NavLink to="#" active={false}>Leaderboard</NavLink>
          <NavLink to="#" active={false}>Tournaments</NavLink>
        </div>
        
        {/* User profile & notifications */}
        <div className="flex items-center space-x-4">
          {/* Coins display */}
          <div className="hidden md:flex items-center bg-gray-800 px-3 py-1 rounded-full">
            <span className="text-yellow-400 mr-1">🪙</span>
            <span className="font-medium">{userData.coins}</span>
          </div>
          
          {/* Notification button */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="bg-gray-800 p-2 rounded-full hover:bg-gray-700 transition-colors"
            >
              <span className="text-lg">🔔</span>
              {userData.notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {userData.notifications}
                </span>
              )}
            </button>
            
            {/* Notifications dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-gray-800 rounded-lg shadow-xl z-50 border border-gray-700">
                <div className="p-3 border-b border-gray-700">
                  <h3 className="font-bold">Notifications</h3>
                </div>
                <div className="p-3 border-b border-gray-700">
                  <div className="text-sm mb-2">
                    <span className="text-green-400 mr-2">🏆</span>
                    <span>You earned the "Perfect Scale" badge!</span>
                  </div>
                  <div className="text-xs text-gray-400">2 hours ago</div>
                </div>
                <div className="p-3 border-b border-gray-700">
                  <div className="text-sm mb-2">
                    <span className="text-blue-400 mr-2">👋</span>
                    <span>PianoWizard wants to challenge you!</span>
                  </div>
                  <div className="text-xs text-gray-400">Yesterday</div>
                </div>
                <div className="p-3">
                  <div className="text-sm mb-2">
                    <span className="text-purple-400 mr-2">🎵</span>
                    <span>New Interval Training game is available!</span>
                  </div>
                  <div className="text-xs text-gray-400">3 days ago</div>
                </div>
              </div>
            )}
          </div>
          
          {/* User profile */}
          <Link to="#" className="flex items-center">
            <div className="hidden md:block text-right mr-3">
              <div className="font-medium">{userData.username}</div>
              <div className="text-xs text-blue-300">Level {userData.level}</div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-lg">👤</span>
            </div>
          </Link>
        </div>
      </div>
      
      {/* Mobile menu (only shown on small screens) */}
      <div className="md:hidden border-t border-gray-700 px-4 py-2">
        <div className="flex justify-between">
          <NavLink to="/" active={location.pathname === '/'}>Home</NavLink>
          <NavLink to="/discovery" active={location.pathname === '/discovery'}>Games</NavLink>
          <NavLink to="#" active={false}>Leaderboard</NavLink>
          <NavLink to="#" active={false}>Tournaments</NavLink>
        </div>
      </div>
      
      <style jsx>{`
        .shadow-glow {
          box-shadow: 0 0 15px rgba(102, 126, 234, 0.5);
        }
      `}</style>
    </nav>
  );
}

// Helper component for navigation links
function NavLink({ to, active, children }) {
  return (
    <Link 
      to={to} 
      className={`px-3 py-2 rounded-lg font-medium transition-colors ${
        active 
          ? 'bg-blue-700 text-white' 
          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
      }`}
    >
      {children}
    </Link>
  );
}

export default Navbar; 