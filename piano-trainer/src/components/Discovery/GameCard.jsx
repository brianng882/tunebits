import React from 'react';
import { Link } from 'react-router-dom';

function GameCard({ game, level }) {
  // Don't render links for locked games
  const isLocked = game.locked === true;
  
  return (
    <Link 
      to={isLocked ? '#' : `/game/${level}/${game.id}`} 
      className={`block transition-all duration-300 ${isLocked ? 'cursor-not-allowed opacity-70' : 'transform hover:scale-105'}`}
    >
      <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-xl border border-gray-700">
        {/* Difficulty indicator */}
        <div className="absolute top-3 right-3 flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i} 
              className={`w-2 h-6 rounded-full ${i < (game.difficulty || 1) ? 'bg-yellow-500' : 'bg-gray-600'}`}
            ></div>
          ))}
        </div>
        
        {/* Lock overlay for locked games */}
        {isLocked && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <div className="text-4xl">🔒</div>
          </div>
        )}
        
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-4xl mr-4 shadow-glow">
              {game.icon || '🎹'}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{game.title}</h3>
              {game.highScore !== undefined && (
                <div className="flex items-center text-sm text-gray-400">
                  <span className="mr-3">🏆 {game.highScore || 0}</span>
                  <span>🎮 {game.playCount || 0} plays</span>
                </div>
              )}
            </div>
          </div>
          
          <p className="text-gray-300 text-sm mb-4">{game.description}</p>
          
          {/* Reward section */}
          {game.reward && (
            <div className="bg-gradient-to-r from-purple-900 to-purple-800 p-3 rounded-lg text-sm flex items-center">
              <span className="text-xl mr-2">🎁</span>
              <span className="text-purple-200">{game.reward}</span>
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        .shadow-glow {
          box-shadow: 0 0 15px rgba(102, 126, 234, 0.5);
        }
      `}</style>
    </Link>
  );
}

export default GameCard; 