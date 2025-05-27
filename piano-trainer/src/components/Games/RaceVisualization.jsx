import React, { useState, useEffect, useRef } from 'react';

/**
 * RaceVisualization component provides a visual racing experience
 * @param {number} score - Current user score
 * @param {number} maxScore - Maximum possible score
 * @param {boolean} isActive - Whether the race is active
 * @param {Function} onComplete - Callback when race is complete
 * @param {number} difficulty - Difficulty level (1-3)
 */
const RaceVisualization = ({ score = 0, maxScore = 15, isActive = true, onComplete = () => {}, difficulty = 1 }) => {
  // Player positions (0-100%)
  const [playerPosition, setPlayerPosition] = useState(0);
  const [opponent1Position, setOpponent1Position] = useState(0);
  const [opponent2Position, setOpponent2Position] = useState(0);
  
  // Race state
  const [raceFinished, setRaceFinished] = useState(false);
  const [winner, setWinner] = useState(null);
  
  // Animation refs
  const animationRef = useRef(null);
  const lastUpdateTime = useRef(Date.now());
  
  // Car emojis
  const cars = ['🏎️', '🚗', '🚙'];
  const playerCar = cars[0];
  const opponentCars = [cars[1], cars[2]];
  
  // Update player position based on score
  useEffect(() => {
    const newPosition = Math.min((score / maxScore) * 100, 100);
    setPlayerPosition(newPosition);
    
    // Check if player won
    if (newPosition >= 100 && !raceFinished) {
      setRaceFinished(true);
      setWinner('player');
      onComplete();
    }
  }, [score, maxScore, onComplete, raceFinished]);
  
  // Simulate opponent movement
  useEffect(() => {
    if (!isActive || raceFinished) return;
    
    const simulateOpponents = () => {
      const now = Date.now();
      const deltaTime = now - lastUpdateTime.current;
      lastUpdateTime.current = now;
      
      // Opponent speed based on difficulty (they move slower on easier levels)
      const baseSpeed = difficulty === 1 ? 0.3 : difficulty === 2 ? 0.5 : 0.7;
      const speedVariation = 0.2;
      
      setOpponent1Position(prev => {
        const speed = baseSpeed + (Math.random() - 0.5) * speedVariation;
        const newPos = Math.min(prev + (speed * deltaTime / 1000), 100);
        
        // Check if opponent 1 won
        if (newPos >= 100 && !raceFinished) {
          setRaceFinished(true);
          setWinner('opponent1');
        }
        
        return newPos;
      });
      
      setOpponent2Position(prev => {
        const speed = baseSpeed + (Math.random() - 0.5) * speedVariation;
        const newPos = Math.min(prev + (speed * deltaTime / 1000), 100);
        
        // Check if opponent 2 won
        if (newPos >= 100 && !raceFinished) {
          setRaceFinished(true);
          setWinner('opponent2');
        }
        
        return newPos;
      });
    };
    
    const interval = setInterval(simulateOpponents, 100);
    return () => clearInterval(interval);
  }, [isActive, raceFinished, difficulty]);
  
  // Reset race when starting new game
  useEffect(() => {
    if (score === 0) {
      setPlayerPosition(0);
      setOpponent1Position(0);
      setOpponent2Position(0);
      setRaceFinished(false);
      setWinner(null);
      lastUpdateTime.current = Date.now();
    }
  }, [score]);
  
  return (
    <div className="relative h-full w-full bg-gradient-to-b from-green-400 to-green-600 rounded-lg overflow-hidden">
      {/* Race track background */}
      <div className="absolute inset-0">
        {/* Sky */}
        <div className="h-1/3 bg-gradient-to-b from-blue-400 to-blue-300"></div>
        
        {/* Track lanes */}
        <div className="h-2/3 bg-gray-600 relative">
          {/* Lane dividers */}
          <div className="absolute top-1/6 left-0 right-0 h-px bg-white opacity-50"></div>
          <div className="absolute top-3/6 left-0 right-0 h-px bg-white opacity-50"></div>
          <div className="absolute top-5/6 left-0 right-0 h-px bg-white opacity-50"></div>
          
          {/* Dashed center lines */}
          <div className="absolute top-1/12 left-0 right-0 h-px bg-yellow-300 opacity-75 animate-pulse"></div>
          <div className="absolute top-4/12 left-0 right-0 h-px bg-yellow-300 opacity-75 animate-pulse"></div>
          <div className="absolute top-7/12 left-0 right-0 h-px bg-yellow-300 opacity-75 animate-pulse"></div>
          <div className="absolute top-10/12 left-0 right-0 h-px bg-yellow-300 opacity-75 animate-pulse"></div>
        </div>
      </div>
      
      {/* Finish line */}
      <div className="absolute top-0 bottom-0 right-0 w-2 bg-gradient-to-b from-black via-white to-black opacity-80"></div>
      <div className="absolute top-0 bottom-0 right-2 w-2 bg-gradient-to-b from-white via-black to-white opacity-80"></div>
      
      {/* Player car (Lane 1) */}
      <div
        className={`absolute z-20 transition-all duration-500 text-2xl transform -translate-y-1/2
          ${isActive ? 'drop-shadow-lg' : 'opacity-70'}
          ${winner === 'player' ? 'animate-bounce' : ''}
        `}
        style={{ 
          left: `${playerPosition}%`,
          top: '45%',
        }}
      >
        {playerCar}
      </div>
      
      {/* Opponent 1 car (Lane 2) */}
      <div
        className={`absolute z-20 transition-all duration-300 text-2xl transform -translate-y-1/2
          ${winner === 'opponent1' ? 'animate-bounce' : ''}
        `}
        style={{ 
          left: `${opponent1Position}%`,
          top: '65%',
        }}
      >
        {opponentCars[0]}
      </div>
      
      {/* Opponent 2 car (Lane 3) */}
      <div
        className={`absolute z-20 transition-all duration-300 text-2xl transform -translate-y-1/2
          ${winner === 'opponent2' ? 'animate-bounce' : ''}
        `}
        style={{ 
          left: `${opponent2Position}%`,
          top: '85%',
        }}
      >
        {opponentCars[1]}
      </div>
      
      {/* Player labels */}
      <div className="absolute left-2 top-1/3 text-white text-xs font-bold bg-black bg-opacity-50 px-2 py-1 rounded">
        YOU
      </div>
      <div className="absolute left-2 top-1/2 text-white text-xs font-bold bg-black bg-opacity-50 px-2 py-1 rounded">
        ALEX
      </div>
      <div className="absolute left-2 top-2/3 text-white text-xs font-bold bg-black bg-opacity-50 px-2 py-1 rounded">
        SARA
      </div>
      
      {/* Progress indicators */}
      <div className="absolute bottom-2 left-2 right-2 text-white text-xs">
        <div className="flex justify-between items-center">
          <span>Progress: {Math.round(playerPosition)}%</span>
          <span>{score}/{maxScore}</span>
        </div>
      </div>
      
      {/* Winner announcement */}
      {raceFinished && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-30">
          <div className="text-center text-white">
            <div className="text-4xl mb-2">
              {winner === 'player' ? '🏆' : '😅'}
            </div>
            <div className="text-lg font-bold">
              {winner === 'player' ? 'You Won!' : 
               winner === 'opponent1' ? 'Alex Won!' : 'Sara Won!'}
            </div>
          </div>
        </div>
      )}
      
      {/* Starting line */}
      <div className="absolute top-0 bottom-0 left-0 w-1 bg-white opacity-60"></div>
    </div>
  );
};

export default RaceVisualization; 