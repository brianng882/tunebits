import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import ClimbingGame from './ClimbingGame';

const ALL_NOTES = [
  { note: 'C', type: 'white', index: 0 },
  { note: 'C#', type: 'black', index: 1 },
  { note: 'D', type: 'white', index: 2 },
  { note: 'D#', type: 'black', index: 3 },
  { note: 'E', type: 'white', index: 4 },
  { note: 'F', type: 'white', index: 5 },
  { note: 'F#', type: 'black', index: 6 },
  { note: 'G', type: 'white', index: 7 },
  { note: 'G#', type: 'black', index: 8 },
  { note: 'A', type: 'white', index: 9 },
  { note: 'A#', type: 'black', index: 10 },
  { note: 'B', type: 'white', index: 11 }
];

function PianoGame({ onScoreUpdate, isPaused, isCompetition = false }) {
  const [gameState, setGameState] = useState('idle'); // idle, playing, feedback, complete
  const [level, setLevel] = useState(1); 
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [targetNote, setTargetNote] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [availableNotes, setAvailableNotes] = useState([]);
  const [climbingGameActive, setClimbingGameActive] = useState(false);
  
  // Use ref for synth to prevent recreation
  const synthRef = useRef(null);
  const audioInitialized = useRef(false);
  
  // Update parent component with score
  useEffect(() => {
    if (onScoreUpdate) {
      onScoreUpdate(score * 10);
    }
  }, [score, onScoreUpdate]);
  
  // Handle pausing
  useEffect(() => {
    if (isPaused && gameState === 'playing') {
      // Stop any playing sounds if game is paused
      if (synthRef.current) {
        synthRef.current.triggerRelease();
      }
    }
    
    // Pause the climbing game when the main game is paused
    setClimbingGameActive(!isPaused);
  }, [isPaused, gameState]);
  
  // Initialize Tone.js
  const initializeAudio = useCallback(async () => {
    if (audioInitialized.current) return;
    
    try {
      // Start audio context with user gesture
      await Tone.start();
      
      // Create a synth for playing notes if it doesn't exist
      if (!synthRef.current) {
        synthRef.current = new Tone.Synth({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 }
        }).toDestination();
      }
      
      audioInitialized.current = true;
      console.log("Audio initialized successfully");
    } catch (error) {
      console.error("Failed to initialize audio:", error);
    }
  }, []);
  
  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.dispose();
        synthRef.current = null;
      }
      audioInitialized.current = false;
    };
  }, []);
  
  // Set up available notes based on level
  useEffect(() => {
    if (level === 1) {
      // Level 1: C, D, E, F, G
      setAvailableNotes(ALL_NOTES.filter(n => ['C', 'D', 'E', 'F', 'G'].includes(n.note)));
    } else if (level === 2) {
      // Level 2: All white keys
      setAvailableNotes(ALL_NOTES.filter(n => n.type === 'white'));
    } else {
      // Level 3: All notes
      setAvailableNotes(ALL_NOTES);
    }
  }, [level]);
  
  // Generate a random note
  const generateRandomNote = useCallback(() => {
    const randomNote = availableNotes[Math.floor(Math.random() * availableNotes.length)];
    setTargetNote(randomNote);
    return randomNote;
  }, [availableNotes]);
  
  // Play a note
  const playNote = async (note) => {
    if (!note) return;
    
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
      const midiNote = 60 + ALL_NOTES.findIndex(n => n.note === note.note);
      const frequency = Tone.Frequency(midiNote, "midi");
      
      // Play the note
      synthRef.current.triggerAttackRelease(frequency, "2n");
    }
  };
  
  // Start a new round
  const startNewRound = () => {
    setSelectedNote(null);
    setFeedback(null);
    
    // Generate a random note and play it
    const note = generateRandomNote();
    playNote(note);
    
    setGameState('playing');
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
  
  // Handle note selection
  const handleSelectNote = (note) => {
    if (isPaused) return;
    
    setSelectedNote(note);
    
    // Check if correct
    const isCorrect = note.note === targetNote.note;
    
    // Update score and provide feedback
    if (isCorrect) {
      setScore(prevScore => prevScore + 1);
      setFeedback({
        message: `Correct! That's the note ${targetNote.note}.`,
        success: true
      });
    } else {
      setFeedback({
        message: `Not quite. That's ${note.note}, but the correct note is ${targetNote.note}.`,
        success: false
      });
    }
    
    setGameState('feedback');
    
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
    startGame();
  };
  
  // Calculate keyboard positions for black keys
  const getBlackKeyLeftPosition = (note) => {
    const noteIndex = ALL_NOTES.find(n => n.note === note)?.index || 0;
    const prevWhiteKeyIndex = ALL_NOTES.filter(n => n.type === 'white' && n.index < noteIndex).length;
    return prevWhiteKeyIndex * 3 - 0.7 + 'rem';
  };
  
  // Handle climbing game completion
  const handleClimbingComplete = () => {
    console.log("Climbing game completed!");
    // Add any special rewards or animations here
  };
  
  return (
    <div className="w-full h-full">
      <div className="max-w-5xl mx-auto py-6">
        {/* Game Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Find The Note</h1>
          
          {gameState === 'idle' && (
            <div>
              <p className="mb-6 text-gray-300">Listen to the note and identify it on the piano keyboard. Train your ear for pitch!</p>
              <button
                onClick={startGame}
                className="glow-button bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-8 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-800 transform transition-all hover:-translate-y-1"
              >
                Start Game
              </button>
            </div>
          )}
          
          {gameState !== 'idle' && (
            <div className="flex justify-center items-center gap-6 mb-2">
              <div className="bg-gray-800 rounded-lg px-4 py-2">
                <p className="text-sm text-gray-400">ROUND</p>
                <p className="text-xl font-bold text-white">{round}/15</p>
              </div>
              <div className="bg-gray-800 rounded-lg px-4 py-2">
                <p className="text-sm text-gray-400">SCORE</p>
                <p className="text-xl font-bold text-white">{score}</p>
              </div>
              <div className="bg-gray-800 rounded-lg px-4 py-2">
                <p className="text-sm text-gray-400">LEVEL</p>
                <p className="text-xl font-bold text-white">{level}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Main Game Layout - split into two columns */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Main Game Area - Takes 3/5 of the width on medium+ screens */}
          <div className="md:col-span-3">
            <div className="bg-gray-800 bg-opacity-80 backdrop-blur-md rounded-lg p-6 border border-gray-700 shadow-xl">
              {gameState === 'playing' && (
                <div className="text-center">
                  <div className="mb-8">
                    <p className="text-xl text-white mb-4">What note do you hear?</p>
                    
                    <div className="flex justify-center mb-8">
                      <button
                        onClick={() => playNote(targetNote)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                        disabled={isPaused}
                      >
                        Play Note Again
                      </button>
                    </div>
                    
                    <div className="keyboard-wrapper relative h-40 w-full max-w-md mx-auto mb-4">
                      {/* White keys */}
                      <div className="white-keys flex h-full">
                        {ALL_NOTES.filter(n => n.type === 'white').map(note => (
                          <div
                            key={note.note}
                            onClick={() => handleSelectNote(note)}
                            className={`white-key w-12 h-full bg-white rounded-b-md border border-gray-300 
                              ${availableNotes.some(n => n.note === note.note) ? 'cursor-pointer hover:bg-gray-100' : 'opacity-50 cursor-not-allowed'}
                              ${selectedNote?.note === note.note ? 'bg-indigo-200 border-indigo-400' : ''}
                              ${isPaused ? 'cursor-not-allowed' : ''}`
                            }
                          >
                            <div className="h-full flex items-end justify-center pb-2 text-xs text-gray-500 font-semibold">
                              {note.note}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Black keys */}
                      <div className="black-keys absolute top-0 left-0 w-full">
                        {ALL_NOTES.filter(n => n.type === 'black').map(note => (
                          <div
                            key={note.note}
                            onClick={() => handleSelectNote(note)}
                            className={`black-key absolute top-0 w-8 h-24 bg-gray-800 rounded-b-md z-10
                              ${availableNotes.some(n => n.note === note.note) ? 'cursor-pointer hover:bg-gray-700' : 'opacity-50 cursor-not-allowed'}
                              ${selectedNote?.note === note.note ? 'bg-indigo-800 border-indigo-700' : ''}
                              ${isPaused ? 'cursor-not-allowed' : ''}`
                            }
                            style={{ left: getBlackKeyLeftPosition(note.note) }}
                          >
                            <div className="h-full flex items-end justify-center pb-2 text-xs text-gray-400 font-semibold">
                              {note.note}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {gameState === 'feedback' && (
                <div className="text-center">
                  <div className={`text-4xl mb-4 ${feedback?.success ? 'text-green-500' : 'text-amber-500'}`}>
                    {feedback?.success ? '✅' : '💡'}
                  </div>
                  <h2 className="text-2xl font-bold mb-6 text-white">{feedback?.message}</h2>
                  
                  <div className="mb-8">
                    <div className="text-white mb-2">Listen again:</div>
                    <button
                      onClick={() => playNote(targetNote)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                    >
                      Play Note
                    </button>
                  </div>
                  
                  <div className="keyboard-wrapper relative h-40 w-full max-w-md mx-auto mb-8">
                    {/* White keys */}
                    <div className="white-keys flex h-full">
                      {ALL_NOTES.filter(n => n.type === 'white').map(note => (
                        <div
                          key={note.note}
                          className={`white-key w-12 h-full rounded-b-md border 
                            ${note.note === targetNote.note 
                              ? 'bg-green-200 border-green-500' 
                              : (note.note === selectedNote?.note && note.note !== targetNote.note)
                                ? 'bg-red-200 border-red-500'
                                : 'bg-white border-gray-300 opacity-60'
                            }`
                          }
                        >
                          <div className="h-full flex items-end justify-center pb-2 text-xs text-gray-500 font-semibold">
                            {note.note}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Black keys */}
                    <div className="black-keys absolute top-0 left-0 w-full">
                      {ALL_NOTES.filter(n => n.type === 'black').map(note => (
                        <div
                          key={note.note}
                          className={`black-key absolute top-0 w-8 h-24 rounded-b-md z-10
                            ${note.note === targetNote.note 
                              ? 'bg-green-800 border-green-900' 
                              : (note.note === selectedNote?.note && note.note !== targetNote.note)
                                ? 'bg-red-800 border-red-900'
                                : 'bg-gray-800 border-gray-900 opacity-60'
                            }`
                          }
                          style={{ left: getBlackKeyLeftPosition(note.note) }}
                        >
                          <div className="h-full flex items-end justify-center pb-2 text-xs text-gray-400 font-semibold">
                            {note.note}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={handleContinue}
                    className="glow-button bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 rounded-lg transform transition-all hover:-translate-y-1"
                  >
                    Continue
                  </button>
                </div>
              )}
              
              {gameState === 'complete' && (
                <div className="text-center p-6">
                  <div className="text-6xl mb-6">🏆</div>
                  <h2 className="text-3xl font-bold mb-4 text-white">Game Complete!</h2>
                  <p className="text-xl mb-2 text-gray-300">Your final score:</p>
                  <p className="text-4xl font-bold text-indigo-400 mb-8">{score} / 15</p>
                  
                  <button
                    onClick={handlePlayAgain}
                    className="glow-button bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white px-8 py-3 rounded-lg transform transition-all hover:-translate-y-1"
                  >
                    Play Again
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Climbing Game Visualization - Takes 2/5 of the width on medium+ screens */}
          <div className="md:col-span-2">
            {gameState !== 'idle' && (
              <div className="h-full flex flex-col">
                <h3 className="text-lg font-bold mb-2 text-white text-center">Climb to Victory!</h3>
                <div className="flex-1 flex items-center justify-center">
                  <ClimbingGame 
                    score={score} 
                    maxScore={15} 
                    isActive={climbingGameActive && gameState === 'playing'} 
                    onComplete={handleClimbingComplete}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PianoGame; 