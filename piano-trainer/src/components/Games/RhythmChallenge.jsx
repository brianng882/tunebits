import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import RaceVisualization from './RaceVisualization';

function RhythmChallenge({ onScoreUpdate, isPaused, isCompetition = false }) {
  const [gameState, setGameState] = useState('idle');
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [level, setLevel] = useState(1);
  const [raceActive, setRaceActive] = useState(false);
  const [countdown, setCountdown] = useState(3);
  
  // Simple rhythm game states
  const [currentBeat, setCurrentBeat] = useState(0);
  const [pattern, setPattern] = useState([]);
  const [userTaps, setUserTaps] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showPattern, setShowPattern] = useState(true);
  const [patternName, setPatternName] = useState('');
  const [beatsPerMinute] = useState(100); // Slower, more manageable tempo
  
  // Audio refs
  const metronomeRef = useRef(null);
  const drumRef = useRef(null);
  const audioInitialized = useRef(false);
  const gameTimer = useRef(null);
  const beatStartTime = useRef(0);
  
  // Update parent component with score
  useEffect(() => {
    if (onScoreUpdate) {
      onScoreUpdate(score * 10);
    }
  }, [score, onScoreUpdate]);
  
  // Handle pausing
  useEffect(() => {
    if (isPaused) {
      setIsPlaying(false);
      if (gameTimer.current) {
        clearInterval(gameTimer.current);
      }
    }
    setRaceActive(!isPaused && gameState === 'playing');
  }, [isPaused, gameState]);
  
  // Initialize audio
  const initializeAudio = useCallback(async () => {
    if (audioInitialized.current) return;
    
    try {
      await Tone.start();
      
      // Simple metronome click
      if (!metronomeRef.current) {
        metronomeRef.current = new Tone.Synth({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 }
        }).toDestination();
      }
      
      // Drum sound for pattern
      if (!drumRef.current) {
        drumRef.current = new Tone.Synth({
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 }
        }).toDestination();
      }
      
      audioInitialized.current = true;
      console.log("Audio initialized successfully");
    } catch (error) {
      console.error("Failed to initialize audio:", error);
    }
  }, []);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (gameTimer.current) {
        clearInterval(gameTimer.current);
      }
      if (metronomeRef.current) {
        metronomeRef.current.dispose();
        metronomeRef.current = null;
      }
      if (drumRef.current) {
        drumRef.current.dispose();
        drumRef.current = null;
      }
      audioInitialized.current = false;
    };
  }, []);
  
  // Generate simple rhythm patterns
  const generatePattern = useCallback(() => {
    let newPattern = [];
    
    if (level === 1) {
      // Level 1: Simple 4/4 patterns
      const patterns = [
        [true, false, true, false],   // On beats 1 and 3
        [true, true, false, false],   // On beats 1 and 2
        [true, false, false, true],   // On beats 1 and 4
        [false, true, false, true],   // On beats 2 and 4
      ];
      newPattern = patterns[Math.floor(Math.random() * patterns.length)];
      setPatternName("Basic Rhythm");
    } else if (level === 2) {
      // Level 2: More complex but still simple
      const patterns = [
        [true, true, true, false],    // Three beats
        [true, false, true, true],    // Skip beat 2
        [false, true, true, true],    // Skip beat 1
        [true, true, false, true],    // Skip beat 3
      ];
      newPattern = patterns[Math.floor(Math.random() * patterns.length)];
      setPatternName("Intermediate Rhythm");
    } else {
      // Level 3: All four beats or syncopated
      const patterns = [
        [true, true, true, true],     // All beats
        [true, false, false, false],  // Just beat 1
        [false, false, false, true],  // Just beat 4
        [true, false, true, false],   // Alternating
      ];
      newPattern = patterns[Math.floor(Math.random() * patterns.length)];
      setPatternName("Advanced Rhythm");
    }
    
    setPattern(newPattern);
    return newPattern;
  }, [level]);
  
  // Play the pattern demonstration
  const playPatternDemo = useCallback(async () => {
    if (!audioInitialized.current) {
      await initializeAudio();
    }
    
    if (!metronomeRef.current || !drumRef.current) return;
    
    const beatInterval = (60 / beatsPerMinute) * 1000; // milliseconds per beat
    
    // Play 2 cycles of the pattern
    for (let cycle = 0; cycle < 2; cycle++) {
      for (let i = 0; i < pattern.length; i++) {
        setTimeout(() => {
          if (Tone.context.state === 'running') {
            // Always play metronome click
            metronomeRef.current.triggerAttackRelease("C5", 0.05);
            
            // Play drum on pattern beats
            if (pattern[i]) {
              drumRef.current.triggerAttackRelease("C3", 0.1);
            }
          }
        }, (cycle * pattern.length + i) * beatInterval);
      }
    }
    
    // Start user input phase after demo
    setTimeout(() => {
      setShowPattern(false);
      startUserInput();
    }, 2 * pattern.length * beatInterval + 500);
    
  }, [pattern, beatsPerMinute, initializeAudio]);
  
  // Start user input phase
  const startUserInput = useCallback(() => {
    setUserTaps([]);
    setCurrentBeat(0);
    setIsPlaying(true);
    beatStartTime.current = Date.now();
    
    const beatInterval = (60 / beatsPerMinute) * 1000;
    let beatCount = 0;
    
    gameTimer.current = setInterval(() => {
      const currentBeatIndex = beatCount % pattern.length;
      setCurrentBeat(currentBeatIndex);
      
      // Play metronome click
      if (metronomeRef.current && Tone.context.state === 'running') {
        metronomeRef.current.triggerAttackRelease("C5", 0.05);
      }
      
      beatCount++;
      
      // Stop after 2 cycles (8 beats for 4-beat pattern)
      if (beatCount >= pattern.length * 2) {
        clearInterval(gameTimer.current);
        setIsPlaying(false);
        evaluatePerformance();
      }
    }, beatInterval);
    
  }, [pattern, beatsPerMinute]);
  
  // Handle user tap
  const handleTap = useCallback(() => {
    if (!isPlaying || isPaused) return;
    
    const tapTime = Date.now();
    const elapsedTime = tapTime - beatStartTime.current;
    const beatInterval = (60 / beatsPerMinute) * 1000;
    
    // Find which beat this tap is closest to
    const beatNumber = Math.round(elapsedTime / beatInterval);
    const beatIndex = beatNumber % pattern.length;
    const expectedTime = beatNumber * beatInterval;
    const timingError = Math.abs(elapsedTime - expectedTime);
    
    // Consider tap accurate if within 200ms of beat
    const isAccurate = timingError < 200;
    const shouldHaveTapped = pattern[beatIndex];
    
    setUserTaps(prev => [...prev, {
      beatIndex,
      beatNumber,
      timingError,
      isAccurate,
      shouldHaveTapped,
      isCorrect: isAccurate && shouldHaveTapped
    }]);
    
    // Play feedback sound
    if (drumRef.current && Tone.context.state === 'running') {
      drumRef.current.triggerAttackRelease("C3", 0.1);
    }
    
  }, [isPlaying, isPaused, pattern, beatsPerMinute]);
  
  // Evaluate performance
  const evaluatePerformance = useCallback(() => {
    const expectedTaps = pattern.filter(beat => beat).length * 2; // 2 cycles
    const correctTaps = userTaps.filter(tap => tap.isCorrect).length;
    const accuracy = expectedTaps > 0 ? (correctTaps / expectedTaps) * 100 : 0;
    
    let success = false;
    let message = "";
    
    if (accuracy >= 75) {
      success = true;
      message = "Excellent rhythm! 🎵";
      setScore(prev => prev + 1);
      
      // Level up every 3 successful rounds
      if ((score + 1) % 3 === 0 && level < 3) {
        setLevel(prev => prev + 1);
      }
    } else if (accuracy >= 50) {
      message = "Good effort! Keep practicing! 👍";
    } else {
      message = "Try to tap along with the beat! 🥁";
    }
    
    setFeedback({
      message,
      success,
      accuracy: Math.round(accuracy),
      correctTaps,
      expectedTaps,
      totalTaps: userTaps.length
    });
    
    setGameState('feedback');
  }, [pattern, userTaps, score, level]);
  
  // Start new round
  const startNewRound = useCallback(() => {
    setUserTaps([]);
    setFeedback(null);
    setCurrentBeat(0);
    setShowPattern(true);
    setIsPlaying(false);
    setCountdown(3);
    setGameState('countdown');
    
    generatePattern();
  }, [generatePattern]);
  
  // Countdown effect
  useEffect(() => {
    let timer;
    if (gameState === 'countdown' && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (gameState === 'countdown' && countdown === 0) {
      setGameState('playing');
      setTimeout(() => {
        playPatternDemo();
      }, 500);
    }
    return () => clearTimeout(timer);
  }, [gameState, countdown, playPatternDemo]);
  
  // Start game
  const startGame = async () => {
    try {
      await initializeAudio();
      setScore(0);
      setLevel(1);
      setRound(1);
      startNewRound();
      setRaceActive(true);
    } catch (error) {
      console.error("Error starting game:", error);
    }
  };
  
  // Continue to next round
  const handleContinue = () => {
    if (score >= 9) {
      setGameState('complete');
      setRaceActive(false);
    } else {
      setRound(prev => prev + 1);
      startNewRound();
    }
  };
  
  // Handle race completion
  const handleRaceComplete = () => {
    console.log("Race completed!");
  };
  
  return (
    <div className="w-full h-full">
      <div className="max-w-6xl mx-auto py-8">
        {/* Game Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4 text-white">Rhythm Challenge</h1>
          
          {gameState === 'idle' && (
            <div>
              <p className="mb-6 text-gray-300">
                Listen to the rhythm pattern, then tap along to match it! 
                Tap the big button in time with the beats you hear.
              </p>
              <button
                onClick={startGame}
                className="glow-button bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-800 transform transition-all hover:-translate-y-1"
              >
                Start Game
              </button>
            </div>
          )}

          {gameState !== 'idle' && (
            <div className="flex justify-center items-center gap-6 mb-4">
              <div className="bg-gray-800 rounded-lg px-4 py-2">
                <p className="text-sm text-gray-400">ROUND</p>
                <p className="text-xl font-bold text-white">{round}/10</p>
              </div>
              <div className="bg-gray-800 rounded-lg px-4 py-2">
                <p className="text-sm text-gray-400">LEVEL</p>
                <p className="text-xl font-bold text-white">{level}</p>
              </div>
              <div className="bg-gray-800 rounded-lg px-4 py-2">
                <p className="text-sm text-gray-400">SCORE</p>
                <p className="text-xl font-bold text-white">{score}</p>
              </div>
            </div>
          )}
          
          {gameState === 'countdown' && (
            <div className="countdown text-6xl font-bold text-white animate-pulse">{countdown}</div>
          )}
        </div>

        {/* Game Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-[600px]">
          {/* Main Game Area */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800 bg-opacity-80 backdrop-blur-md rounded-xl p-6 shadow-xl border border-gray-700 h-full">
              
              {gameState === 'playing' && (
                <div className="text-center">
                  <div className="mb-6">
                    <h3 className="text-xl text-white mb-2">{patternName}</h3>
                    <p className="text-gray-400">
                      {showPattern 
                        ? "Listen to the pattern..." 
                        : "Now tap along with the beat!"
                      }
                    </p>
                  </div>
                  
                  {/* Visual Beat Display */}
                  <div className="mb-8">
                    <div className="flex justify-center gap-4 mb-6">
                      {pattern.map((shouldTap, index) => (
                        <div 
                          key={index}
                          className={`
                            w-16 h-16 rounded-full border-4 flex items-center justify-center text-xl font-bold
                            transition-all duration-200
                            ${currentBeat === index && isPlaying 
                              ? 'scale-125 shadow-lg' 
                              : 'scale-100'
                            }
                            ${shouldTap 
                              ? 'bg-blue-500 border-blue-300 text-white' 
                              : 'bg-gray-600 border-gray-400 text-gray-300'
                            }
                            ${currentBeat === index && isPlaying && shouldTap
                              ? 'bg-yellow-400 border-yellow-200 text-black animate-pulse'
                              : ''
                            }
                          `}
                        >
                          {index + 1}
                        </div>
                      ))}
                    </div>
                    
                    <div className="text-sm text-gray-400 mb-4">
                      Blue circles = Tap on this beat | Gray circles = Don't tap
                    </div>
                  </div>
                  
                  {/* Tap Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={handleTap}
                      disabled={!isPlaying || isPaused || showPattern}
                      className={`
                        w-48 h-48 rounded-full text-white text-2xl font-bold
                        transition-all duration-150 shadow-2xl
                        ${!showPattern && isPlaying && !isPaused
                          ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:scale-95 cursor-pointer transform hover:scale-105' 
                          : 'bg-gray-600 cursor-not-allowed opacity-50'
                        }
                      `}
                    >
                      {showPattern ? "LISTEN" : "TAP"}
                    </button>
                  </div>
                  
                  {!showPattern && (
                    <div className="mt-4 text-sm text-gray-400">
                      Tap the button when you see a blue circle light up!
                    </div>
                  )}
                </div>
              )}
              
              {gameState === 'feedback' && (
                <div className="text-center p-6">
                  <div className={`text-6xl mb-6 ${feedback?.success ? 'text-green-500' : 'text-orange-500'}`}>
                    {feedback?.success ? '🎉' : '🎵'}
                  </div>
                  <h2 className="text-2xl font-bold mb-4 text-white">{feedback?.message}</h2>
                  
                  <div className="mb-6">
                    <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                      <div className="bg-blue-900 bg-opacity-50 rounded-lg p-3">
                        <p className="text-sm text-gray-300">Accuracy</p>
                        <p className="text-2xl font-bold text-blue-400">{feedback?.accuracy}%</p>
                      </div>
                      <div className="bg-green-900 bg-opacity-50 rounded-lg p-3">
                        <p className="text-sm text-gray-300">Correct Taps</p>
                        <p className="text-2xl font-bold text-green-400">
                          {feedback?.correctTaps}/{feedback?.expectedTaps}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => {
                        setShowPattern(true);
                        setTimeout(() => playPatternDemo(), 500);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Hear Pattern Again
                    </button>
                    
                    <button
                      onClick={handleContinue}
                      className="glow-button bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 rounded-lg transform transition-all hover:-translate-y-1"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}
              
              {gameState === 'complete' && (
                <div className="text-center p-6">
                  <div className="text-7xl mb-6">🏆</div>
                  <h2 className="text-3xl font-bold mb-4 text-white">Rhythm Master!</h2>
                  <p className="text-xl mb-8 text-gray-300">
                    You've completed all {score} rounds! Your rhythm skills are excellent!
                  </p>
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
          
          {/* Race Visualization */}
          <div className="lg:col-span-2">
            {gameState !== 'idle' && (
              <div className="bg-gray-800 bg-opacity-80 backdrop-blur-md rounded-xl p-4 shadow-xl border border-gray-700 h-full flex flex-col">
                <h3 className="text-lg font-bold mb-4 text-white text-center">Race to the Finish!</h3>
                <div className="flex-1 flex items-center justify-center min-h-[400px]">
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

export default RhythmChallenge; 