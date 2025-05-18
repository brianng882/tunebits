import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';

function PianoGame({ onScoreUpdate, isPaused }) {
  const [gameState, setGameState] = useState('idle');
  const [targetNote, setTargetNote] = useState(null);
  const [score, setScore] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [resetCountdown, setResetCountdown] = useState(2);
  const [feedback, setFeedback] = useState(null);
  
  // Use ref for synth to prevent recreation
  const synthRef = useRef(null);
  const audioInitialized = useRef(false);
  
  // All notes in one octave with types for rendering
  const notes = [
    { note: 'C', type: 'white' },
    { note: 'C#', type: 'black' },
    { note: 'D', type: 'white' },
    { note: 'D#', type: 'black' },
    { note: 'E', type: 'white' },
    { note: 'F', type: 'white' },
    { note: 'F#', type: 'black' },
    { note: 'G', type: 'white' },
    { note: 'G#', type: 'black' },
    { note: 'A', type: 'white' },
    { note: 'A#', type: 'black' },
    { note: 'B', type: 'white' }
  ];
  const octave = 4; // Middle octave
  
  // Update parent component with score
  useEffect(() => {
    if (onScoreUpdate) {
      onScoreUpdate(score * 150); // Convert to a larger score for display
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
          oscillator: {
            type: 'sine'
          },
          envelope: {
            attack: 0.005,
            decay: 0.1,
            sustain: 0.3,
            release: 1
          }
        }).toDestination();
      }
      
      audioInitialized.current = true;
      console.log("Audio initialized successfully");
    } catch (error) {
      console.error("Failed to initialize audio:", error);
      setFeedback({
        message: "There was a problem initializing audio. Please try again.",
        success: false
      });
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
  
  // Generate a random note
  const generateRandomNote = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * notes.length);
    const note = notes[randomIndex].note + octave;
    setTargetNote(note);
    return note;
  }, [notes]);
  
  // Play the target note
  const playTargetNote = useCallback(async () => {
    // Ensure audio is initialized
    if (!audioInitialized.current) {
      await initializeAudio();
    }
    
    if (synthRef.current && targetNote) {
      // Ensure context is running
      if (Tone.context.state !== 'running') {
        await Tone.context.resume();
      }
      
      synthRef.current.triggerAttackRelease(targetNote, '1n');
    }
  }, [targetNote, initializeAudio]);
  
  // Check if user's answer is correct
  const checkAnswer = (note) => {
    const userNote = note + octave;
    
    if (userNote === targetNote) {
      // Correct answer
      setFeedback({
        message: "Correct!",
        success: true
      });
      setScore(score + 1);
      setGameState('success');
      startResetCountdown();
    } else {
      // Wrong answer
      setFeedback({
        message: `Incorrect! The note was ${targetNote.replace(/[0-9]/g, '')}`,
        success: false
      });
      setGameState('failure');
      startResetCountdown();
    }
  };
  
  // Start the game
  const startGame = async () => {
    try {
      // Initialize audio with user gesture
      await initializeAudio();
      
      setScore(0);
      setFeedback(null);
      setCountdown(3);
      setGameState('countdown');
    } catch (error) {
      console.error("Error starting game:", error);
      setFeedback({
        message: "There was a problem starting the game. Please try again.",
        success: false
      });
    }
  };
  
  // Countdown timer
  useEffect(() => {
    let timer;
    if (gameState === 'countdown' && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (gameState === 'countdown' && countdown === 0) {
      // Start gameplay after countdown
      setGameState('playing');
      const note = generateRandomNote();
      
      // Play the note after a short delay
      setTimeout(() => {
        playTargetNote();
      }, 500);
    }
    
    return () => clearTimeout(timer);
  }, [gameState, countdown, generateRandomNote, playTargetNote]);
  
  // Reset countdown after each answer
  const startResetCountdown = () => {
    setResetCountdown(2);
  };
  
  useEffect(() => {
    let timer;
    if ((gameState === 'success' || gameState === 'failure') && resetCountdown > 0) {
      timer = setTimeout(() => {
        setResetCountdown(prev => prev - 1);
      }, 1000);
    } else if ((gameState === 'success' || gameState === 'failure') && resetCountdown === 0) {
      if (score >= 5) {
        // Game complete
        setGameState('complete');
      } else {
        // Next round
        setGameState('playing');
        const note = generateRandomNote();
        
        // Play the note after a short delay
        setTimeout(() => {
          playTargetNote();
        }, 500);
      }
    }
    
    return () => clearTimeout(timer);
  }, [gameState, resetCountdown, score, generateRandomNote, playTargetNote]);
  
  // Function to play a note when user clicks a key
  const playNote = async (note) => {
    // Ensure audio is initialized
    if (!audioInitialized.current) {
      await initializeAudio();
    }
    
    if (synthRef.current) {
      // Ensure context is running
      if (Tone.context.state !== 'running') {
        await Tone.context.resume();
      }
      
      const fullNote = note + octave;
      synthRef.current.triggerAttackRelease(fullNote, '8n');
    }
  };
  
  return (
    <div className="w-full h-full">
      <div className="max-w-3xl mx-auto py-8">
        {/* Game Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4 text-white">Find The Note</h1>
          
          {gameState === 'idle' && (
            <div>
              <p className="mb-6 text-gray-300">Listen to the note and identify it on the piano keyboard. Train your ear!</p>
              <button
                onClick={startGame}
                className="glow-button bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-800 transform transition-all hover:-translate-y-1"
              >
                Start Game
              </button>
            </div>
          )}

          {gameState !== 'idle' && (
            <div className="space-y-2">
              <div className="flex justify-center items-center gap-6 mb-4">
                <div className="bg-gray-800 rounded-lg px-4 py-2">
                  <p className="text-sm text-gray-400">SCORE</p>
                  <p className="text-xl font-bold text-white">{score}/5</p>
                </div>
              </div>
              
              {gameState === 'countdown' && (
                <div className="countdown text-6xl font-bold text-white">{countdown}</div>
              )}
              
              {gameState === 'success' && (
                <div className="text-2xl font-bold text-green-400">
                  <span className="mr-2">✓</span>Next note in... {resetCountdown}
                </div>
              )}
              
              {gameState === 'failure' && (
                <div className="text-2xl font-bold text-red-400">
                  <span className="mr-2">✗</span>Next note in... {resetCountdown}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Game Area */}
        <div className="bg-gray-800 bg-opacity-80 backdrop-blur-md rounded-xl p-6 shadow-xl border border-gray-700">
          {(gameState === 'playing' || gameState === 'success' || gameState === 'failure') && (
            <div className="mb-6 text-center">
              <button 
                onClick={playTargetNote}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg mb-4 transition-colors"
              >
                🔊 Listen Again
              </button>
              
              {feedback && (
                <div className={`text-xl font-bold mt-4 ${feedback.success ? 'text-green-400' : 'text-red-400'}`}>
                  {feedback.message}
                </div>
              )}
            </div>
          )}
          
          {/* Piano Keys - Fixed implementation */}
          <div className="relative flex justify-center mb-8 overflow-x-auto py-4">
            <div className="flex relative">
              {/* White Keys */}
              <div className="flex">
                {notes.filter(noteObj => noteObj.type === 'white').map((noteObj, index) => (
                  <button
                    key={noteObj.note}
                    className={`
                      w-12 h-40 
                      piano-key
                      relative 
                      border-2 border-gray-800
                      rounded-b-md
                      flex items-end justify-center
                      pb-2
                      ${gameState === 'playing' ? 'cursor-pointer' : 'cursor-default'}
                      transition-colors
                      bg-gray-100 text-gray-900
                      hover:bg-white
                      active:bg-gray-200
                      disabled:opacity-70
                    `}
                    onClick={async () => {
                      if (gameState === 'playing') {
                        await playNote(noteObj.note);
                        checkAnswer(noteObj.note);
                      }
                    }}
                    disabled={gameState !== 'playing' || isPaused}
                  >
                    <span className="text-sm font-semibold">{noteObj.note}</span>
                  </button>
                ))}
              </div>
              
              {/* Black Keys */}
              <div className="absolute top-0 left-0 right-0 flex">
                {notes.map((noteObj, index) => {
                  if (noteObj.type !== 'black') return null;
                  
                  // Find white key before this black key to position it
                  const prevWhiteNotes = notes.filter(n => n.type === 'white');
                  const prevNoteIndex = notes.findIndex(n => n.note === noteObj.note) - 1;
                  const prevWhiteIndex = prevWhiteNotes.findIndex(n => 
                    n.note === notes[prevNoteIndex].note
                  );
                  
                  // Position black keys between white keys
                  const leftPos = prevWhiteIndex * 48 + 36; // 48px per white key, offset by 3/4 of key
                  
                  return (
                    <button
                      key={noteObj.note}
                      className={`
                        w-8 h-24
                        piano-key
                        absolute
                        border-2 border-gray-700
                        rounded-b-md
                        flex items-end justify-center
                        pb-2
                        ${gameState === 'playing' ? 'cursor-pointer' : 'cursor-default'}
                        transition-colors
                        bg-gray-900 text-gray-200
                        hover:bg-gray-800
                        active:bg-gray-700
                        disabled:opacity-70
                        z-10
                      `}
                      style={{ left: `${leftPos}px` }}
                      onClick={async () => {
                        if (gameState === 'playing') {
                          await playNote(noteObj.note);
                          checkAnswer(noteObj.note);
                        }
                      }}
                      disabled={gameState !== 'playing' || isPaused}
                    >
                      <span className="text-xs font-semibold">{noteObj.note}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          {gameState === 'complete' && (
            <div className="text-center p-6">
              <div className="text-7xl mb-6">🎉</div>
              <h2 className="text-3xl font-bold mb-4 text-white">Perfect Score!</h2>
              <p className="text-xl mb-8 text-gray-300">You've successfully identified all the notes!</p>
              <button
                onClick={startGame}
                className="glow-button bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white px-8 py-3 rounded-lg transform transition-all hover:-translate-y-1"
              >
                Play Again
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Add styles for piano key visual feedback */}
      <style jsx>{`
        .piano-key:active {
          transform: translateY(2px);
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.7);
        }
      `}</style>
    </div>
  );
}

export default PianoGame; 