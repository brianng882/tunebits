import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import ClimbingGame from './ClimbingGame';

function ChordRecognition({ onScoreUpdate, isPaused, isCompetition = false }) {
  const [gameState, setGameState] = useState('idle');
  const [targetChord, setTargetChord] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [round, setRound] = useState(1);
  const [level, setLevel] = useState(1);
  const [options, setOptions] = useState([]);
  const [chordNotes, setChordNotes] = useState([]);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [climbingGameActive, setClimbingGameActive] = useState(false);
  
  // Use ref for synth to prevent recreation
  const synthRef = useRef(null);
  const audioInitialized = useRef(false);
  
  // All notes in one octave with types for rendering
  const allNotes = [
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
  
  // Define chord types based on difficulty levels
  const chordTypes = {
    1: [ // Beginner
      { 
        name: 'Major', 
        notes: [0, 4, 7], // intervals in semitones (root, major third, perfect fifth)
        symbol: 'maj'
      },
      { 
        name: 'Minor', 
        notes: [0, 3, 7], // intervals in semitones (root, minor third, perfect fifth)
        symbol: 'min'
      },
    ],
    2: [ // Intermediate - add to existing chords
      { 
        name: 'Diminished', 
        notes: [0, 3, 6], // intervals in semitones (root, minor third, diminished fifth)
        symbol: 'dim'
      },
      { 
        name: 'Augmented', 
        notes: [0, 4, 8], // intervals in semitones (root, major third, augmented fifth)
        symbol: 'aug'
      },
    ],
    3: [ // Advanced - add to existing chords
      { 
        name: 'Dominant 7th', 
        notes: [0, 4, 7, 10], // root, major third, perfect fifth, minor seventh
        symbol: '7'
      },
      { 
        name: 'Major 7th', 
        notes: [0, 4, 7, 11], // root, major third, perfect fifth, major seventh
        symbol: 'maj7'
      },
      { 
        name: 'Minor 7th', 
        notes: [0, 3, 7, 10], // root, minor third, perfect fifth, minor seventh
        symbol: 'min7'
      }
    ]
  };
  
  // Root notes to choose from
  const rootNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  
  // Update parent component with score
  useEffect(() => {
    if (onScoreUpdate) {
      onScoreUpdate(score * 100); // Convert to a larger score for display
    }
  }, [score, onScoreUpdate]);
  
  // Handle pausing
  useEffect(() => {
    if (isPaused && gameState === 'playing') {
      // Stop any playing sounds if game is paused
      if (synthRef.current) {
        synthRef.current.releaseAll();
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
      
      // Create a polyphonic synth for playing chords if it doesn't exist
      if (!synthRef.current) {
        synthRef.current = new Tone.PolySynth(Tone.Synth, {
          oscillator: {
            type: "sine"
          },
          envelope: {
            attack: 0.02,
            decay: 0.3,
            sustain: 0.2,
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
  
  // Generate a new target chord
  const generateTargetChord = useCallback(() => {
    // Collect all available chord types based on current level
    let availableChordTypes = [];
    for (let i = 1; i <= level; i++) {
      availableChordTypes = [...availableChordTypes, ...chordTypes[i]];
    }
    
    // Select a random chord type
    const randomChordType = availableChordTypes[Math.floor(Math.random() * availableChordTypes.length)];
    
    // Select a random root note (we'll use 4th octave)
    const rootNote = rootNotes[Math.floor(Math.random() * rootNotes.length)];
    
    // Create the full chord
    const chordWithOctave = {
      ...randomChordType,
      root: rootNote,
      fullName: `${rootNote} ${randomChordType.name}`,
      fullSymbol: `${rootNote}${randomChordType.symbol}`
    };
    
    // Calculate actual note names for the chord
    const rootIndex = allNotes.findIndex(note => note.note === rootNote);
    const actualNotes = randomChordType.notes.map(interval => {
      const noteIndex = (rootIndex + interval) % 12;
      return allNotes[noteIndex].note;
    });
    
    setChordNotes(actualNotes);
    setTargetChord(chordWithOctave);
    
    // Generate options for multiple choice
    generateOptions(chordWithOctave, availableChordTypes);
    
    return chordWithOctave;
  }, [level]);
  
  // Generate options for the multiple choice question
  const generateOptions = (correctChord, availableChordTypes) => {
    // Always include the correct answer
    let choiceOptions = [correctChord];
    
    // Add other random options
    while (choiceOptions.length < 4) {
      // Get a random chord type that's not already in our options
      const randomChordType = availableChordTypes[Math.floor(Math.random() * availableChordTypes.length)];
      
      // If we have few chord types, we can vary the root note
      const rootNote = rootNotes[Math.floor(Math.random() * rootNotes.length)];
      
      const newOption = {
        ...randomChordType,
        root: rootNote,
        fullName: `${rootNote} ${randomChordType.name}`,
        fullSymbol: `${rootNote}${randomChordType.symbol}`
      };
      
      // Check if this option is already in the array
      const isDuplicate = choiceOptions.some(
        opt => opt.fullSymbol === newOption.fullSymbol
      );
      
      if (!isDuplicate) {
        choiceOptions.push(newOption);
      }
    }
    
    // Shuffle the options
    for (let i = choiceOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choiceOptions[i], choiceOptions[j]] = [choiceOptions[j], choiceOptions[i]];
    }
    
    setOptions(choiceOptions);
  };
  
  // Play the target chord
  const playChord = useCallback(async () => {
    if (isPaused) return;
    
    // Ensure audio is initialized
    if (!audioInitialized.current) {
      await initializeAudio();
    }
    
    if (synthRef.current && targetChord) {
      // Ensure context is running
      if (Tone.context.state !== 'running') {
        await Tone.context.resume();
      }
      
      // Convert intervals to actual notes
      const noteNames = targetChord.notes.map(interval => {
        // Get MIDI number for root note in 4th octave
        const rootMidi = Tone.Frequency(`${targetChord.root}4`).toMidi();
        // Add interval and convert back to note name
        return Tone.Frequency(rootMidi + interval, "midi").toNote();
      });
      
      // Play the chord
      synthRef.current.triggerAttackRelease(noteNames, "2n");
    }
  }, [targetChord, initializeAudio, isPaused]);
  
  // Play chord broken (arpeggiated)
  const playBroken = useCallback(async () => {
    if (isPaused) return;
    
    // Ensure audio is initialized
    if (!audioInitialized.current) {
      await initializeAudio();
    }
    
    if (synthRef.current && targetChord) {
      // Ensure context is running
      if (Tone.context.state !== 'running') {
        await Tone.context.resume();
      }
      
      // Convert intervals to actual notes
      const noteNames = targetChord.notes.map(interval => {
        // Get MIDI number for root note in 4th octave
        const rootMidi = Tone.Frequency(`${targetChord.root}4`).toMidi();
        // Add interval and convert back to note name
        return Tone.Frequency(rootMidi + interval, "midi").toNote();
      });
      
      // Play notes sequentially
      const now = Tone.now();
      noteNames.forEach((note, index) => {
        synthRef.current.triggerAttackRelease(note, "8n", now + index * 0.3);
      });
    }
  }, [targetChord, initializeAudio, isPaused]);
  
  // Start a new round
  const startNewRound = useCallback(() => {
    setFeedback(null);
    setCountdown(3);
    setGameState('countdown');
    setShowKeyboard(false);
    generateTargetChord();
  }, [generateTargetChord]);
  
  // Countdown timer
  useEffect(() => {
    let timer;
    if (gameState === 'countdown' && countdown > 0 && !isPaused) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (gameState === 'countdown' && countdown === 0) {
      // Play the chord once countdown is complete
      setGameState('playing');
      setTimeout(() => {
        playChord();
      }, 500);
    }
    return () => clearTimeout(timer);
  }, [gameState, countdown, playChord, isPaused]);
  
  // Start the game
  const startGame = async () => {
    try {
      // Initialize audio with user gesture
      await initializeAudio();
      
      setScore(0);
      setRound(1);
      setLevel(1);
      startNewRound();
      setClimbingGameActive(true);
    } catch (error) {
      console.error("Error starting game:", error);
      setFeedback({
        message: "There was a problem starting the game. Please try again.",
        success: false
      });
    }
  };
  
  // Handle option selection
  const handleOptionSelect = (selectedChord) => {
    if (gameState !== 'playing' || isPaused) return;
    
    const isCorrect = selectedChord.fullSymbol === targetChord.fullSymbol;
    
    setFeedback({
      correct: isCorrect,
      message: isCorrect 
        ? "Correct! Great ear!" 
        : `Incorrect. That was a ${targetChord.fullName} chord.`,
      targetChord: targetChord
    });
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    
    setShowKeyboard(true);
    setGameState('feedback');
  };
  
  // Handle the continue button in feedback state
  const handleContinue = () => {
    // Update round
    const newRound = round + 1;
    setRound(newRound);
    
    // Increase level after every 5 rounds if not at max level
    if (newRound % 5 === 0 && level < 3) {
      setLevel(prev => prev + 1);
    }
    
    // Check if the game is complete (15 rounds total)
    if (newRound > 15) {
      setGameState('complete');
    } else {
      startNewRound();
    }
  };
  
  // Handle climbing game completion
  const handleClimbingComplete = () => {
    console.log("Climbing game completed!");
    // Add any special rewards or animations here
  };
  
  return (
    <div className="w-full h-full">
      <div className="max-w-3xl mx-auto py-8">
        {/* Game Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4 text-white">Chord Recognition</h1>
          
          {gameState === 'idle' && (
            <div>
              <p className="mb-6 text-gray-300">Listen to the chord and select the correct type. Train your ear to recognize different chord qualities!</p>
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
                  <p className="text-sm text-gray-400">LEVEL</p>
                  <p className="text-xl font-bold text-white">{level}</p>
                </div>
                <div className="bg-gray-800 rounded-lg px-4 py-2">
                  <p className="text-sm text-gray-400">ROUND</p>
                  <p className="text-xl font-bold text-white">{round}/15</p>
                </div>
                <div className="bg-gray-800 rounded-lg px-4 py-2">
                  <p className="text-sm text-gray-400">SCORE</p>
                  <p className="text-xl font-bold text-white">{score}</p>
                </div>
              </div>
              
              {gameState === 'countdown' && (
                <div className="countdown text-6xl font-bold text-white">{countdown}</div>
              )}
            </div>
          )}
        </div>

        {/* Game Area */}
        <div className="bg-gray-800 bg-opacity-80 backdrop-blur-md rounded-xl p-6 shadow-xl border border-gray-700">
          {gameState === 'playing' && (
            <div className="text-center">
              <p className="text-xl mb-6 text-white">What chord is this?</p>
              
              {/* Play buttons */}
              <div className="flex justify-center gap-4 mb-8">
                <button
                  onClick={playChord}
                  disabled={isPaused}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
                >
                  <span>🎹</span> Play Chord
                </button>
                <button
                  onClick={playBroken}
                  disabled={isPaused}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
                >
                  <span>🎵</span> Play Broken
                </button>
              </div>
              
              {/* Chord options */}
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                {options.map((chord, index) => (
                  <button
                    key={index}
                    onClick={() => handleOptionSelect(chord)}
                    disabled={isPaused}
                    className="chord-option bg-gray-700 hover:bg-gray-600 text-white py-4 px-3 rounded-lg transition-colors"
                  >
                    <div className="font-bold text-lg">{chord.fullName}</div>
                    <div className="text-xs text-gray-300">{chord.fullSymbol}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {gameState === 'feedback' && (
            <div className="text-center p-6">
              <div className={`text-5xl mb-4 ${feedback?.correct ? 'text-green-500' : 'text-orange-500'}`}>
                {feedback?.correct ? '🎵' : '🎼'}
              </div>
              <h2 className="text-2xl font-bold mb-6 text-white">{feedback?.message}</h2>
              
              {/* Keyboard visualization for the chord notes */}
              {showKeyboard && (
                <div className="mb-8">
                  <p className="text-lg font-semibold mb-2 text-white">
                    {feedback?.targetChord?.fullName} chord notes:
                  </p>
                  
                  <div className="relative flex justify-center mb-4 overflow-x-auto py-4">
                    <div className="flex relative">
                      {/* White Keys */}
                      <div className="flex">
                        {allNotes.filter(note => note.type === 'white').map((noteObj, index) => (
                          <div
                            key={noteObj.note}
                            className={`
                              w-10 h-32 
                              piano-key
                              relative 
                              border-2 border-gray-700
                              rounded-b-md
                              flex items-end justify-center
                              pb-2
                              ${chordNotes.includes(noteObj.note) 
                                ? 'bg-blue-200 border-blue-500 text-gray-900 shadow-glow' 
                                : 'bg-white border-gray-500 text-gray-900 opacity-60'
                              }
                            `}
                          >
                            <span className="text-xs font-semibold">{noteObj.note}</span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Black Keys */}
                      <div className="absolute top-0 left-0 right-0 flex">
                        {allNotes.map((noteObj, index) => {
                          if (noteObj.type !== 'black') return null;
                          
                          // Find white key before this black key to position it
                          const prevWhiteNotes = allNotes.filter(n => n.type === 'white');
                          const prevNoteIndex = allNotes.findIndex(n => n.note === noteObj.note) - 1;
                          const prevWhiteIndex = prevWhiteNotes.findIndex(n => 
                            n.note === allNotes[prevNoteIndex].note
                          );
                          
                          // Position black keys between white keys
                          const leftPos = prevWhiteIndex * 40 + 30; // Adjusted for smaller keys
                          
                          return (
                            <div
                              key={noteObj.note}
                              className={`
                                w-6 h-20
                                piano-key
                                absolute
                                border-2 border-gray-900
                                rounded-b-md
                                flex items-end justify-center
                                pb-1
                                ${chordNotes.includes(noteObj.note)
                                  ? 'bg-blue-700 border-blue-900 text-white shadow-glow-blue' 
                                  : 'bg-gray-900 border-gray-800 text-white opacity-60'
                                }
                                z-10
                              `}
                              style={{ left: `${leftPos}px` }}
                            >
                              <span className="text-[10px] font-semibold">{noteObj.note}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={playChord}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition-colors text-sm"
                    >
                      Listen Again
                    </button>
                    <button
                      onClick={playBroken}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors text-sm"
                    >
                      Hear Broken
                    </button>
                  </div>
                </div>
              )}
              
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
              <div className="text-7xl mb-6">🎉</div>
              <h2 className="text-3xl font-bold mb-4 text-white">Game Complete!</h2>
              <p className="text-xl mb-4 text-white">Your final score: {score}/15</p>
              {score >= 12 && <p className="text-green-400 font-bold mb-4">Excellent job! Your ear for chords is outstanding!</p>}
              {score >= 8 && score < 12 && <p className="text-blue-400 font-bold mb-4">Good work! Your chord recognition skills are developing well.</p>}
              {score < 8 && <p className="text-orange-400 font-bold mb-4">Keep practicing! Chord recognition takes time to develop.</p>}
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
    </div>
  );
}

export default ChordRecognition; 