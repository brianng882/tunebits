import React, { useState, useEffect, useRef } from 'react';
import PianoGame from '../Games/PianoGame';
import RhythmChallenge from '../Games/RhythmChallenge';
import ChordRecognition from '../Games/ChordRecognition';
import ScaleBuilder from '../Games/ScaleBuilder';
import IntervalTraining from '../Games/IntervalTraining';

const GAMES = [
  { id: 'find-the-note', name: 'Find The Note', component: PianoGame },
  { id: 'rhythm-challenge', name: 'Rhythm Challenge', component: RhythmChallenge },
  { id: 'chord-recognition', name: 'Chord Recognition', component: ChordRecognition },
  { id: 'scale-builder', name: 'Scale Builder', component: ScaleBuilder },
  { id: 'interval-training', name: 'Interval Training', component: IntervalTraining }
];

const AVATARS = [
  '👨‍🎤', '👩‍🎤', '🧑‍🎤', '🎸', '🎹', '🎻', '🎺', '🎷', '🥁', '🪘'
];

function TournamentMode() {
  const [gameState, setGameState] = useState('setup'); // setup, playing, results
  const [players, setPlayers] = useState([
    { id: 1, name: 'Player 1', avatar: AVATARS[0], score: 0, ready: false }
  ]);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [rounds, setRounds] = useState(3);
  const [currentRound, setCurrentRound] = useState(0);
  const [selectedGame, setSelectedGame] = useState(GAMES[0].id);
  const [countdown, setCountdown] = useState(3);
  const [timers, setTimers] = useState({
    roundTime: 60, // seconds per round
    timeRemaining: 60
  });
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);
  const confettiRef = useRef(null);
  
  // Handle adding a new player
  const handleAddPlayer = () => {
    if (players.length < 8) {
      const newPlayerId = players.length + 1;
      setPlayers([
        ...players,
        { 
          id: newPlayerId, 
          name: `Player ${newPlayerId}`, 
          avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
          score: 0,
          ready: false
        }
      ]);
    }
  };
  
  // Handle removing a player
  const handleRemovePlayer = (id) => {
    if (players.length > 1) {
      setPlayers(players.filter(player => player.id !== id));
    }
  };
  
  // Handle updating player name
  const handleNameChange = (id, newName) => {
    setPlayers(players.map(player => 
      player.id === id ? { ...player, name: newName } : player
    ));
  };
  
  // Handle updating player avatar
  const handleAvatarChange = (id) => {
    setPlayers(players.map(player => {
      if (player.id === id) {
        const newAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
        return { ...player, avatar: newAvatar };
      }
      return player;
    }));
  };
  
  // Handle toggling player ready status
  const handleReadyToggle = (id) => {
    setPlayers(players.map(player => 
      player.id === id ? { ...player, ready: !player.ready } : player
    ));
  };
  
  // Check if all players are ready
  const areAllPlayersReady = () => {
    return players.length > 0 && players.every(player => player.ready);
  };
  
  // Start the tournament
  const startTournament = () => {
    if (areAllPlayersReady()) {
      setGameState('countdown');
      setCurrentRound(1);
      setCountdown(3);
      
      // Reset scores
      setPlayers(players.map(player => ({ ...player, score: 0 })));
    }
  };
  
  // Update score for current player
  const handleScoreUpdate = (score) => {
    setPlayers(players.map(player => 
      player.id === currentPlayer ? { ...player, score: player.score + score } : player
    ));
  };
  
  // Move to next player or round
  const nextPlayerOrRound = () => {
    // Find index of current player
    const currentPlayerIndex = players.findIndex(p => p.id === currentPlayer);
    
    // If there are more players for this round
    if (currentPlayerIndex < players.length - 1) {
      setCurrentPlayer(players[currentPlayerIndex + 1].id);
      setTimers({ ...timers, timeRemaining: timers.roundTime });
      setCountdown(3);
      setGameState('countdown');
    } else {
      // End of round
      if (currentRound < rounds) {
        // Start next round
        setCurrentRound(currentRound + 1);
        setCurrentPlayer(players[0].id);
        setTimers({ ...timers, timeRemaining: timers.roundTime });
        setCountdown(3);
        setGameState('countdown');
      } else {
        // End of tournament
        endTournament();
      }
    }
  };
  
  // End the tournament and show results
  const endTournament = () => {
    setGameState('results');
    
    // Add confetti effect for the winner
    if (confettiRef.current) {
      confettiRef.current.classList.add('active');
      setTimeout(() => {
        if (confettiRef.current) {
          confettiRef.current.classList.remove('active');
        }
      }, 5000);
    }
  };
  
  // Restart the tournament
  const restartTournament = () => {
    setGameState('setup');
    setCurrentRound(0);
    setPlayers(players.map(player => ({ ...player, score: 0, ready: false })));
  };
  
  // Timer countdown effect
  useEffect(() => {
    if (gameState === 'playing' && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimers(prev => {
          if (prev.timeRemaining <= 1) {
            clearInterval(timerRef.current);
            nextPlayerOrRound();
            return prev;
          }
          return { ...prev, timeRemaining: prev.timeRemaining - 1 };
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState, isPaused]);
  
  // Countdown effect
  useEffect(() => {
    let timer;
    if (gameState === 'countdown' && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (gameState === 'countdown' && countdown === 0) {
      setGameState('playing');
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown, gameState]);
  
  // Determine the current game component
  const CurrentGameComponent = GAMES.find(game => game.id === selectedGame)?.component || PianoGame;
  
  // Get sorted players by score
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];
  const hasWinner = sortedPlayers.length > 0 && sortedPlayers[0].score > 0 && 
                    (sortedPlayers.length === 1 || sortedPlayers[0].score > sortedPlayers[1].score);
  
  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  return (
    <div className="tournament-mode min-h-screen">
      {/* Confetti effect container for winner */}
      <div className="confetti-container absolute inset-0 pointer-events-none overflow-hidden" ref={confettiRef}>
        {Array.from({ length: 100 }).map((_, i) => (
          <div 
            key={i}
            className="confetti-piece absolute"
            style={{
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 10 + 5}px`,
              height: `${Math.random() * 10 + 5}px`,
              background: `hsl(${Math.random() * 360}, 100%, 50%)`,
              borderRadius: Math.random() > 0.5 ? '50%' : '0',
              transformOrigin: 'center center',
              animation: `fall ${Math.random() * 3 + 2}s linear infinite, spin ${Math.random() * 3 + 2}s ease-in-out infinite alternate`
            }}
          ></div>
        ))}
      </div>
      
      <div className="max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-4xl font-bold text-center text-white mb-8">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            TuneBits Tournament
          </span>
        </h1>
        
        {gameState === 'setup' && (
          <div className="setup-screen bg-gray-800 rounded-xl p-6 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="tournament-settings">
                <h2 className="text-2xl font-bold mb-4 text-white">Game Settings</h2>
                
                <div className="mb-6">
                  <label className="block text-gray-300 mb-2">Select Game</label>
                  <select 
                    value={selectedGame}
                    onChange={(e) => setSelectedGame(e.target.value)}
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:ring focus:ring-purple-500"
                  >
                    {GAMES.map(game => (
                      <option key={game.id} value={game.id}>{game.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-300 mb-2">Number of Rounds</label>
                  <div className="flex">
                    <button 
                      onClick={() => rounds > 1 && setRounds(rounds - 1)}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-l-lg"
                    >−</button>
                    <div className="bg-gray-700 text-white px-6 py-2 text-center">{rounds}</div>
                    <button 
                      onClick={() => rounds < 10 && setRounds(rounds + 1)}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-r-lg"
                    >+</button>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-300 mb-2">Time per Round (seconds)</label>
                  <div className="flex">
                    <button 
                      onClick={() => timers.roundTime > 30 && setTimers({...timers, roundTime: timers.roundTime - 10})}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-l-lg"
                    >−</button>
                    <div className="bg-gray-700 text-white px-6 py-2 text-center">{timers.roundTime}</div>
                    <button 
                      onClick={() => timers.roundTime < 300 && setTimers({...timers, roundTime: timers.roundTime + 10})}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-r-lg"
                    >+</button>
                  </div>
                </div>
                
                <button
                  onClick={startTournament}
                  disabled={!areAllPlayersReady()}
                  className={`w-full py-3 rounded-lg text-white font-bold text-lg ${areAllPlayersReady() 
                    ? 'glow-button bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 transform transition-all hover:-translate-y-1' 
                    : 'bg-gray-600 cursor-not-allowed'}`}
                >
                  {areAllPlayersReady() ? 'Start Tournament' : 'Waiting for players...'}
                </button>
              </div>
              
              <div className="players-section">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-white">Players</h2>
                  <button
                    onClick={handleAddPlayer}
                    disabled={players.length >= 8}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
                  >
                    Add Player
                  </button>
                </div>
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {players.map(player => (
                    <div key={player.id} className="player-card flex items-center p-4 bg-gray-700 rounded-lg">
                      <div 
                        className="avatar w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-2xl cursor-pointer"
                        onClick={() => handleAvatarChange(player.id)}
                      >
                        {player.avatar}
                      </div>
                      <input
                        type="text"
                        value={player.name}
                        onChange={(e) => handleNameChange(player.id, e.target.value)}
                        className="flex-1 mx-4 bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleReadyToggle(player.id)}
                          className={`px-3 py-1 rounded-lg ${player.ready 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'bg-yellow-600 hover:bg-yellow-700 text-white'}`}
                        >
                          {player.ready ? 'Ready' : 'Not Ready'}
                        </button>
                        {players.length > 1 && (
                          <button
                            onClick={() => handleRemovePlayer(player.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                          >
                            X
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {gameState === 'countdown' && (
          <div className="countdown-screen flex flex-col items-center justify-center h-64">
            <h2 className="text-2xl font-bold text-white mb-4">{players.find(p => p.id === currentPlayer)?.name}'s Turn</h2>
            <div className="countdown text-8xl font-bold text-white">{countdown}</div>
          </div>
        )}
        
        {gameState === 'playing' && (
          <div className="playing-screen">
            <div className="tournament-header mb-6">
              <div className="flex flex-wrap justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Round {currentRound} of {rounds}
                  </h2>
                  <p className="text-gray-400">
                    Playing: {GAMES.find(game => game.id === selectedGame)?.name}
                  </p>
                </div>
                
                <div className="flex items-center">
                  <div className="bg-gray-700 rounded-lg px-4 py-2 mr-4">
                    <p className="text-sm text-gray-400">TIME</p>
                    <p className={`text-xl font-bold ${timers.timeRemaining < 10 ? 'text-red-400' : 'text-white'}`}>
                      {formatTime(timers.timeRemaining)}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="bg-gray-600 hover:bg-gray-500 text-white p-2 rounded-lg"
                  >
                    {isPaused ? '▶️' : '⏸️'}
                  </button>
                </div>
              </div>
              
              <div className="current-player bg-gradient-to-r from-purple-800 to-indigo-900 rounded-lg p-4 mb-4 flex items-center">
                <div className="avatar w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-2xl mr-4">
                  {players.find(p => p.id === currentPlayer)?.avatar}
                </div>
                <div>
                  <p className="text-sm text-purple-300">CURRENT PLAYER</p>
                  <p className="text-xl font-bold text-white">{players.find(p => p.id === currentPlayer)?.name}</p>
                </div>
                <div className="ml-auto">
                  <p className="text-sm text-purple-300">SCORE</p>
                  <p className="text-xl font-bold text-white">{players.find(p => p.id === currentPlayer)?.score}</p>
                </div>
              </div>
              
              <div className="flex overflow-x-auto py-2 mb-4 player-progress">
                {players.map((player, index) => (
                  <div 
                    key={player.id} 
                    className={`flex-shrink-0 px-3 py-2 mx-1 rounded-lg ${
                      player.id === currentPlayer ? 'bg-indigo-700 shadow-glow' : 'bg-gray-700'
                    }`}
                  >
                    <span className="text-xs text-gray-400">#{index + 1}</span>
                    <div className="flex items-center">
                      <span className="mr-2">{player.avatar}</span>
                      <span className="text-sm text-white">{player.name}</span>
                      <span className="ml-2 text-sm font-bold text-white">{player.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Game component */}
            <div className="game-wrapper mb-4">
              <CurrentGameComponent 
                onScoreUpdate={handleScoreUpdate} 
                isPaused={isPaused}
                isCompetition={true}
              />
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={nextPlayerOrRound}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
              >
                End Turn Early
              </button>
            </div>
          </div>
        )}
        
        {gameState === 'results' && (
          <div className="results-screen bg-gray-800 rounded-xl p-8 shadow-xl text-center">
            <h2 className="text-3xl font-bold text-white mb-8">Tournament Results</h2>
            
            {hasWinner && (
              <div className="winner-section mb-8">
                <div className="winner-avatar text-7xl mb-2">{winner.avatar}</div>
                <h3 className="text-2xl font-bold text-white">{winner.name} wins!</h3>
                <p className="text-4xl font-bold text-yellow-400 mb-4">{winner.score} points</p>
                <div className="inline-block bg-gradient-to-r from-yellow-400 to-yellow-600 p-1 rounded-lg shadow-glow">
                  <div className="bg-gray-800 rounded-lg px-6 py-3">
                    <span className="text-yellow-400 font-bold">TOURNAMENT CHAMPION</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="leaderboard mb-8">
              <h3 className="text-xl font-bold text-white mb-4">Leaderboard</h3>
              <div className="max-w-md mx-auto bg-gray-700 rounded-lg overflow-hidden">
                {sortedPlayers.map((player, index) => (
                  <div 
                    key={player.id} 
                    className={`flex items-center p-4 ${
                      index % 2 === 0 ? 'bg-gray-700' : 'bg-gray-750'
                    } ${index === 0 ? 'bg-gradient-to-r from-yellow-900 to-gray-700' : ''}`}
                  >
                    <div className="text-lg font-bold text-gray-400 w-8">{index + 1}</div>
                    <div className="avatar mx-4">{player.avatar}</div>
                    <div className="player-name flex-1 text-white font-medium">{player.name}</div>
                    <div className="player-score text-xl font-bold text-white">{player.score}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={restartTournament}
                className="glow-button bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 rounded-lg transform transition-all hover:-translate-y-1"
              >
                New Tournament
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Animations for confetti */}
      <style jsx>{`
        @keyframes fall {
          0% { transform: translateY(-100px) rotate(0deg); }
          100% { transform: translateY(100vh) rotate(360deg); }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .confetti-container {
          display: none;
        }
        
        .confetti-container.active {
          display: block;
        }
      `}</style>
    </div>
  );
}

export default TournamentMode; 