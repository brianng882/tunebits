import React, { useState } from 'react';
import './App.css';
import PianoGame from './components/Games/PianoGame';
import RhythmChallenge from './components/Games/RhythmChallenge';
import ChordRecognition from './components/Games/ChordRecognition';
import ScaleBuilder from './components/Games/ScaleBuilder';
import IntervalTraining from './components/Games/IntervalTraining';
import TournamentMode from './components/Multiplayer/TournamentMode';
import Leaderboard from './components/Leaderboard/Leaderboard';

function App() {
  const [currentGame, setCurrentGame] = useState('home');
  const [isPaused, setIsPaused] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  // Define the available games
  const games = [
    { id: 'find-the-note', name: 'Find The Note', component: PianoGame, description: 'Test your ability to identify piano notes quickly' },
    { id: 'chord-recognition', name: 'Chord Recognition', component: ChordRecognition, description: 'Train your ear to identify different chord types' },
    { id: 'scale-builder', name: 'Scale Builder', component: ScaleBuilder, description: 'Learn to build musical scales note by note' },
    { id: 'interval-training', name: 'Interval Training', component: IntervalTraining, description: 'Develop your ear for musical intervals' },
    { id: 'rhythm-challenge', name: 'Rhythm Challenge', component: RhythmChallenge, description: 'Improve your timing by tapping along to rhythms' },
    { id: 'tournament', name: 'Tournament Mode', component: TournamentMode, description: 'Compete with friends in a multi-round competition' }
  ];
  
  // Helper to navigate between screens
  const navigateTo = (gameId) => {
    setCurrentGame(gameId);
    setIsPaused(false);
  };
  
  // Toggle pause state
  const togglePause = () => {
    setIsPaused(!isPaused);
  };
  
  // Toggle leaderboard display
  const toggleLeaderboard = () => {
    setShowLeaderboard(!showLeaderboard);
  };
  
  // Render home screen
  const renderHome = () => (
    <div className="home-screen max-w-6xl mx-auto py-8 px-4">
      <div className="text-center mb-6">
        <h1 className="text-5xl font-bold text-white mb-4">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            TuneBits
          </span>
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-6">
          Improve your musical skills with these interactive ear training and theory games
        </p>
        
        <button 
          onClick={toggleLeaderboard}
          className="glow-button bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white px-6 py-3 rounded-lg transform transition-all hover:-translate-y-1 mb-8"
        >
          View Leaderboards
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {games.map(game => (
          <div 
            key={game.id}
            className="game-card bg-gray-800 rounded-xl overflow-hidden shadow-xl transition-all duration-300 hover:shadow-glow hover:transform hover:scale-105 cursor-pointer"
            onClick={() => navigateTo(game.id)}
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-2">{game.name}</h2>
              <p className="text-gray-400 mb-4">{game.description}</p>
              <button 
                className="glow-button bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white px-4 py-2 rounded-lg transform transition-all hover:-translate-y-1"
              >
                Play Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  
  // Render the game container with header
  const renderGameContainer = () => {
    const currentGameInfo = games.find(g => g.id === currentGame);
    if (!currentGameInfo) return null;
    
    const GameComponent = currentGameInfo.component;
    
    return (
      <div className="game-container max-w-6xl mx-auto py-4 px-4">
        <div className="game-header flex justify-between items-center mb-6">
          <button 
            onClick={() => navigateTo('home')}
            className="back-button flex items-center text-gray-300 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Games
          </button>
          
          <div className="flex items-center">
            <button 
              onClick={toggleLeaderboard}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg mr-2"
            >
              Leaderboard
            </button>
            
            {currentGame !== 'tournament' && (
              <button 
                onClick={togglePause}
                className="pause-button bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                {isPaused ? 'Resume' : 'Pause'}
              </button>
            )}
          </div>
        </div>
        
        <div className="game-content">
          {currentGame === 'tournament' ? (
            <GameComponent />
          ) : (
            <GameComponent 
              isPaused={isPaused} 
              onScoreUpdate={() => {}} 
              isCompetition={false}
            />
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Overlay for leaderboard */}
      {showLeaderboard && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Leaderboard 
            onClose={toggleLeaderboard}
            currentUser="You"
          />
        </div>
      )}
      
      {currentGame === 'home' ? renderHome() : renderGameContainer()}
    </div>
  );
}

export default App; 