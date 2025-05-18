import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
  const [username, setUsername] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [leaderboard, setLeaderboard] = useState([
    { name: 'MusicMaster', score: 9850, avatar: '🎸' },
    { name: 'PianoWizard', score: 8720, avatar: '🎹' },
    { name: 'BeatMaker', score: 7650, avatar: '🥁' },
    { name: 'MelodyQueen', score: 6430, avatar: '🎤' },
    { name: 'HarmonyKing', score: 5280, avatar: '🎻' },
  ]);
  
  // Animation effect for the title
  const [titleClass, setTitleClass] = useState('text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500 mb-4 animate-pulse');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setTitleClass('text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500 mb-4');
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Simulate joining a game room
  const handleJoinRoom = (e) => {
    e.preventDefault();
    // This would normally connect to a backend
    alert(`Joining room ${roomCode} as ${username || 'Guest'}!`);
    setShowJoinModal(false);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 text-white">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white opacity-10"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              animation: `float ${Math.random() * 10 + 10}s linear infinite`,
              animationDelay: `${Math.random() * 10}s`
            }}
          />
        ))}
      </div>
      
      <div className="container relative mx-auto px-4 py-12 z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className={titleClass}>
            TuneBits Arena
          </h1>
          <p className="text-2xl mb-8 text-blue-200">
            Challenge friends, compete globally, and become the ultimate music master!
          </p>
          
          {/* Username input */}
          <div className="mb-8 max-w-md mx-auto">
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-full text-center bg-white bg-opacity-20 backdrop-blur-md border border-white border-opacity-25 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
            />
          </div>
          
          {/* Game action buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Link to="/discovery" className="group">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-xl shadow-lg transform transition-all hover:scale-105 hover:shadow-blue-500/50 border-2 border-blue-400 border-opacity-50">
                <div className="text-5xl mb-4 group-hover:animate-bounce">🎮</div>
                <h3 className="text-2xl font-bold mb-2">Play Solo</h3>
                <p className="text-blue-200">Choose from various music games and challenge yourself!</p>
              </div>
            </Link>
            
            <button 
              onClick={() => setShowJoinModal(true)}
              className="group bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-xl shadow-lg transform transition-all hover:scale-105 hover:shadow-green-500/50 border-2 border-green-400 border-opacity-50"
            >
              <div className="text-5xl mb-4 group-hover:animate-bounce">🏆</div>
              <h3 className="text-2xl font-bold mb-2">Multiplayer Battle</h3>
              <p className="text-green-200">Join a room and compete with friends in real-time!</p>
            </button>
          </div>
          
          {/* Quick Start buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Link 
              to="/game/beginner/find-the-note" 
              className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full font-bold text-lg shadow-lg hover:shadow-pink-500/50 hover:-translate-y-1 transition-all"
            >
              Quick Play: Find The Note
            </Link>
            <Link 
              to="/game/beginner/rhythm-challenge" 
              className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-full font-bold text-lg shadow-lg hover:shadow-yellow-500/50 hover:-translate-y-1 transition-all"
            >
              Quick Play: Rhythm Challenge
            </Link>
          </div>
          
          {/* Leaderboard section */}
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white border-opacity-25 mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center justify-center">
              <span className="text-3xl mr-2">🏆</span> Global Leaderboard
            </h2>
            <div className="overflow-hidden rounded-lg">
              <table className="w-full">
                <thead className="bg-black bg-opacity-30">
                  <tr>
                    <th className="py-3 px-4 text-left">Rank</th>
                    <th className="py-3 px-4 text-left">Player</th>
                    <th className="py-3 px-4 text-right">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((player, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-black bg-opacity-10' : ''}>
                      <td className="py-3 px-4 font-bold">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </td>
                      <td className="py-3 px-4 flex items-center">
                        <span className="mr-2 text-xl">{player.avatar}</span>
                        {player.name}
                      </td>
                      <td className="py-3 px-4 text-right text-yellow-300 font-bold">{player.score.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white bg-opacity-10 backdrop-blur-md p-6 rounded-xl shadow-lg border border-white border-opacity-25 transform transition-all hover:scale-105">
              <div className="text-4xl mb-4 bg-blue-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto">🎵</div>
              <h3 className="text-xl font-bold mb-2">Daily Challenges</h3>
              <p className="text-blue-200">Complete daily music challenges to earn points and special badges.</p>
            </div>
            
            <div className="bg-white bg-opacity-10 backdrop-blur-md p-6 rounded-xl shadow-lg border border-white border-opacity-25 transform transition-all hover:scale-105">
              <div className="text-4xl mb-4 bg-green-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto">🎮</div>
              <h3 className="text-xl font-bold mb-2">Live Tournaments</h3>
              <p className="text-blue-200">Join scheduled tournaments and win exclusive rewards.</p>
            </div>
            
            <div className="bg-white bg-opacity-10 backdrop-blur-md p-6 rounded-xl shadow-lg border border-white border-opacity-25 transform transition-all hover:scale-105">
              <div className="text-4xl mb-4 bg-purple-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto">🏅</div>
              <h3 className="text-xl font-bold mb-2">Achievement System</h3>
              <p className="text-blue-200">Unlock achievements and show off your music skills to others.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Join Game Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-blue-900 to-purple-900 p-8 rounded-xl max-w-md w-full border-2 border-blue-500">
            <h2 className="text-2xl font-bold mb-4 text-center">Join Multiplayer Battle</h2>
            <form onSubmit={handleJoinRoom}>
              <input
                type="text"
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-25 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
              />
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 rounded-lg hover:from-green-500 hover:to-green-400"
                >
                  Join Battle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Add keyframe animation for floating notes */}
      <style jsx>{`
        @keyframes float {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.1;
          }
          50% {
            opacity: 0.2;
          }
          100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0.1;
          }
        }
      `}</style>
    </div>
  );
}

export default HomePage; 