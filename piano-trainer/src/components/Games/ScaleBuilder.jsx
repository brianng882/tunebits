import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import ClimbingGame from './ClimbingGame';

// Constants
const MAX_ROUNDS = 10;
const MAX_LEVEL = 3;

// Scale types based on level
const SCALE_TYPES = {
  1: ['major', 'minor'],
  2: ['major', 'minor', 'harmonic minor', 'melodic minor'],
  3: ['major', 'minor', 'harmonic minor', 'melodic minor', 'pentatonic', 'blues']
};

// Define all notes with their type (white/black) and position
const allNotes = [
  { note: 'C', type: 'white', position: 0 },
  { note: 'C#', type: 'black', position: 7 },
  { note: 'D', type: 'white', position: 14.3 },
  { note: 'D#', type: 'black', position: 21.5 },
  { note: 'E', type: 'white', position: 28.6 },
  { note: 'F', type: 'white', position: 42.9 },
  { note: 'F#', type: 'black', position: 50 },
  { note: 'G', type: 'white', position: 57.2 },
  { note: 'G#', type: 'black', position: 64.3 },
  { note: 'A', type: 'white', position: 71.5 },
  { note: 'A#', type: 'black', position: 78.5 },
  { note: 'B', type: 'white', position: 85.7 }
];

// Define scale patterns (intervals from root note)
const SCALE_PATTERNS = {
  'major': [0, 2, 4, 5, 7, 9, 11],
  'minor': [0, 2, 3, 5, 7, 8, 10],
  'harmonic minor': [0, 2, 3, 5, 7, 8, 11],
  'melodic minor': [0, 2, 3, 5, 7, 9, 11],
  'pentatonic': [0, 2, 4, 7, 9],
  'blues': [0, 3, 5, 6, 7, 10]
};

// Maximum height for climbing (score to reach the top)
const maxHeight = 20; // 10 rounds × 2 points per round

// Mock multiplayer data - in a real app, this would come from a server
const MOCK_PLAYERS = [
  { id: 'p1', name: 'You', avatar: '🧑', score: 0, character: '🧗‍♂️', color: 'blue-600' },
  { id: 'p2', name: 'Player 2', avatar: '👩', score: 0, character: '🧗‍♀️', color: 'purple-600' },
  { id: 'p3', name: 'Player 3', avatar: '👨', score: 0, character: '🐱', color: 'green-600' }
];

