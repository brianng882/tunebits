import React, { useState, useEffect, useRef } from 'react';

/**
 * ClimbingGame component provides a visual climbing experience
 * @param {number} score - Current score
 * @param {number} maxScore - Maximum possible score
 * @param {boolean} active - Whether the climbing game is active
 * @param {Function} onComplete - Callback when climbing is complete
 * @param {number} difficulty - Difficulty level (1-3)
 */
const ClimbingGame = ({ score = 0, maxScore = 100, active = true, onComplete = () => {}, difficulty = 1 }) => {
  // Player state
  const [playerPosition, setPlayerPosition] = useState(0);
  const [playerJumping, setPlayerJumping] = useState(false);
  const [playerCharacter, setPlayerCharacter] = useState('🧗‍♂️');
  
  // Game elements
  const [obstacles, setObstacles] = useState([]);
  const [terrainColor, setTerrainColor] = useState('');
  
  // Game state
  const animationRef = useRef(null);
  const completedRef = useRef(false);
  
  // Initialize terrain and obstacles
  useEffect(() => {
    // Select terrain color based on difficulty
    const terrainColors = [
      ['from-emerald-800 to-emerald-600', 'from-blue-800 to-blue-600', 'from-purple-800 to-purple-600'],
      ['from-amber-800 to-amber-600', 'from-orange-800 to-orange-600', 'from-red-800 to-red-600'],
      ['from-slate-800 to-slate-600', 'from-gray-800 to-gray-600', 'from-zinc-800 to-zinc-600']
    ];
    
    // Randomly select a terrain color
    const levelIndex = Math.min(difficulty - 1, 2);
    const colorIndex = Math.floor(Math.random() * 3);
    setTerrainColor(terrainColors[levelIndex][colorIndex]);
    
    // Generate random obstacles
    const obstacleCount = 5 + (difficulty * 2);
    const newObstacles = Array(obstacleCount).fill().map((_, i) => ({
      id: `obs-${i}`,
      type: Math.random() > 0.7 ? 'rock' : 'branch',
      position: 10 + Math.random() * 80, // Position along width (%)
      height: 10 + (i * (80 / obstacleCount)), // Height along climbing path (%)
      size: 1 + Math.random() * difficulty // Size factor
    }));
    
    setObstacles(newObstacles);
    
    // Reset completed state
    completedRef.current = false;
    
    // Select random character
    const characters = ['🧗‍♂️', '🧗‍♀️', '🧗', '🐒', '🐱', '🦊'];
    setPlayerCharacter(characters[Math.floor(Math.random() * characters.length)]);
    
  }, [difficulty]);
  
  // Update player position based on score
  useEffect(() => {
    // Calculate position percentage
    const newPosition = Math.min((score / maxScore) * 100, 100);
    setPlayerPosition(newPosition);
    
    // Check if player reached the top
    if (newPosition >= 100 && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  }, [score, maxScore, onComplete]);
  
  // Handle player jumping
  const handlePlayerClick = () => {
    if (!active) return;
    
    setPlayerJumping(true);
    setTimeout(() => setPlayerJumping(false), 500);
  };
  
  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg">
      {/* Background terrain */}
      <div className={`absolute inset-0 bg-gradient-to-t ${terrainColor}`}></div>
      
      {/* Obstacles */}
      {obstacles.map(obstacle => (
        <div 
          key={obstacle.id}
          className={`absolute z-10 transform ${obstacle.type === 'rock' ? 'text-gray-700' : 'text-amber-800'}`}
          style={{ 
            left: `${obstacle.position}%`, 
            bottom: `${obstacle.height}%`,
            fontSize: `${obstacle.size * 1.2}rem`,
            transform: 'translate(-50%, 50%)'
          }}
        >
          {obstacle.type === 'rock' ? '🪨' : '🌲'}
        </div>
      ))}
      
      {/* Goal/Summit */}
      <div className="absolute top-0 left-0 right-0 flex justify-center items-center h-16 bg-gradient-to-b from-white to-transparent z-20">
        <div className="text-2xl">🏁</div>
      </div>
      
      {/* Player character */}
      <div
        onClick={handlePlayerClick}
        className={`absolute z-30 transition-all duration-700 text-3xl transform -translate-x-1/2 cursor-pointer
          ${playerJumping ? 'animate-bounce' : ''} 
          ${active ? 'drop-shadow-glow' : 'opacity-70'}
        `}
        style={{ 
          left: '50%',
          bottom: `${playerPosition}%`,
        }}
      >
        {playerCharacter}
      </div>
      
      {/* Instructions */}
      {playerPosition < 5 && (
        <div className="absolute bottom-2 left-0 right-0 text-center text-white text-xs bg-black bg-opacity-50 py-1">
          Click the climber to jump!
        </div>
      )}
      
      {/* Victory message */}
      {playerPosition >= 100 && (
        <div className="absolute top-1/3 left-0 right-0 text-center">
          <div className="bg-black bg-opacity-70 mx-auto py-2 px-4 rounded-full text-lg animate-pulse">
            🏆 Summit reached!
          </div>
        </div>
      )}
    </div>
  );
};

export default ClimbingGame; 