import React, { useState, useEffect } from 'react';

// Simulated data - in a real app, this would come from a backend
const initialLeaderboardData = {
  'find-the-note': [
    { name: 'MusicMaster', score: 950, date: '2023-05-15' },
    { name: 'PianoWhiz', score: 820, date: '2023-05-10' },
    { name: 'NoteNinja', score: 750, date: '2023-05-20' }
  ],
  'chord-recognition': [
    { name: 'HarmonyHero', score: 880, date: '2023-05-18' },
    { name: 'ChordChampion', score: 840, date: '2023-05-12' },
    { name: 'EarExpert', score: 780, date: '2023-05-22' }
  ],
  'scale-builder': [
    { name: 'ScaleSage', score: 920, date: '2023-05-14' },
    { name: 'TheoryTitan', score: 860, date: '2023-05-09' },
    { name: 'ModeMaster', score: 790, date: '2023-05-19' }
  ],
  'interval-training': [
    { name: 'IntervalImpresario', score: 910, date: '2023-05-17' },
    { name: 'PerfectPitch', score: 850, date: '2023-05-11' },
    { name: 'OctaveOwner', score: 770, date: '2023-05-21' }
  ],
  'rhythm-challenge': [
    { name: 'BeatBoxer', score: 940, date: '2023-05-16' },
    { name: 'RhythmRuler', score: 830, date: '2023-05-13' },
    { name: 'TempoTamer', score: 760, date: '2023-05-23' }
  ],
  'tournament': [
    { name: 'TourneyTitan', score: 1250, date: '2023-05-15', tournamentWins: 5 },
    { name: 'CompetitionKing', score: 1180, date: '2023-05-10', tournamentWins: 4 },
    { name: 'BattleBard', score: 1090, date: '2023-05-20', tournamentWins: 3 }
  ]
};

// Map game IDs to display names
const gameNames = {
  'find-the-note': 'Find The Note',
  'chord-recognition': 'Chord Recognition', 
  'scale-builder': 'Scale Builder',
  'interval-training': 'Interval Training',
  'rhythm-challenge': 'Rhythm Challenge',
  'tournament': 'Tournament Mode'
};

function Leaderboard({ onClose, currentUser = "You" }) {
  const [selectedGame, setSelectedGame] = useState('find-the-note');
  const [leaderboardData, setLeaderboardData] = useState(initialLeaderboardData);
  const [userName, setUserName] = useState(currentUser);
  const [isAddingScore, setIsAddingScore] = useState(false);
  const [newScore, setNewScore] = useState('');
  
  // In a real app, we would load this data from a backend
  useEffect(() => {
    // Simulate loading from local storage
    const savedData = localStorage.getItem('tunebit-leaderboard');
    if (savedData) {
      try {
        setLeaderboardData(JSON.parse(savedData));
      } catch (e) {
        console.error("Could not parse leaderboard data", e);
      }
    }
  }, []);
  
  // Save leaderboard data to local storage when it changes
  useEffect(() => {
    localStorage.setItem('tunebit-leaderboard', JSON.stringify(leaderboardData));
  }, [leaderboardData]);
  
  // Add a new score to the leaderboard
  const addNewScore = () => {
    if (!newScore || isNaN(parseInt(newScore)) || parseInt(newScore) <= 0) {
      return; // Invalid score
    }
    
    const score = parseInt(newScore);
    const today = new Date().toISOString().split('T')[0];
    
    const newEntry = { name: userName, score, date: today };
    
    // Add tournament wins if it's a tournament score
    if (selectedGame === 'tournament') {
      newEntry.tournamentWins = 1;
    }
    
    const updatedGameData = [...leaderboardData[selectedGame], newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Keep top 10
    
    setLeaderboardData({
      ...leaderboardData,
      [selectedGame]: updatedGameData
    });
    
    setNewScore('');
    setIsAddingScore(false);
  };
  
  return (
    <div className="leaderboard-container max-w-4xl mx-auto bg-gray-800 rounded-xl p-6 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">Leaderboard</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="game-tabs flex overflow-x-auto mb-6 pb-2">
        {Object.keys(gameNames).map(gameId => (
          <button
            key={gameId}
            onClick={() => setSelectedGame(gameId)}
            className={`px-4 py-2 rounded-lg mr-2 flex-shrink-0 ${
              selectedGame === gameId 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-bold' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {gameNames[gameId]}
          </button>
        ))}
      </div>
      
      <div className="leaderboard-content">
        <div className="game-info mb-4">
          <h3 className="text-xl font-bold text-white">{gameNames[selectedGame]}</h3>
          <p className="text-gray-400">Top scores for this game</p>
        </div>
        
        <div className="scores-table bg-gray-700 rounded-lg overflow-hidden mb-6">
          <div className="grid grid-cols-12 bg-gray-600 p-3 font-bold text-white">
            <div className="col-span-1">Rank</div>
            <div className="col-span-4">Player</div>
            <div className="col-span-3 text-right">Score</div>
            {selectedGame === 'tournament' && (
              <div className="col-span-2 text-right">Wins</div>
            )}
            <div className="col-span-4 text-right">Date</div>
          </div>
          
          {leaderboardData[selectedGame].map((entry, index) => (
            <div 
              key={`${entry.name}-${index}`}
              className={`grid grid-cols-12 p-3 ${
                index % 2 === 0 ? 'bg-gray-700' : 'bg-gray-750'
              } ${entry.name === userName ? 'border-l-4 border-purple-500' : ''}`}
            >
              <div className="col-span-1 font-bold text-gray-400">{index + 1}</div>
              <div className="col-span-4 text-white font-medium">{entry.name}</div>
              <div className="col-span-3 text-right text-white font-bold">{entry.score}</div>
              {selectedGame === 'tournament' && (
                <div className="col-span-2 text-right text-purple-300">{entry.tournamentWins || 0}</div>
              )}
              <div className="col-span-4 text-right text-gray-400">{entry.date}</div>
            </div>
          ))}
          
          {leaderboardData[selectedGame].length === 0 && (
            <div className="p-4 text-center text-gray-400">
              No scores recorded yet. Be the first!
            </div>
          )}
        </div>
        
        {isAddingScore ? (
          <div className="add-score-form bg-gray-700 rounded-lg p-4">
            <h4 className="text-white font-bold mb-2">Add Your Score</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-gray-600 text-white border border-gray-500 rounded px-3 py-2"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Score</label>
                <input
                  type="number"
                  value={newScore}
                  onChange={(e) => setNewScore(e.target.value)}
                  className="w-full bg-gray-600 text-white border border-gray-500 rounded px-3 py-2"
                  placeholder="Enter score"
                  min="1"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={addNewScore}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsAddingScore(false)}
                  className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={() => setIsAddingScore(true)}
              className="glow-button bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white px-6 py-2 rounded-lg transform transition-all hover:-translate-y-1"
            >
              Add Your Score
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Leaderboard; 