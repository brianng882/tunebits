import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import RaceVisualization from './RaceVisualization';

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
  // Game state
  const [gameState, setGameState] = useState('idle'); // idle, countdown, playing, feedback, complete
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [level, setLevel] = useState(1);
  
  // Countdown state
  const [countdown, setCountdown] = useState(3);
  
  // Game data
  const [targetNote, setTargetNote] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [availableNotes, setAvailableNotes] = useState([]);
  
  // Race visualization
  const [raceActive, setRaceActive] = useState(false);
  
  // Audio refs
  const synthRef = useRef(null);
  const audioInitialized = useRef(false);
  
  // Timer refs
  const countdownTimer = useRef(null);
  
  // Update parent component with score
  useEffect(() => {
    if (onScoreUpdate) {
      onScoreUpdate(score * 10);
    }
  }, [score, onScoreUpdate]);
  
  // Handle pausing
  useEffect(() => {
    setRaceActive(!isPaused && gameState === 'playing');
    
    if (isPaused) {
      // Clear any active timers when paused
      if (countdownTimer.current) {
        clearTimeout(countdownTimer.current);
        countdownTimer.current = null;
      }
      
      // Stop any playing audio
      if (synthRef.current) {
        synthRef.current.triggerRelease();
      }
    }
  }, [isPaused, gameState]);
  
  // Set up available notes based on level
  useEffect(() => {
    if (level === 1) {
      // Level 1: Basic white keys only (C, D, E, F, G)
      setAvailableNotes(ALL_NOTES.filter(n => ['C', 'D', 'E', 'F', 'G'].includes(n.note)));
    } else if (level === 2) {
      // Level 2: All white keys
      setAvailableNotes(ALL_NOTES.filter(n => n.type === 'white'));
    } else {
      // Level 3: All notes including black keys
      setAvailableNotes(ALL_NOTES);
    }
  }, [level]);
  
  // Initialize Tone.js audio
  const initializeAudio = useCallback(async () => {
    if (audioInitialized.current) return true;
    
    try {
      await Tone.start();
      
      if (!synthRef.current) {
        synthRef.current = new Tone.Synth({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 }
        }).toDestination();
      }
      
      audioInitialized.current = true;
      console.log("Audio initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize audio:", error);
      return false;
    }
  }, []);
  
  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (countdownTimer.current) {
        clearTimeout(countdownTimer.current);
      }
      
      if (synthRef.current) {
        synthRef.current.dispose();
        synthRef.current = null;
      }
      
      audioInitialized.current = false;
    };
  }, []);
  
  // Generate a random note from available notes
  const generateRandomNote = useCallback(() => {
    if (availableNotes.length === 0) {
      console.warn("No available notes to generate from");
      return null;
    }
    
    const randomNote = availableNotes[Math.floor(Math.random() * availableNotes.length)];
    return randomNote;
  }, [availableNotes]);
  
  // Play a note
  const playNote = useCallback(async (note) => {
    if (!note || isPaused) return;
    
    // Ensure audio is initialized
    if (!audioInitialized.current) {
      const success = await initializeAudio();
      if (!success) return;
    }
    
    // Ensure audio context is running
    if (Tone.context.state !== 'running') {
      await Tone.context.resume();
    }
    
    if (synthRef.current) {
      try {
        const midiNote = 60 + ALL_NOTES.findIndex(n => n.note === note.note);
        const frequency = Tone.Frequency(midiNote, "midi");
        synthRef.current.triggerAttackRelease(frequency, "1n");
      } catch (error) {
        console.error("Error playing note:", error);
      }
    }
  }, [initializeAudio, isPaused]);
  
  // Start countdown
  const startCountdown = useCallback(() => {
    setGameState('countdown');
    setCountdown(3);
    
    const runCountdown = (count) => {
      if (count > 0) {
        setCountdown(count);
        countdownTimer.current = setTimeout(() => {
          runCountdown(count - 1);
        }, 1000);
      } else {
        // Countdown finished, start the round
        const note = generateRandomNote();
        if (note) {
          setTargetNote(note);
          setGameState('playing');
          
          // Play the note after a short delay
          setTimeout(() => {
            playNote(note);
          }, 300);
        }
      }
    };
    
    runCountdown(3);
  }, [generateRandomNote, playNote]);
  
  // Start a new round
  const startNewRound = useCallback(() => {
    setSelectedNote(null);
    setFeedback(null);
    setTargetNote(null);
    
    // Clear any existing timers
    if (countdownTimer.current) {
      clearTimeout(countdownTimer.current);
      countdownTimer.current = null;
    }
    
    // Start countdown
    startCountdown();
  }, [startCountdown]);
  
  // Start the game
  const startGame = useCallback(async () => {
    try {
      // Initialize audio first
      const audioSuccess = await initializeAudio();
      if (!audioSuccess) {
        alert("Failed to initialize audio. Please try again.");
        return;
      }
      
      // Reset game state
      setScore(0);
      setRound(1);
      setLevel(1);
      setGameState('idle');
      
      // Start first round after a brief delay
      setTimeout(() => {
        startNewRound();
        setRaceActive(true);
      }, 100);
      
    } catch (error) {
      console.error("Error starting game:", error);
      alert("Failed to start game. Please try again.");
    }
  }, [initializeAudio, startNewRound]);
  
  // Handle note selection
  const handleSelectNote = useCallback((note) => {
    if (gameState !== 'playing' || isPaused || !targetNote) return;
    
    setSelectedNote(note);
    
    const isCorrect = note.note === targetNote.note;
    
    if (isCorrect) {
      setScore(prevScore => prevScore + 1);
      setFeedback({
        message: `Correct! That's the note ${targetNote.note}.`,
        success: true
      });
      
      // Level up every 5 correct answers
      if ((score + 1) % 5 === 0 && level < 3) {
        setLevel(prev => prev + 1);
      }
    } else {
      setFeedback({
        message: `Not quite. That's ${note.note}, but the correct note is ${targetNote.note}.`,
        success: false
      });
    }
    
    setGameState('feedback');
    setRaceActive(false);
  }, [gameState, isPaused, targetNote, score, level]);
  
  // Handle continue button
  const handleContinue = useCallback(() => {
    if (round >= 15) {
      setGameState('complete');
      setRaceActive(false);
    } else {
      setRound(prev => prev + 1);
      startNewRound();
    }
  }, [round, startNewRound]);
  
  // Handle play again
  const handlePlayAgain = useCallback(() => {
    startGame();
  }, [startGame]);
  
  // Calculate black key position
  const getBlackKeyLeftPosition = (note) => {
    const noteIndex = ALL_NOTES.find(n => n.note === note)?.index || 0;
    const prevWhiteKeyIndex = ALL_NOTES.filter(n => n.type === 'white' && n.index < noteIndex).length;
    return prevWhiteKeyIndex * 3 - 0.7 + 'rem';
  };
  
  // Handle race completion
  const handleRaceComplete = () => {
    console.log("Race completed!");
  };
  
  return (
    <div className="w-full h-full">
      <div className="max-w-5xl mx-auto py-6">
        {/* Game Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Find The Note</h1>
          
          {gameState === 'idle' && (
            <div>
              <p className="mb-6 text-gray-300">
                Listen to the note and identify it on the piano keyboard. Train your ear for pitch!
              </p>
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
        
        {/* Main Game Layout */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Main Game Area */}
          <div className="md:col-span-3">
            <div className="bg-gray-800 bg-opacity-80 backdrop-blur-md rounded-lg p-6 border border-gray-700 shadow-xl">
              
              {/* Countdown State */}
              {gameState === 'countdown' && (
                <div className="text-center py-16">
                  <p className="text-xl text-white mb-8">Get ready to listen for the note...</p>
                  <div className="text-8xl font-bold text-white animate-pulse">{countdown}</div>
                </div>
              )}
              
              {/* Playing State */}
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
                    
                    {/* Piano Keyboard */}
                    <div className="keyboard-wrapper relative h-40 w-full max-w-md mx-auto mb-4 bg-gray-900 p-2 rounded-lg shadow-2xl">
                      {/* White keys */}
                      <div className="white-keys flex h-full">
                        {ALL_NOTES.filter(n => n.type === 'white').map(note => (
                          <div
                            key={note.note}
                            onClick={() => handleSelectNote(note)}
                            className={`white-key w-12 h-full rounded-b-lg border-2 cursor-pointer transition-all shadow-lg transform
                              ${availableNotes.some(n => n.note === note.note) 
                                ? 'bg-gray-50 border-gray-400 hover:bg-white hover:shadow-xl hover:scale-105 active:bg-gray-200' 
                                : 'bg-gray-300 border-gray-500 opacity-50 cursor-not-allowed'}
                              ${selectedNote?.note === note.note ? 'bg-indigo-300 border-indigo-600 shadow-indigo-400/50' : ''}
                              ${isPaused ? 'cursor-not-allowed opacity-70' : ''}
                            `}
                          >
                            <div className="h-full flex items-end justify-center pb-2 text-xs text-gray-800 font-bold">
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
                            className={`black-key absolute top-2 w-8 h-24 rounded-b-lg border-2 z-10 cursor-pointer transition-all shadow-lg transform
                              ${availableNotes.some(n => n.note === note.note) 
                                ? 'bg-gray-900 border-gray-700 hover:bg-gray-800 hover:shadow-xl hover:scale-105 active:bg-gray-700' 
                                : 'bg-gray-600 border-gray-500 opacity-50 cursor-not-allowed'}
                              ${selectedNote?.note === note.note ? 'bg-indigo-700 border-indigo-500 shadow-indigo-400/50' : ''}
                              ${isPaused ? 'cursor-not-allowed opacity-70' : ''}
                            `}
                            style={{ left: getBlackKeyLeftPosition(note.note) }}
                          >
                            <div className="h-full flex items-end justify-center pb-2 text-xs text-gray-200 font-bold">
                              {note.note}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Feedback State */}
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
                  
                  {/* Show keyboard with correct answer highlighted */}
                  <div className="keyboard-wrapper relative h-40 w-full max-w-md mx-auto mb-8 bg-gray-900 p-2 rounded-lg shadow-2xl">
                    {/* White keys */}
                    <div className="white-keys flex h-full">
                      {ALL_NOTES.filter(n => n.type === 'white').map(note => (
                        <div
                          key={note.note}
                          className={`white-key w-12 h-full rounded-b-lg border-2 shadow-lg
                            ${note.note === targetNote?.note 
                              ? 'bg-green-300 border-green-600 shadow-green-400/50' 
                              : (note.note === selectedNote?.note && note.note !== targetNote?.note)
                                ? 'bg-red-300 border-red-600 shadow-red-400/50'
                                : 'bg-gray-200 border-gray-400 opacity-60'
                            }
                          `}
                        >
                          <div className="h-full flex items-end justify-center pb-2 text-xs text-gray-800 font-bold">
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
                          className={`black-key absolute top-2 w-8 h-24 rounded-b-lg border-2 z-10 shadow-lg
                            ${note.note === targetNote?.note 
                              ? 'bg-green-700 border-green-500 shadow-green-400/50' 
                              : (note.note === selectedNote?.note && note.note !== targetNote?.note)
                                ? 'bg-red-700 border-red-500 shadow-red-400/50'
                                : 'bg-gray-700 border-gray-600 opacity-60'
                            }
                          `}
                          style={{ left: getBlackKeyLeftPosition(note.note) }}
                        >
                          <div className="h-full flex items-end justify-center pb-2 text-xs text-gray-200 font-bold">
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
              
              {/* Complete State */}
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
          
          {/* Race Visualization */}
          <div className="md:col-span-2">
            {gameState !== 'idle' && (
              <div className="h-full flex flex-col">
                <h3 className="text-lg font-bold mb-2 text-white text-center">Race to the Finish!</h3>
                <div className="flex-1 flex items-center justify-center">
                  <RaceVisualization 
                    score={score} 
                    maxScore={15} 
                    isActive={raceActive} 
                    onComplete={handleRaceComplete}
                    difficulty={level}
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