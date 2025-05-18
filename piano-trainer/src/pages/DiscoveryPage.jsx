import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import GameCard from '../components/Discovery/GameCard';

function DiscoveryPage() {
  const [activeTab, setActiveTab] = useState('games');
  const [selectedLevel, setSelectedLevel] = useState('beginner');
  
  // Mock user data for competition elements
  const userData = {
    username: 'MusicExplorer',
    level: 12,
    xp: 2450,
    xpToNext: 3000,
    badges: [
      { id: 1, name: 'Perfect Pitch', icon: '🎯', description: 'Achieved 100% accuracy in Find The Note' },
      { id: 2, name: 'Rhythm Master', icon: '🥁', description: 'Completed all Rhythm Challenge levels' },
      { id: 3, name: 'Theory Wizard', icon: '🧙', description: 'Mastered music theory fundamentals' },
    ],
    achievements: [
      { id: 1, name: 'First Victory', icon: '🏆', completed: true },
      { id: 2, name: 'Perfect Score', icon: '💯', completed: true },
      { id: 3, name: 'Speed Demon', icon: '⚡', completed: false, progress: 70 },
      { id: 4, name: 'Consistent Player', icon: '📅', completed: false, progress: 40 },
      { id: 5, name: 'Community Star', icon: '⭐', completed: false, progress: 20 },
    ],
    dailyChallenges: [
      { id: 1, name: 'Complete 3 Interval Training rounds', reward: '50 XP', completed: false, progress: 1, total: 3 },
      { id: 2, name: 'Score 90%+ in Scale Builder', reward: 'Perfect Scale Badge', completed: true },
      { id: 3, name: 'Play a multiplayer match', reward: '100 XP', completed: false },
    ]
  };
  
  // Games with added rewards and competition info
  const beginnerGames = [
    { 
      id: 'find-the-note', 
      title: 'Find The Note', 
      description: 'Test your ear training skills by identifying piano notes played randomly.', 
      icon: '🎵',
      reward: '10 XP per correct answer',
      highScore: 750,
      playCount: 56,
      difficulty: 2
    },
    { 
      id: 'rhythm-challenge', 
      title: 'Rhythm Challenge', 
      description: 'Test your rhythm skills by tapping along with the beat patterns.', 
      icon: '🥁',
      reward: 'Rhythm Master badge at level 10',
      highScore: 820,
      playCount: 32,
      difficulty: 3
    },
    { 
      id: 'chord-recognition', 
      title: 'Chord Recognition', 
      description: 'Learn to recognize different chord types by ear, from major and minor to complex chords.', 
      icon: '🎶',
      reward: '15 XP per correct chord',
      highScore: 680,
      playCount: 27,
      difficulty: 4
    },
    { 
      id: 'scale-builder', 
      title: 'Scale Builder', 
      description: 'Practice building different scales on the piano keyboard.', 
      icon: '🎼',
      reward: 'Scale Theory badge at level 8',
      highScore: 590,
      playCount: 18,
      difficulty: 3
    },
    { 
      id: 'interval-training', 
      title: 'Interval Training', 
      description: 'Identify musical intervals by ear and improve your pitch recognition.', 
      icon: '🎧',
      reward: '12 XP per correct interval',
      highScore: 710,
      playCount: 41,
      difficulty: 3
    },
    { 
      id: 'coming-soon-1', 
      title: 'Melody Dictation', 
      description: 'Coming soon: Test your ability to transcribe simple melodies by ear.', 
      icon: '🎻',
      reward: 'Coming soon',
      highScore: 0,
      playCount: 0,
      difficulty: 5,
      locked: true
    },
  ];

  // Intermediate games
  const intermediateGames = [
    { 
      id: 'coming-soon-2', 
      title: 'Chord Progression', 
      description: 'Coming soon: Identify and play common chord progressions.', 
      icon: '🎹',
      reward: 'Coming soon',
      highScore: 0,
      playCount: 0,
      difficulty: 6,
      locked: true
    },
    { 
      id: 'coming-soon-3', 
      title: 'Advanced Ear Training', 
      description: 'Coming soon: More challenging ear training exercises for intermediate musicians.', 
      icon: '🎺',
      reward: 'Coming soon',
      highScore: 0,
      playCount: 0,
      difficulty: 7,
      locked: true
    },
    { 
      id: 'coming-soon-4', 
      title: 'Sight Reading', 
      description: 'Coming soon: Practice reading and playing musical notation in real-time.', 
      icon: '📜',
      reward: 'Coming soon',
      highScore: 0,
      playCount: 0,
      difficulty: 6,
      locked: true
    },
  ];

  // Advanced games
  const advancedGames = [
    { 
      id: 'coming-soon-5', 
      title: 'Jazz Chord Voicings', 
      description: 'Coming soon: Learn and practice jazz chord voicings and extensions.', 
      icon: '🎷',
      reward: 'Coming soon',
      highScore: 0,
      playCount: 0,
      difficulty: 8,
      locked: true
    },
    { 
      id: 'coming-soon-6', 
      title: 'Music Composition', 
      description: 'Coming soon: Create your own musical compositions with guidance.', 
      icon: '✏️',
      reward: 'Coming soon',
      highScore: 0,
      playCount: 0,
      difficulty: 9,
      locked: true
    },
  ];

  // Conditionally render games based on selected level
  const renderGames = () => {
    switch(selectedLevel) {
      case 'beginner':
        return beginnerGames;
      case 'intermediate':
        return intermediateGames;
      case 'advanced':
        return advancedGames;
      default:
        return beginnerGames;
    }
  };

  // Custom GameCard for video game style
  const GameCardNew = ({ game, level }) => {
    return (
      <Link to={game.locked ? '#' : `/game/${level}/${game.id}`} 
        className={`block ${game.locked ? 'cursor-not-allowed opacity-70' : 'transform transition-all hover:scale-105'}`}>
        <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-xl border border-gray-700">
          {/* Difficulty meter */}
          <div className="absolute top-3 right-3 flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`w-2 h-6 rounded-full ${i < game.difficulty ? 'bg-yellow-500' : 'bg-gray-600'}`}></div>
            ))}
          </div>
          
          {/* Lock overlay for locked games */}
          {game.locked && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
              <div className="text-4xl">🔒</div>
            </div>
          )}
          
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-4xl mr-4">
                {game.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{game.title}</h3>
                <div className="flex items-center text-sm text-gray-400">
                  <span className="mr-3">🏆 {game.highScore}</span>
                  <span>🎮 {game.playCount} plays</span>
                </div>
              </div>
            </div>
            
            <p className="text-gray-300 text-sm mb-4">{game.description}</p>
            
            {/* Reward section */}
            <div className="bg-gradient-to-r from-purple-900 to-purple-800 p-3 rounded-lg text-sm flex items-center">
              <span className="text-xl mr-2">🎁</span>
              <span className="text-purple-200">{game.reward}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-indigo-900 text-white">
      {/* Floating musical notes background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute text-4xl opacity-10"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 10 + 15}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          >
            {['🎵', '🎶', '🎸', '🎹', '🎷', '🎺', '🎻', '🥁'][Math.floor(Math.random() * 8)]}
          </div>
        ))}
      </div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Player profile and level bar */}
        <div className="bg-gray-800 bg-opacity-70 backdrop-blur-md rounded-xl p-4 mb-8 border border-gray-700">
          <div className="flex flex-wrap items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl mr-3">
                🎮
              </div>
              <div>
                <h2 className="text-xl font-bold">{userData.username}</h2>
                <p className="text-blue-300">Level {userData.level} Musician</p>
              </div>
            </div>
            
            {/* XP Progress bar */}
            <div className="w-full md:w-1/2">
              <div className="flex justify-between text-sm mb-1">
                <span>XP: {userData.xp}/{userData.xpToNext}</span>
                <span>{Math.round(userData.xp/userData.xpToNext * 100)}% to Level {userData.level + 1}</span>
              </div>
              <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full"
                  style={{ width: `${(userData.xp/userData.xpToNext) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main navigation tabs */}
        <div className="flex mb-6 border-b border-gray-700 overflow-x-auto pb-2">
          <button 
            onClick={() => setActiveTab('games')}
            className={`px-4 py-2 mr-2 rounded-t-lg font-medium ${activeTab === 'games' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            🎮 Games
          </button>
          <button 
            onClick={() => setActiveTab('challenges')}
            className={`px-4 py-2 mr-2 rounded-t-lg font-medium ${activeTab === 'challenges' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            🏆 Daily Challenges
          </button>
          <button 
            onClick={() => setActiveTab('achievements')}
            className={`px-4 py-2 mr-2 rounded-t-lg font-medium ${activeTab === 'achievements' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            🏅 Achievements
          </button>
          <button 
            onClick={() => setActiveTab('badges')}
            className={`px-4 py-2 mr-2 rounded-t-lg font-medium ${activeTab === 'badges' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            ✨ Badges
          </button>
        </div>
        
        {/* Games Tab Content */}
        {activeTab === 'games' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
                Choose Your Challenge
              </h1>
              
              <div className="flex space-x-2 bg-gray-800 bg-opacity-70 p-1 rounded-lg">
                <button 
                  onClick={() => setSelectedLevel('beginner')} 
                  className={`px-4 py-2 rounded-lg ${selectedLevel === 'beginner' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                >
                  Beginner
                </button>
                <button 
                  onClick={() => setSelectedLevel('intermediate')} 
                  className={`px-4 py-2 rounded-lg ${selectedLevel === 'intermediate' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                >
                  Intermediate
                </button>
                <button 
                  onClick={() => setSelectedLevel('advanced')} 
                  className={`px-4 py-2 rounded-lg ${selectedLevel === 'advanced' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                >
                  Advanced
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {renderGames().map(game => (
                <GameCardNew 
                  key={game.id}
                  game={game}
                  level={selectedLevel}
                />
              ))}
            </div>
          </>
        )}
        
        {/* Daily Challenges Tab Content */}
        {activeTab === 'challenges' && (
          <div className="bg-gray-800 bg-opacity-50 rounded-xl p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Daily Challenges</h2>
              <p className="text-yellow-300">Refreshes in: 14:23:45</p>
            </div>
            
            <div className="space-y-4">
              {userData.dailyChallenges.map(challenge => (
                <div key={challenge.id} className={`bg-gray-900 rounded-xl p-4 border ${challenge.completed ? 'border-green-500' : 'border-gray-700'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium mb-1">{challenge.name}</h3>
                      <div className="flex items-center">
                        <span className="text-yellow-300 mr-2">🎁</span>
                        <span>{challenge.reward}</span>
                      </div>
                    </div>
                    {challenge.completed ? (
                      <div className="bg-green-700 text-white px-3 py-1 rounded-full text-sm">Completed</div>
                    ) : challenge.progress !== undefined ? (
                      <div className="text-right">
                        <div className="text-sm mb-1">{challenge.progress}/{challenge.total}</div>
                        <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="bg-blue-500 h-full"
                            style={{ width: `${(challenge.progress/challenge.total) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ) : (
                      <button className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded-lg text-sm">Start</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Achievements Tab Content */}
        {activeTab === 'achievements' && (
          <div className="bg-gray-800 bg-opacity-50 rounded-xl p-6 backdrop-blur-md">
            <h2 className="text-2xl font-bold mb-6">Achievements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userData.achievements.map(achievement => (
                <div key={achievement.id} className={`bg-gray-900 rounded-xl p-4 border ${achievement.completed ? 'border-yellow-500' : 'border-gray-700'}`}>
                  <div className="flex items-center">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl mr-4 ${achievement.completed ? 'bg-gradient-to-br from-yellow-500 to-yellow-700' : 'bg-gray-700'}`}>
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium mb-1">{achievement.name}</h3>
                      {achievement.completed ? (
                        <div className="text-yellow-400 text-sm">Unlocked</div>
                      ) : (
                        <div>
                          <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-1">
                            <div 
                              className="bg-blue-500 h-full"
                              style={{ width: `${achievement.progress}%` }}
                            ></div>
                          </div>
                          <div className="text-gray-400 text-sm">{achievement.progress}% complete</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Badges Tab Content */}
        {activeTab === 'badges' && (
          <div className="bg-gray-800 bg-opacity-50 rounded-xl p-6 backdrop-blur-md">
            <h2 className="text-2xl font-bold mb-6">Earned Badges</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {userData.badges.map(badge => (
                <div key={badge.id} className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-purple-500 text-center">
                  <div className="text-5xl mb-4">{badge.icon}</div>
                  <h3 className="text-xl font-bold mb-2 text-purple-300">{badge.name}</h3>
                  <p className="text-gray-400 text-sm">{badge.description}</p>
                </div>
              ))}
              
              {/* Locked badge placeholder */}
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 text-center opacity-60">
                <div className="text-5xl mb-4">🔒</div>
                <h3 className="text-xl font-bold mb-2">???</h3>
                <p className="text-gray-400 text-sm">Complete more games to unlock additional badges</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes float {
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

export default DiscoveryPage; 