import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import RaceVisualization from './RaceVisualization';

// Define all musical intervals
const INTERVALS = [
  { id: 'P1', name: 'Perfect Unison', semitones: 0 },
  { id: 'm2', name: 'Minor 2nd', semitones: 1 },
  { id: 'M2', name: 'Major 2nd', semitones: 2 },
  { id: 'm3', name: 'Minor 3rd', semitones: 3 },
  { id: 'M3', name: 'Major 3rd', semitones: 4 },
  { id: 'P4', name: 'Perfect 4th', semitones: 5 },
  { id: 'TT', name: 'Tritone', semitones: 6 },
  { id: 'P5', name: 'Perfect 5th', semitones: 7 },
  { id: 'm6', name: 'Minor 6th', semitones: 8 },
  { id: 'M6', name: 'Major 6th', semitones: 9 },
  { id: 'm7', name: 'Minor 7th', semitones: 10 },
  { id: 'M7', name: 'Major 7th', semitones: 11 },
  { id: 'P8', name: 'Perfect Octave', semitones: 12 }
];

// All notes for keyboard display
const allNotes = [
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

function IntervalTraining({ onScoreUpdate, isPaused, isCompetition = false }) {
  const [gameState, setGameState] = useState('idle'); // idle, playing, feedback, complete
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [currentInterval, setCurrentInterval] = useState(null);
  const [selectedInterval, setSelectedInterval] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [availableIntervals, setAvailableIntervals] = useState([]);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [intervalNotes, setIntervalNotes] = useState([]);
  const [raceActive, setRaceActive] = useState(false);
  
  // Use refs for audio objects
  const synthRef = useRef(null);
  const audioInitialized = useRef(false);
  
  // Update parent with score
  useEffect(() => {
    if (onScoreUpdate) {
      onScoreUpdate(score * 10);
    }
  }, [score, onScoreUpdate]);
  
  // Handle pausing
  useEffect(() => {
    if (isPaused && gameState === 'playing') {
      if (synthRef.current) {
        synthRef.current.triggerRelease();
      }
    }
    setRaceActive(!isPaused);
  }, [isPaused, gameState]);
  
  // Initialize audio context and synth
  const initializeAudio = async () => {
    if (audioInitialized.current) return;
    
    try {
      await Tone.start();
      
      if (!synthRef.current) {
        synthRef.current = new Tone.PolySynth(Tone.Synth, {
          envelope: {
            attack: 0.02,
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
    }
  };
  
  // Cleanup function
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.dispose();
        synthRef.current = null;
      }
      audioInitialized.current = false;
    };
  }, []);
  
  // Set up available intervals based on level
  useEffect(() => {
    if (level === 1) {
      // Level 1: Basic intervals (Unison, P4, P5, P8)
      setAvailableIntervals(INTERVALS.filter(i => ['P1', 'P4', 'P5', 'P8'].includes(i.id)));
    } else if (level === 2) {
      // Level 2: Add major and minor 2nds and 3rds
      setAvailableIntervals(INTERVALS.filter(i => 
        ['P1', 'P4', 'P5', 'P8', 'm2', 'M2', 'm3', 'M3'].includes(i.id)
      ));
    } else {
      // Level 3: All intervals
      setAvailableIntervals(INTERVALS);
    }
  }, [level]);
  
  // Generate a random interval
  const generateRandomInterval = useCallback(() => {
    // Random starting note from 36 (C2) to 60 (C4)
    const startNote = 48 + Math.floor(Math.random() * 12); // C3 to B3
    
    // Pick a random interval from available intervals
    const interval = availableIntervals[Math.floor(Math.random() * availableIntervals.length)];
    
    // Calculate the second note
    const endNote = startNote + interval.semitones;
    
    // Create notes for keyboard display
    const startNoteName = Tone.Frequency(startNote, "midi").toNote().replace(/[0-9]/g, '');
    const endNoteName = Tone.Frequency(endNote, "midi").toNote().replace(/[0-9]/g, '');
    setIntervalNotes([startNoteName, endNoteName]);
    
    // Create the interval object
    const newInterval = {
      start: startNote,
      end: endNote,
      type: interval.id,
      name: interval.name,
      semitones: interval.semitones
    };
    
    setCurrentInterval(newInterval);
    return newInterval;
  }, [availableIntervals]);
  
  // Play an interval
  const playInterval = async (interval, harmonic = false) => {
    if (!interval) return;
    
    // Ensure audio is initialized
    if (!audioInitialized.current) {
      await initializeAudio();
    }
    
    // Make sure context is running
    if (Tone.context.state !== 'running') {
      await Tone.context.resume();
    }
    
    if (!synthRef.current) return;
    
    const startNoteFreq = Tone.Frequency(interval.start, "midi").toNote();
    const endNoteFreq = Tone.Frequency(interval.end, "midi").toNote();
    
    if (harmonic) {
      // Play both notes simultaneously
      synthRef.current.triggerAttackRelease([startNoteFreq, endNoteFreq], "2n");
    } else {
      // Play notes one after another (melodic)
      synthRef.current.triggerAttackRelease(startNoteFreq, "4n");
      
      // Play the second note after a short delay
      setTimeout(() => {
        synthRef.current.triggerAttackRelease(endNoteFreq, "4n");
      }, 600);
    }
  };
  
  // Start a new round
  const startNewRound = () => {
    setSelectedInterval(null);
    setFeedback(null);
    setShowKeyboard(false);
    
    // Generate a random interval and play it
    const interval = generateRandomInterval();
    playInterval(interval);
    
    setGameState('playing');
  };
  
  // Start the game
  const startGame = async () => {
    await initializeAudio();
    setScore(0);
    setRound(1);
    setLevel(1);
    startNewRound();
    setRaceActive(true);
  };
  
  // Handle interval selection
  const handleSelectInterval = (intervalId) => {
    if (isPaused) return;
    
    setSelectedInterval(intervalId);
    setShowKeyboard(true);
    
    // Check if correct
    const isCorrect = intervalId === currentInterval.type;
    
    // Update score and provide feedback
    if (isCorrect) {
      setScore(prevScore => prevScore + 1);
      setFeedback({
        message: `Correct! That's a ${currentInterval.name} (${currentInterval.semitones} semitones).`,
        success: true
      });
    } else {
      // Find the name of the selected interval
      const selectedIntervalName = INTERVALS.find(i => i.id === intervalId)?.name || '';
      
      setFeedback({
        message: `Not quite. You selected ${selectedIntervalName}, but it's a ${currentInterval.name}.`,
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
    const noteIndex = allNotes.find(n => n.note === note)?.index || 0;
    const prevWhiteKeyIndex = allNotes.filter(n => n.type === 'white' && n.index < noteIndex).length;
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
          <h1 className="text-3xl font-bold text-white mb-2">Interval Training</h1>
          
          {gameState === 'idle' && (
            <div>
              <p className="mb-6 text-gray-300">Listen to the interval and identify it. Train your ear to recognize musical distances!</p>
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
                    <p className="text-xl text-white mb-4">What interval do you hear?</p>
                    
                    <div className="flex justify-center gap-4 mb-8">
                      <button
                        onClick={() => playInterval(currentInterval, false)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                        disabled={isPaused}
                      >
                        Play Melodic
                      </button>
                      <button
                        onClick={() => playInterval(currentInterval, true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                        disabled={isPaused}
                      >
                        Play Harmonic
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {availableIntervals.map(interval => (
                        <button
                          key={interval.id}
                          onClick={() => handleSelectInterval(interval.id)}
                          className={`interval-option py-3 px-4 rounded-lg font-medium transition-all
                            ${selectedInterval === interval.id 
                              ? 'bg-indigo-600 text-white transform scale-105' 
                              : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}
                          `}
                          disabled={isPaused}
                        >
                          {interval.name}
                        </button>
                      ))}
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
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={() => playInterval(currentInterval, false)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                      >
                        Play Melodic
                      </button>
                      <button
                        onClick={() => playInterval(currentInterval, true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                      >
                        Play Harmonic
                      </button>
                    </div>
                  </div>
                  
                  {/* Keyboard visualization to show the interval notes */}
                  {showKeyboard && (
                    <div className="mb-8">
                      <p className="text-gray-300 mb-2">Interval notes:</p>
                      <div className="keyboard-wrapper relative h-40 w-full max-w-md mx-auto">
                        {/* White keys */}
                        <div className="white-keys flex h-full">
                          {allNotes.filter(n => n.type === 'white').map(note => (
                            <div
                              key={note.note}
                              className={`white-key w-12 h-full bg-white rounded-b-md border border-gray-300 ${
                                intervalNotes.includes(note.note) ? 'bg-indigo-200' : ''
                              }`}
                            >
                              <div className="h-full flex items-end justify-center pb-2 text-xs text-gray-500 font-semibold">
                                {note.note}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Black keys */}
                        <div className="black-keys absolute top-0 left-0 w-full">
                          {allNotes.filter(n => n.type === 'black').map(note => (
                            <div
                              key={note.note}
                              className={`black-key absolute top-0 w-8 h-24 bg-gray-800 rounded-b-md z-10 ${
                                intervalNotes.includes(note.note) ? 'bg-indigo-800' : ''
                              }`}
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
                    isActive={raceActive && gameState === 'playing'} 
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

export default IntervalTraining; 