function ScaleBuilder({ onScoreUpdate, isPaused, isCompetition = false }) {
  const [gameState, setGameState] = useState('initial'); // initial, playing, feedback
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [targetScale, setTargetScale] = useState(null);
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [availableScales, setAvailableScales] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [rootNote, setRootNote] = useState(null);
  const [climbingGameActive, setClimbingGameActive] = useState(false);
  
  // Multiplayer state
  const [multiplayer, setMultiplayer] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [players, setPlayers] = useState([]);
  const [showPlayerPanel, setShowPlayerPanel] = useState(false);
  const [playerJumping, setPlayerJumping] = useState(false);
  
  // Use refs for audio objects
  const synthRef = useRef(null);
  const audioInitialized = useRef(false);
  const timerRef = useRef(null);
  
  // AI players simulation effect
  useEffect(() => {
    if (multiplayer && gameState === 'playing') {
      // Simulate other players making progress at random intervals
      const aiInterval = setInterval(() => {
        setPlayers(currentPlayers => 
          currentPlayers.map(player => {
            if (player.id !== 'p1') { // Not the human player
              // Random chance to increase score
              if (Math.random() > 0.7) {
                return {
                  ...player,
                  score: Math.min(15, player.score + 1)
                };
              }
            }
            return player;
          })
        );
      }, 5000);
      
      return () => clearInterval(aiInterval);
    }
  }, [multiplayer, gameState]);
  
  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
  
  // Update parent with score
  useEffect(() => {
    if (onScoreUpdate) {
      onScoreUpdate(score * 10);
    }
    
    // Update player's score in multiplayer mode
    if (multiplayer) {
      setPlayers(currentPlayers => 
        currentPlayers.map(player => 
          player.id === 'p1' ? { ...player, score } : player
        )
      );
    }
  }, [score, onScoreUpdate, multiplayer]);
  
  // Handle pausing
  useEffect(() => {
    if (isPaused && gameState === 'playing') {
      // Stop any playing sounds when paused
      if (synthRef.current) {
        synthRef.current.releaseAll();
      }
      setClimbingGameActive(false);
    } else if (!isPaused && gameState === 'playing') {
      setClimbingGameActive(true);
    }
  }, [isPaused, gameState]);
  
  // Initialize audio context and synth
  const initializeAudio = async () => {
    if (audioInitialized.current) return;
    
    try {
      await Tone.start();
      
      if (!synthRef.current) {
        synthRef.current = new Tone.Synth({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 }
        }).toDestination();
      }
      
      audioInitialized.current = true;
      console.log("Audio initialized successfully");
    } catch (error) {
      console.error("Failed to initialize audio:", error);
    }
  };
  
  // Set up available scales based on level
  useEffect(() => {
    if (level === 1) {
      // Level 1: Major, Natural Minor, Pentatonic Major, Pentatonic Minor
      setAvailableScales(SCALE_TYPES[1]);
    } else if (level === 2) {
      // Level 2: Add Harmonic Minor, Melodic Minor, Blues Scale
      setAvailableScales(SCALE_TYPES[2]);
    } else {
      // Level 3: All scales
      setAvailableScales(SCALE_TYPES[3]);
    }
  }, [level]);
  
  // Generate a random scale based on current level
  const generateRandomScale = () => {
    // Pick a random root note from C to B (0-11)
    const randomRootIndex = Math.floor(Math.random() * 12);
    const newRootNote = allNotes[randomRootIndex];
    
    // Pick a random scale type from available scales
    const randomScaleIndex = Math.floor(Math.random() * availableScales.length);
    const randomScale = availableScales[randomScaleIndex];
    
    // Set the new root note
    setRootNote(newRootNote);
    
    // Create the scale object
    const scale = {
      root: newRootNote,
      type: randomScale,
      pattern: SCALE_PATTERNS[randomScale],
      description: `${randomScale.charAt(0).toUpperCase() + randomScale.slice(1)} scale`,
      notes: []
    };
    
    // Calculate the actual notes in the scale
    scale.notes = SCALE_PATTERNS[randomScale].map(interval => {
      const noteIndex = (randomRootIndex + interval) % 12;
      return allNotes[noteIndex].note;
    });
    
    // Store the target scale
    setTargetScale(scale);
    
    return scale;
  };
  
  // Play a note
  const playNote = async (note) => {
    if (isPaused) return;
    
    // Ensure audio is initialized
    if (!audioInitialized.current) {
      await initializeAudio();
    }
    
    // Make sure context is running
    if (Tone.context.state !== 'running') {
      await Tone.context.resume();
    }
    
    if (synthRef.current) {
      // Calculate midi note (C4 = 60, C#4 = 61, etc.)
      const noteIndex = allNotes.findIndex(n => n.note === note);
      if (noteIndex >= 0) {
        const midiNote = 60 + noteIndex;
        const frequency = Tone.Frequency(midiNote, "midi");
        
        // Play the note
        synthRef.current.triggerAttackRelease(frequency, "8n");
      }
    }
  };
  
  // Play all notes in a scale sequentially
  const playScale = async (scale) => {
    if (!scale || isPaused) return;
    
    // Ensure audio is initialized
    if (!audioInitialized.current) {
      await initializeAudio();
    }
    
    // Make sure context is running
    if (Tone.context.state !== 'running') {
      await Tone.context.resume();
    }
    
    // Get the root note index
    const rootIndex = allNotes.findIndex(n => n.note === scale.root.note);
    
    // Schedule notes to play sequentially
    SCALE_PATTERNS[scale.type].forEach((interval, i) => {
      const noteIndex = (rootIndex + interval) % 12;
      const note = allNotes[noteIndex].note;
      const midiNote = 60 + noteIndex;
      
      Tone.Transport.schedule((time) => {
        if (synthRef.current) {
          synthRef.current.triggerAttackRelease(Tone.Frequency(midiNote, "midi"), "8n", time);
        }
      }, Tone.now() + i * 0.25);
    });
    
    // Start the transport
    Tone.Transport.start();
  };
  
  // Start a new round
  const startNewRound = () => {
    setSelectedNotes([]);
    setFeedback(null);
    
    // Generate a random scale
    const scale = generateRandomScale();
    
    // Play the root note
    playNote(scale.root.note);
    
    setGameState('playing');
    setClimbingGameActive(true);
    
    // Trigger player jumping animation briefly
    setPlayerJumping(true);
    timerRef.current = setTimeout(() => {
      setPlayerJumping(false);
    }, 1000);
  };
  
  // Start the game
  const startGame = async () => {
    await initializeAudio();
    setScore(0);
    setRound(1);
    setLevel(1);
    startNewRound();
    setClimbingGameActive(true);
  };
  
  // Initialize multiplayer mode
  const startMultiplayerGame = (name) => {
    setPlayerName(name || 'You');
    setMultiplayer(true);
    
    // Initialize with mock players 
    // In a real app, you would get this data from your server
    const updatedPlayers = [...MOCK_PLAYERS];
    updatedPlayers[0].name = name || 'You'; // Set first player to user
    
    setPlayers(updatedPlayers);
    setScore(0);
    setRound(1);
    setLevel(1);
    startNewRound();
  };
  
  // Handle note selection
  const handleNoteClick = (note) => {
    if (isPaused || gameState !== 'playing') return;
    
    // Play the note
    playNote(note);
    
    // Toggle the note selection
    const isSelected = selectedNotes.includes(note);
    
    if (isSelected) {
      setSelectedNotes(prev => prev.filter(n => n !== note));
    } else {
      setSelectedNotes(prev => [...prev, note]);
    }
  };
  
  // Submit answer
  const handleSubmit = () => {
    if (isPaused || gameState !== 'playing' || !targetScale) return;
    
    // Sort both arrays to make comparison easier
    const sortedSelected = [...selectedNotes].sort();
    const sortedExpected = [...targetScale.notes].sort();
    
    // Check if the selected notes match the scale
    const isCorrect = JSON.stringify(sortedSelected) === JSON.stringify(sortedExpected);
    
    // Update score and provide feedback
    if (isCorrect) {
      setScore(prevScore => prevScore + 1);
      setFeedback({
        message: `Correct! You built a ${targetScale.root.note} ${targetScale.type} scale correctly.`,
        success: true
      });
      
      // Trigger jumping animation
      setPlayerJumping(true);
      timerRef.current = setTimeout(() => {
        setPlayerJumping(false);
      }, 1000);
    } else {
      setFeedback({
        message: `Not quite. The ${targetScale.root.note} ${targetScale.type} scale contains these notes:`,
        success: false
      });
    }
    
    setGameState('feedback');
    setClimbingGameActive(false);
    
    // Level up after every 5 correct answers
    if (isCorrect && (score + 1) % 5 === 0 && level < 3) {
      setLevel(prev => prev + 1);
    }
  };
  
  // Handle continue button
  const handleContinue = () => {
    if (round >= 15) {
      setGameState('complete');
    } else {
      setRound(prev => prev + 1);
      startNewRound();
    }
  };
  
  // Play again after completion
  const handlePlayAgain = () => {
    setMultiplayer(false);
    startGame();
  };
  
  // Calculate keyboard positions for black keys
  const getBlackKeyLeftPosition = (note) => {
    const noteIndex = allNotes.find(n => n.note === note)?.position || 0;
    const prevWhiteKeyIndex = allNotes.filter(n => n.type === 'white' && n.position < noteIndex).length;
    return prevWhiteKeyIndex * 3 - 0.7 + 'rem';
  };
  
  // Check if any player has won
  const checkWinner = () => {
    if (multiplayer) {
      return players.find(player => player.score >= 15);
    }
    return null;
  };
  
  // Rendering the climbing track
  const renderClimbingTrack = () => {
    const maxHeight = 15; // Maximum score to reach the top
    
    return (
      <div className="climbing-track relative w-full h-full bg-gradient-to-b from-blue-900 to-indigo-900 rounded-lg overflow-hidden border border-gray-700">
        {/* Terrain layers */}
        <div className="absolute inset-0">
          <div className="h-1/3 w-full bg-gradient-to-b from-green-800 to-green-900 absolute bottom-0"></div>
          <div className="h-1/3 w-full bg-gradient-to-b from-amber-700 to-amber-800 absolute bottom-1/3"></div>
          <div className="h-1/3 w-full bg-gradient-to-b from-gray-500 to-gray-600 absolute bottom-2/3"></div>
        </div>
        
        {/* Climbing path */}
        <div className="absolute left-1/2 top-0 bottom-0 w-2 bg-gray-400 opacity-30 transform -translate-x-1/2"></div>
        
        {/* Height markers */}
        {[0, 5, 10, 15].map(mark => (
          <div 
            key={mark} 
            className="absolute right-0 text-xs text-white bg-gray-800 bg-opacity-70 px-1 rounded z-10"
            style={{ bottom: `${(mark / maxHeight) * 100}%`, transform: 'translateY(50%)' }}
          >
            {mark}
          </div>
        ))}
        
        {/* Flag at the top */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-xl">
          🚩
        </div>
        
        {/* Player characters */}
        {multiplayer && players.map((player, index) => {
          const heightPercent = (player.score / maxHeight) * 100;
          const horizontalPos = 45 + (index * 10); // Distribute players horizontally
          
          return (
            <div 
              key={player.id}
              className={`absolute transition-all duration-1000 text-2xl ${player.id === 'p1' ? 'z-20' : 'z-10'}`}
              style={{ 
                bottom: `${heightPercent}%`, 
                left: `${horizontalPos}%`,
                filter: player.id === 'p1' ? 'drop-shadow(0 0 6px white)' : 'none',
                transform: player.id === 'p1' && playerJumping ? 'translateY(-20px)' : 'none',
              }}
            >
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 flex items-center justify-center rounded-full bg-${player.color} mb-1`}>
                  {player.character}
                </div>
                <div className="text-xs font-bold text-white bg-gray-800 bg-opacity-50 px-1 rounded">
                  {player.name}
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Single player mode character */}
        {!multiplayer && (
          <div 
            className={`absolute transition-all duration-1000 text-2xl left-1/2 transform -translate-x-1/2 z-20 ${playerJumping ? 'animate-bounce' : ''}`}
            style={{ 
              bottom: `${(score / maxHeight) * 100}%`,
            }}
          >
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 mb-1 shadow-lg">
                🧗
              </div>
              <div className="text-xs font-bold text-white bg-gray-800 bg-opacity-70 px-1 rounded">
                You
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Toggle player panel
  const togglePlayerPanel = () => {
    setShowPlayerPanel(!showPlayerPanel);
  };
  
  return (
    <div className="h-full w-full flex flex-col">
      {/* Game Header */}
      <div className="flex justify-between items-center mb-4 p-2 bg-gray-800 rounded-md">
        <div>
          <h2 className="text-xl font-bold">Scale Builder {level > 1 ? `- Level ${level}` : ''}</h2>
          <p className="text-sm text-gray-300">Build the requested scale by selecting the correct notes</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm">Score: <span className="text-xl font-bold">{score}</span></div>
            <div className="text-sm">Round: {round}</div>
          </div>
          {!isCompetition && (
            <button 
              onClick={() => setShowPlayerPanel(!showPlayerPanel)}
              className="p-2 bg-indigo-600 rounded-full hover:bg-indigo-700 focus:outline-none"
              title="Multiplayer Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Main Game Area with Grid Layout */}
      <div className="flex-grow flex">
        {/* Game Column - 3/5 width on larger screens, full width on mobile */}
        <div className="w-full lg:w-3/5 flex flex-col space-y-4">
          {/* Game State and Controls */}
          <div className="bg-gray-800 rounded-md p-4 flex-grow flex flex-col">
            {gameState === 'initial' ? (
              <div className="text-center flex-grow flex flex-col justify-center items-center">
                <h3 className="text-2xl mb-6">Scale Builder Challenge</h3>
                <p className="mb-8 text-gray-300">Select the correct notes to build scales</p>
                <button 
                  onClick={startGame} 
                  className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  disabled={isPaused}
                >
                  Start Game
                </button>
                
                {!isCompetition && !multiplayer && (
                  <button 
                    onClick={() => setShowPlayerPanel(true)}
                    className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Multiplayer Mode
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Game Instructions */}
                <div className="mb-4">
                  {gameState === 'playing' ? (
                    <div className="text-center mb-6">
                      <p className="text-lg">Build a <span className="font-bold">{targetScale?.root.note} {targetScale?.type}</span> scale</p>
                      <p className="text-sm text-gray-400">
                        Select all notes that belong to this scale, then submit your answer
                      </p>
                    </div>
                  ) : (
                    <div className="text-center mb-6">
                      <p className={`text-lg font-bold ${feedback?.success ? 'text-green-500' : 'text-red-500'}`}>
                        {feedback?.message}
                      </p>
                      {!feedback?.success && targetScale && (
                        <div className="mt-2">
                          <p className="text-gray-300">{targetScale.notes.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Piano Keyboard */}
                <div className="relative mb-6">
                  <div className="flex relative h-40">
                    {/* White keys */}
                    <div className="flex-grow flex">
                      {allNotes.filter(n => n.type === 'white').map(note => (
                        <div
                          key={note.note}
                          className={`relative flex-grow border border-gray-700 rounded-b-md ${
                            selectedNotes.includes(note.note) ? 'bg-green-600' : 'bg-white'
                          } ${gameState !== 'playing' || isPaused ? 'opacity-80' : 'cursor-pointer hover:bg-gray-200'}`}
                          onClick={() => gameState === 'playing' && !isPaused && handleNoteClick(note.note)}
                        >
                          <span className={`absolute bottom-2 left-1/2 transform -translate-x-1/2 ${selectedNotes.includes(note.note) ? 'text-white' : 'text-black'}`}>
                            {note.note}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Black keys */}
                    <div className="absolute top-0 left-0 w-full flex">
                      {allNotes.filter(note => note.type === 'black').map(note => (
                        <div
                          key={note.note}
                          className={`absolute h-24 z-10 w-10 ${
                            selectedNotes.includes(note.note) ? 'bg-green-800' : 'bg-black'
                          } ${gameState !== 'playing' || isPaused ? 'opacity-80' : 'cursor-pointer hover:bg-gray-900'}`}
                          style={{
                            left: `${note.position}%`,
                            width: '6%',
                            transform: 'translateX(-50%)'
                          }}
                          onClick={() => gameState === 'playing' && !isPaused && handleNoteClick(note.note)}
                        >
                          <span className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-white text-sm">
                            {note.note}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Game Controls */}
                <div className="flex justify-center mt-4 space-x-4">
                  {gameState === 'playing' ? (
                    <button
                      onClick={handleSubmit}
                      disabled={selectedNotes.length === 0 || isPaused}
                      className={`px-6 py-3 rounded-md transition-colors ${
                        selectedNotes.length === 0 || isPaused
                          ? 'bg-gray-600 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      Submit
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (round < MAX_ROUNDS) {
                          setRound(prevRound => prevRound + 1);
                          startNewRound();
                        } else {
                          // Game over
                          setGameState('complete');
                        }
                      }}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                      disabled={isPaused}
                    >
                      {round < MAX_ROUNDS ? 'Next Round' : 'Finish Game'}
                    </button>
                  )}
                  
                  {gameState === 'playing' && (
                    <button
                      onClick={() => playNote(targetScale.root.note)}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                      disabled={isPaused}
                    >
                      Play Root Note
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Climbing Game Column - 2/5 width, hidden on mobile */}
        <div className="hidden lg:block lg:w-2/5 ml-4">
          <div className="bg-gray-800 rounded-md p-4 h-full">
            <h3 className="text-xl font-bold mb-2">Climbing Challenge</h3>
            
            {/* Climbing game visualization */}
            {multiplayer ? (
              <div className="relative h-full">
                {/* Climbing visualization for multiplayer */}
                <div className="relative h-[400px] bg-gray-900 rounded-md p-2 overflow-hidden">
                  {/* Mountain/Climbing path */}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-indigo-900 opacity-50"></div>
                  
                  {/* Player Positions */}
                  {players.map((player, index) => {
                    // Calculate position based on score
                    const verticalPos = Math.min(Math.max((player.score / maxHeight) * 100, 0), 95);
                    const horizontalPos = 10 + (index * 25); // Distribute horizontally
                    
                    return (
                      <div 
                        key={player.id} 
                        className="absolute transition-all duration-1000 z-10"
                        style={{
                          bottom: `${verticalPos}%`,
                          left: `${horizontalPos}%`,
                          filter: player.id === 'p1' ? 'drop-shadow(0 0 6px white)' : 'none',
                          transform: player.id === 'p1' && playerJumping ? 'translateY(-20px)' : 'none',
                        }}
                      >
                        <div className="text-3xl">{player.character}</div>
                        <div className="text-center text-xs bg-gray-800 bg-opacity-70 rounded-md px-1 -mt-1">
                          {player.name} ({player.score})
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Finish Line */}
                  <div className="absolute top-2 left-0 w-full h-4 border-t-2 border-dashed border-white flex justify-center">
                    <div className="bg-black bg-opacity-50 px-2 rounded-md -mt-3 text-xs">
                      FINISH
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative h-[400px]">
                <ClimbingGame 
                  score={score * 10}
                  maxScore={MAX_ROUNDS * 10}
                  active={climbingGameActive}
                  onComplete={() => console.log('Climbing complete!')}
                  difficulty={level}
                />
                
                {/* Single player avatar */}
                {!multiplayer && (
                  <div 
                    className={`absolute transition-all duration-1000 text-2xl left-1/2 transform -translate-x-1/2 z-20 ${playerJumping ? 'animate-bounce' : ''}`}
                    style={{ 
                      bottom: `${(score / maxHeight) * 100}%`,
                    }}
                  >
                    🧗‍♂️
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Player setup panel */}
      {showPlayerPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-md p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Multiplayer Setup</h3>
            
            <div className="mb-4">
              <label className="block text-sm mb-2">Your Name</label>
              <input 
                type="text" 
                className="w-full bg-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowPlayerPanel(false)}
                className="px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  startMultiplayerGame(playerName);
                  setShowPlayerPanel(false);
                }}
                className="px-4 py-2 bg-indigo-600 rounded-md hover:bg-indigo-700"
                disabled={!playerName.trim()}
              >
                Start Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScaleBuilder; 