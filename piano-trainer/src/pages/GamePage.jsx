import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PianoGame from '../components/Games/PianoGame';
import RhythmChallenge from '../components/Games/RhythmChallenge';
import ChordRecognition from '../components/Games/ChordRecognition';
import ScaleBuilder from '../components/Games/ScaleBuilder';
import IntervalTraining from '../components/Games/IntervalTraining';

function GamePage() {
  const { level, gameId } = useParams();
  const navigate = useNavigate();
  
  // Game metadata
  const [metadata, setMetadata] = useState({
    title: 'Music Game',
    description: 'Test your music theory knowledge',
    score: 0,
    highScore: 0,
    timeElapsed: 0,
    isPaused: false,
    currentRound: 1,
    totalRounds: 5
  });
  
  // Mock live opponents data
  const [opponents, setOpponents] = useState([
    { id: 1, name: 'PianoWizard', avatar: '🎹', score: 0, roundScores: [0, 0, 0, 0, 0], isOnline: true },
    { id: 2, name: 'MelodyQueen', avatar: '🎤', score: 0, roundScores: [0, 0, 0, 0, 0], isOnline: true },
    { id: 3, name: 'BeatMaker', avatar: '🥁', score: 0, roundScores: [0, 0, 0, 0, 0], isOnline: true },
    { id: 4, name: 'HarmonyKing', avatar: '🎻', score: 0, roundScores: [0, 0, 0, 0, 0], isOnline: false }
  ]);
  
  // Player round scores
  const [playerRoundScores, setPlayerRoundScores] = useState([0, 0, 0, 0, 0]);
  
  // Competition sidebar visibility
  const [showCompetition, setShowCompetition] = useState(true);
  
  // Timer for game duration
  useEffect(() => {
    let timer;
    if (!metadata.isPaused) {
      timer = setInterval(() => {
        setMetadata(prev => ({
          ...prev,
          timeElapsed: prev.timeElapsed + 1
        }));
      }, 1000);
    }
    
    return () => clearInterval(timer);
  }, [metadata.isPaused]);
  
  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Update game metadata based on gameId
  useEffect(() => {
    const gameMetadata = {
      'find-the-note': {
        title: 'Find The Note',
        description: 'Test your ear training skills by identifying piano notes',
        highScore: 750
      },
      'rhythm-challenge': {
        title: 'Rhythm Challenge',
        description: 'Test your rhythm skills by tapping along with beat patterns',
        highScore: 820
      },
      'chord-recognition': {
        title: 'Chord Recognition',
        description: 'Learn to recognize different chord types by ear',
        highScore: 680
      },
      'scale-builder': {
        title: 'Scale Builder',
        description: 'Practice building different scales on the piano keyboard',
        highScore: 590
      },
      'interval-training': {
        title: 'Interval Training',
        description: 'Identify musical intervals by ear',
        highScore: 710
      }
    };
    
    if (gameMetadata[gameId]) {
      setMetadata(prev => ({
        ...prev,
        ...gameMetadata[gameId]
      }));
    }
  }, [gameId]);
  
  // Simulate random opponent score updates
  useEffect(() => {
    let opponentUpdateInterval;
    
    if (!metadata.isPaused) {
      opponentUpdateInterval = setInterval(() => {
        setOpponents(prev => 
          prev.map(opponent => {
            if (!opponent.isOnline) return opponent;
            
            // Random score increase between 5-20 points
            const scoreIncrease = Math.floor(Math.random() * 16) + 5;
            const newScore = opponent.score + scoreIncrease;
            
            // Update round scores
            const newRoundScores = [...opponent.roundScores];
            newRoundScores[metadata.currentRound - 1] += scoreIncrease;
            
            return {
              ...opponent,
              score: newScore,
              roundScores: newRoundScores
            };
          })
        );
      }, 3000); // Update every 3 seconds
    }
    
    return () => clearInterval(opponentUpdateInterval);
  }, [metadata.isPaused, metadata.currentRound]);
  
  // Handler for updating score from child components
  const handleScoreUpdate = (newScore) => {
    // Update total score
    setMetadata(prev => ({
      ...prev,
      score: newScore
    }));
    
    // Update player's round score
    setPlayerRoundScores(prev => {
      const newScores = [...prev];
      newScores[metadata.currentRound - 1] = newScore - prev.slice(0, metadata.currentRound - 1).reduce((sum, score) => sum + score, 0);
      return newScores;
    });
  };
  
  // Function to handle advancing to next round
  const advanceRound = () => {
    if (metadata.currentRound < metadata.totalRounds) {
      setMetadata(prev => ({
        ...prev,
        currentRound: prev.currentRound + 1
      }));
    } else {
      // Game over logic could go here
      alert("Game Over! Final score: " + metadata.score);
    }
  };
  
  // Function to toggle pause state
  const togglePause = () => {
    setMetadata(prev => ({
      ...prev,
      isPaused: !prev.isPaused
    }));
  };
  
  // Function to exit game
  const exitGame = () => {
    if (window.confirm('Are you sure you want to exit? Your progress will be lost.')) {
      navigate('/discovery');
    }
  };
  
  // Get sorted players for leaderboard display
  const getSortedPlayers = () => {
    const allPlayers = [
      // Current player
      { 
        id: 0, 
        name: 'You', 
        avatar: '👤', 
        score: metadata.score, 
        roundScores: playerRoundScores, 
        isCurrentPlayer: true,
        isOnline: true 
      },
      ...opponents
    ];
    
    return allPlayers.sort((a, b) => b.score - a.score);
  };
  
  // Function to render the appropriate game based on level and gameId
  const renderGame = () => {
    // For beginner level games
    if (level === 'beginner') {
      switch (gameId) {
        case 'find-the-note':
          return <PianoGame onScoreUpdate={handleScoreUpdate} isPaused={metadata.isPaused} />;
        case 'rhythm-challenge':
          return <RhythmChallenge onScoreUpdate={handleScoreUpdate} isPaused={metadata.isPaused} />;
        case 'chord-recognition':
          return <ChordRecognition onScoreUpdate={handleScoreUpdate} isPaused={metadata.isPaused} />;
        case 'scale-builder':
          return <ScaleBuilder onScoreUpdate={handleScoreUpdate} isPaused={metadata.isPaused} />;
        case 'interval-training':
          return <IntervalTraining onScoreUpdate={handleScoreUpdate} isPaused={metadata.isPaused} />;
        default:
          // Fall through to coming soon message
          break;
      }
    }
    
    // For all other games that aren't implemented yet
    return (
      <div className="text-center py-16 bg-gray-800 bg-opacity-70 backdrop-blur-md rounded-xl">
        <div className="text-6xl mb-6">🚧</div>
        <h2 className="text-3xl font-bold mb-4">Coming Soon!</h2>
        <p className="text-xl mb-8 text-gray-300">This game is still under development.</p>
        <Link 
          to="/discovery" 
          className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg"
        >
          Back to Discovery
        </Link>
      </div>
    );
  };
  
  // Pause menu overlay
  const PauseMenu = () => (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
      <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full shadow-2xl border border-gray-700">
        <h2 className="text-3xl font-bold text-center mb-6 text-white">Game Paused</h2>
        <div className="space-y-4">
          <button
            onClick={togglePause}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Resume Game
          </button>
          <button
            onClick={() => {
              togglePause();
              // Reset game could be implemented here if needed
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Restart Game
          </button>
          <button
            onClick={exitGame}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Exit Game
          </button>
        </div>
      </div>
    </div>
  );
  
  // Competition sidebar component
  const CompetitionSidebar = () => (
    <div className="bg-gray-800 bg-opacity-80 backdrop-blur-md rounded-xl border border-gray-700 p-4 h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">Live Competition</h3>
        <div className="bg-green-800 text-white text-xs px-2 py-1 rounded-full flex items-center">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-1"></span>
          Live
        </div>
      </div>
      
      {/* Round indicator */}
      <div className="mb-4">
        <div className="text-sm text-gray-400">ROUND</div>
        <div className="flex justify-between mb-2">
          {[...Array(metadata.totalRounds)].map((_, idx) => (
            <div 
              key={idx} 
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                idx + 1 === metadata.currentRound 
                  ? 'bg-blue-600 text-white' 
                  : idx + 1 < metadata.currentRound 
                    ? 'bg-gray-600 text-white' 
                    : 'bg-gray-700 text-gray-400'
              }`}
            >
              {idx + 1}
            </div>
          ))}
        </div>
        <div className="w-full h-1 bg-gray-700 mb-6">
          <div 
            className="h-full bg-blue-600" 
            style={{ width: `${(metadata.currentRound / metadata.totalRounds) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {/* Players scores */}
      <div className="space-y-3">
        {getSortedPlayers().map((player, index) => (
          <div 
            key={player.id} 
            className={`p-3 rounded-lg ${
              player.isCurrentPlayer 
                ? 'bg-gradient-to-r from-blue-900 to-indigo-900 border border-blue-500' 
                : index === 0 
                  ? 'bg-gradient-to-r from-yellow-900 to-yellow-800 border border-yellow-500'
                  : 'bg-gray-900'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center mr-2 bg-gray-800">
                  {player.avatar}
                </div>
                <div>
                  <div className="font-medium flex items-center">
                    {player.name} 
                    {player.isCurrentPlayer && <span className="ml-1 text-xs bg-blue-600 px-1 rounded">YOU</span>}
                    {!player.isOnline && <span className="ml-1 text-xs bg-gray-600 px-1 rounded">OFFLINE</span>}
                  </div>
                  <div className="text-xs text-gray-400">Rank #{index + 1}</div>
                </div>
              </div>
              <div className="text-xl font-bold">{player.score}</div>
            </div>
            
            {/* Round scores */}
            <div className="flex justify-between text-xs">
              {player.roundScores.map((score, idx) => (
                <div key={idx} className="text-center">
                  <div className={`mb-1 ${idx + 1 === metadata.currentRound ? 'text-blue-400' : 'text-gray-400'}`}>R{idx + 1}</div>
                  <div className={`py-1 px-2 rounded ${idx + 1 === metadata.currentRound ? 'bg-blue-900' : 'bg-gray-800'}`}>
                    {score}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Round action button */}
      <button
        onClick={advanceRound}
        className="w-full mt-6 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-2 px-4 rounded-lg transition-colors"
      >
        Next Round
      </button>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-indigo-900 text-white overflow-hidden">
      {/* Game HUD (Heads-Up Display) */}
      <div className="bg-gray-800 bg-opacity-70 backdrop-blur-md p-3 border-b border-gray-700 flex justify-between items-center">
        <div className="flex items-center">
          <button 
            onClick={togglePause}
            className="mr-4 bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition-colors"
          >
            {metadata.isPaused ? '▶️' : '⏸️'}
          </button>
          <div>
            <h1 className="font-bold text-xl">{metadata.title}</h1>
            <p className="text-gray-400 text-sm">{metadata.description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="text-center">
            <div className="text-sm text-gray-400">TIME</div>
            <div className="font-mono text-xl">{formatTime(metadata.timeElapsed)}</div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-400">SCORE</div>
            <div className="font-mono text-xl">{metadata.score}</div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-400">ROUND</div>
            <div className="font-mono text-xl">{metadata.currentRound}/{metadata.totalRounds}</div>
          </div>
          
          <button
            onClick={() => setShowCompetition(!showCompetition)}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg text-sm transition-colors"
          >
            {showCompetition ? 'Hide Players' : 'Show Players'}
          </button>
          
          <button
            onClick={exitGame}
            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg text-sm transition-colors"
          >
            Exit
          </button>
        </div>
      </div>
      
      {/* Main content with competition sidebar */}
      <div className="container mx-auto p-4 flex h-[calc(100vh-64px)]">
        {/* Game content */}
        <div className={`${showCompetition ? 'w-3/4 pr-4' : 'w-full'} game-container bg-gray-800 bg-opacity-40 backdrop-blur-md rounded-xl p-4`}>
          {renderGame()}
        </div>
        
        {/* Competition sidebar */}
        {showCompetition && (
          <div className="w-1/4">
            <CompetitionSidebar />
          </div>
        )}
      </div>
      
      {/* Pause menu */}
      {metadata.isPaused && <PauseMenu />}
      
      {/* Floating musical notes background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute text-3xl opacity-5"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `floatSlow ${Math.random() * 10 + 20}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          >
            {['🎵', '🎶', '🎸', '🎹', '🎷', '🎺', '🎻', '🥁'][Math.floor(Math.random() * 8)]}
          </div>
        ))}
      </div>
      
      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes floatSlow {
          0% {
            transform: translateY(100vh) rotate(0deg);
          }
          100% {
            transform: translateY(-10vh) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export default GamePage; 