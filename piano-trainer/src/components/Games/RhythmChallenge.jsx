import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import ClimbingGame from './ClimbingGame';

function RhythmChallenge({ onScoreUpdate, isPaused, isCompetition = false }) {
  const [gameState, setGameState] = useState('idle');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [countdown, setCountdown] = useState(3);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [rhythmPattern, setRhythmPattern] = useState([]);
  const [userTaps, setUserTaps] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [beatMarkers, setBeatMarkers] = useState([]);
  const [liveBeatPosition, setLiveBeatPosition] = useState(-1);
  const [showDemo, setShowDemo] = useState(true);
  const [perfectBeats, setPerfectBeats] = useState(0);
  const [patternName, setPatternName] = useState('');
  const [climbingGameActive, setClimbingGameActive] = useState(false);
  
  // Use refs for audio objects to avoid recreation
  const metronomeRef = useRef(null);
  const drumSoundRef = useRef(null);
  const lastTapTime = useRef(0);
  const beatInterval = useRef(500); // milliseconds (120 BPM)
  const patternStartTime = useRef(0);
  const audioInitialized = useRef(false);
  const liveBeatTimer = useRef(null);
  
  // Update parent component with score
  useEffect(() => {
    if (onScoreUpdate) {
      onScoreUpdate(score * 10); // Convert to a larger score for display
    }
  }, [score, onScoreUpdate]);
  
  // Handle pausing
  useEffect(() => {
    if (isPaused && gameState === 'playing') {
      if (Tone.Transport.state === 'started') {
        Tone.Transport.pause();
      }
      clearInterval(liveBeatTimer.current);
    } else if (!isPaused && gameState === 'playing') {
      if (Tone.Transport.state === 'paused') {
        Tone.Transport.start();
      }
    }
    
    // Pause the climbing game when the main game is paused
    setClimbingGameActive(!isPaused);
  }, [isPaused, gameState]);
  
  // Initialize Tone.js instruments
  const initializeAudio = useCallback(async () => {
    if (audioInitialized.current) return;
    
    try {
      // Request audio context start
      await Tone.start();
      
      // Create a metronome sound if it doesn't exist
      if (!metronomeRef.current) {
        metronomeRef.current = new Tone.Synth({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 }
        }).toDestination();
      }
      
      // Create a drum sound for the rhythm pattern if it doesn't exist
      if (!drumSoundRef.current) {
        drumSoundRef.current = new Tone.MembraneSynth({
          pitchDecay: 0.05,
          octaves: 4,
          oscillator: { type: 'sine' },
          envelope: {
            attack: 0.001,
            decay: 0.4,
            sustain: 0.01,
            release: 1.4,
            attackCurve: 'exponential'
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
      setGameState('feedback');
    }
  }, []);
  
  // Cleanup audio resources when component unmounts
  useEffect(() => {
    return () => {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      
      if (metronomeRef.current) {
        metronomeRef.current.dispose();
        metronomeRef.current = null;
      }
      
      if (drumSoundRef.current) {
        drumSoundRef.current.dispose();
        drumSoundRef.current = null;
      }
      
      clearInterval(liveBeatTimer.current);
      audioInitialized.current = false;
    };
  }, []);
  
  // Generate rhythm patterns based on level
  const generateRhythmPattern = useCallback(() => {
    let pattern = [];
    const beats = 8; // 2 bars of 4/4
    
    // Different complexity based on level
    if (level === 1) {
      // Simple quarter note patterns
      setPatternName("Basic Quarter Notes");
      for (let i = 0; i < beats; i++) {
        // Simple pattern: play on beats 0, 2, 4, 6
        pattern.push(i % 2 === 0);
      }
    } else if (level === 2) {
      // Eighth note patterns with more predictable structure
      setPatternName("Eighth Note Pattern");
      for (let i = 0; i < beats * 2; i++) {
        // Pattern that repeats: 1, 0, 0, 1, 0, 1, 0, 0
        pattern.push(i % 8 === 0 || i % 8 === 3 || i % 8 === 5);
      }
    } else {
      // Syncopated patterns that are challenging but learnable
      setPatternName("Syncopated Rhythm");
      for (let i = 0; i < beats * 2; i++) {
        // Syncopated pattern: 1, 0, 0, 1, 0, 1, 1, 0
        pattern.push(i % 8 === 0 || i % 8 === 3 || i % 8 === 5 || i % 8 === 6);
      }
    }
    
    setRhythmPattern(pattern);
    return pattern;
  }, [level]);
  
  // Evaluate user's rhythm performance
  const evaluatePerformance = useCallback(() => {
    if (rhythmPattern.length === 0) return;
    
    // Count expected beats (where rhythm has a note)
    const expectedTaps = rhythmPattern.filter(beat => beat).length;
    
    // No taps when there should be
    if (userTaps.length === 0 && expectedTaps > 0) {
      setFeedback({
        message: "You didn't tap any beats!",
        success: false
      });
      setGameState('feedback');
      return;
    }
    
    // Count accurate taps on expected beats
    const correctTaps = userTaps.filter(tap => 
      tap.accurate && rhythmPattern[tap.beatPosition]
    ).length;
    
    // Count mistimed taps and taps when there shouldn't be one
    const mistimed = userTaps.filter(tap => 
      !tap.accurate && rhythmPattern[tap.beatPosition]
    ).length;
    
    const extraTaps = userTaps.filter(tap => 
      !rhythmPattern[tap.beatPosition]
    ).length;
    
    // Calculate accuracy
    const accuracy = expectedTaps > 0 ? (correctTaps / expectedTaps) * 100 : 0;
    const tooManyTaps = userTaps.length > expectedTaps * 1.5;
    
    // Determine feedback
    let feedbackMessage = "";
    let success = false;
    
    if (accuracy >= 80 && extraTaps <= Math.floor(expectedTaps * 0.25)) {
      feedbackMessage = "Great rhythm! 🎵";
      success = true;
    } else if (accuracy >= 50) {
      feedbackMessage = "Good effort, keep practicing! 👍";
      success = false;
    } else if (tooManyTaps) {
      feedbackMessage = "Too many taps! Listen carefully to the pattern.";
      success = false;
    } else {
      feedbackMessage = "Try to match the rhythm more closely.";
      success = false;
    }
    
    setFeedback({
      message: feedbackMessage,
      accuracy: Math.round(accuracy),
      correctTaps,
      mistimed,
      extraTaps,
      expectedTaps,
      success
    });
    
    // Update score if successful
    if (success) {
      setScore(prev => prev + 1);
      
      // Level up after 3 successful rounds
      if ((score + 1) % 3 === 0 && level < 3) {
        setLevel(prev => prev + 1);
      }
    }
    
    setGameState('feedback');
  }, [rhythmPattern, level, score]);
  
  // Play the generated rhythm pattern
  const playRhythmPattern = useCallback(async () => {
    // Ensure audio is initialized
    if (!audioInitialized.current) {
      await initializeAudio();
    }
    
    if (!metronomeRef.current || !drumSoundRef.current || rhythmPattern.length === 0) {
      console.error("Can't play rhythm: audio not initialized or pattern empty");
      return;
    }
    
    try {
      // Clear previous scheduling and beat markers
      Tone.Transport.cancel();
      setBeatMarkers([]);
      setLiveBeatPosition(-1);
      
      // Calculate timing
      const beatTime = beatInterval.current / 1000; // convert to seconds for Tone.js
      
      // Ensure audio context is running
      if (Tone.context.state !== 'running') {
        await Tone.context.resume();
      }
      
      // Schedule beats using Tone.Transport for accurate timing
      const pattern = [];
      
      // Record when pattern actually starts
      patternStartTime.current = Date.now();
      
      // Schedule each beat
      rhythmPattern.forEach((shouldPlay, i) => {
        const time = `+${i * beatTime}`;
        
        // Schedule metronome click
        Tone.Transport.schedule((time) => {
          metronomeRef.current.triggerAttackRelease("C5", 0.05);
          
          // Update UI with beat marker
          setBeatMarkers(prev => [...prev, i]);
        }, time);
        
        // Schedule drum sound for rhythm pattern
        if (shouldPlay) {
          Tone.Transport.schedule((time) => {
            drumSoundRef.current.triggerAttackRelease("C2", 0.1);
          }, time);
        }
      });
      
      // Live beat indicator that moves with the rhythm
      clearInterval(liveBeatTimer.current);
      setLiveBeatPosition(-1);
      
      liveBeatTimer.current = setInterval(() => {
        const elapsedTime = Date.now() - patternStartTime.current;
        const currentBeatIndex = Math.floor(elapsedTime / beatInterval.current);
        
        if (currentBeatIndex >= 0 && currentBeatIndex < rhythmPattern.length) {
          setLiveBeatPosition(currentBeatIndex);
        } else {
          setLiveBeatPosition(-1);
        }
      }, 50); // Update frequently for smooth movement
      
      // Schedule the end of listening
      const patternDuration = rhythmPattern.length * beatTime;
      Tone.Transport.schedule((time) => {
        setIsListening(false);
        clearInterval(liveBeatTimer.current);
        setLiveBeatPosition(-1);
        evaluatePerformance();
      }, `+${patternDuration + 0.5}`); // add a little buffer time
      
      // Start the Transport
      Tone.Transport.start();
      
    } catch (error) {
      console.error("Error playing rhythm pattern:", error);
      setFeedback({
        message: "There was a problem playing the audio. Please try again.",
        success: false
      });
      setGameState('feedback');
    }
    
  }, [rhythmPattern, initializeAudio, evaluatePerformance]);
  
  // Play a demo of the rhythm pattern
  const playDemoPattern = useCallback(async () => {
    setShowDemo(false);
    await playRhythmPattern();
    
    // After demo completes, set up for actual playing
    const patternDuration = rhythmPattern.length * (beatInterval.current / 1000);
    setTimeout(() => {
      if (gameState === 'playing') {
        setUserTaps([]);
        setBeatMarkers([]);
        setCurrentBeat(0);
        setIsListening(true);
        playRhythmPattern();
      }
    }, (patternDuration + 1) * 1000);
  }, [playRhythmPattern, rhythmPattern, gameState]);
  
  // Start a new round
  const startNewRound = useCallback(() => {
    setUserTaps([]);
    setFeedback(null);
    setCountdown(3);
    setGameState('countdown');
    setCurrentBeat(0);
    setBeatMarkers([]);
    setPerfectBeats(0);
    setShowDemo(true);
    
    // Generate new rhythm pattern
    generateRhythmPattern();
  }, [generateRhythmPattern]);
  
  // Countdown timer
  useEffect(() => {
    let timer;
    if (gameState === 'countdown' && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (gameState === 'countdown' && countdown === 0) {
      // Play the pattern once countdown is complete
      setGameState('playing');
      if (showDemo) {
        setTimeout(() => {
          playDemoPattern();
        }, 500);
      } else {
        setIsListening(true);
        playRhythmPattern();
      }
    }
    return () => clearTimeout(timer);
  }, [gameState, countdown, playRhythmPattern, showDemo, playDemoPattern]);
  
  // Start the game
  const startGame = async () => {
    try {
      // Initialize audio with user gesture
      await initializeAudio();
      setScore(0);
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
  
  // Handle user taps
  const handleTap = () => {
    if (!isListening || isPaused) return;
    
    const tapTime = Date.now();
    const elapsedTime = tapTime - patternStartTime.current;
    
    // Calculate which beat this tap corresponds to
    const beatPosition = Math.floor(elapsedTime / beatInterval.current);
    
    if (beatPosition >= 0 && beatPosition < rhythmPattern.length) {
      // Determine accuracy (within 150ms is considered good)
      const exactBeatTime = beatPosition * beatInterval.current;
      const timeDifference = Math.abs(elapsedTime - exactBeatTime);
      const isAccurate = timeDifference < 150;
      
      // Store the tap time and accuracy
      setUserTaps(prev => [
        ...prev, 
        { 
          time: elapsedTime, 
          beatPosition, 
          accurate: isAccurate,
          expectedBeat: rhythmPattern[beatPosition]
        }
      ]);
      
      // Count perfect beats for score
      if (isAccurate && rhythmPattern[beatPosition]) {
        setPerfectBeats(prev => prev + 1);
      }
    }
    
    // Visual feedback
    setCurrentBeat(prev => prev + 1);
    
    // Play a sound to acknowledge the tap
    if (drumSoundRef.current && audioInitialized.current) {
      if (Tone.context.state === 'running') {
        drumSoundRef.current.triggerAttackRelease("C3", 0.1);
      } else {
        Tone.context.resume().then(() => {
          drumSoundRef.current.triggerAttackRelease("C3", 0.1);
        });
      }
    }
    
    // Save last tap time to prevent double taps
    lastTapTime.current = tapTime;
  };
  
  // Handle continuing to next round
  const handleContinue = () => {
    if (score >= 9) {
      setGameState('complete');
    } else {
      startNewRound();
    }
  };
  
  // Helper function to get tap status class
  const getTapStatusClass = (index) => {
    const tapForThisBeat = userTaps.find(tap => tap.beatPosition === index);
    
    if (!tapForThisBeat) {
      return rhythmPattern[index] ? 'missed' : ''; // No tap but should have one
    }
    
    if (rhythmPattern[index]) {
      return tapForThisBeat.accurate ? 'accurate' : 'mistimed';
    } else {
      return 'extra'; // Tapped when shouldn't have
    }
  };
  
  // Handle climbing game completion
  const handleClimbingComplete = () => {
    console.log("Climbing game completed!");
    // Add any special rewards or animations here
  };
  
  return (
    <div className="w-full h-full">
      <div className="max-w-5xl mx-auto py-8">
        {/* Game Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4 text-white">Rhythm Challenge</h1>
          
          {gameState === 'idle' && (
            <div>
              <p className="mb-6 text-gray-300">Tap along with the rhythm patterns you hear. Match the beats to score points!</p>
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
                  <p className="text-sm text-gray-400">SCORE</p>
                  <p className="text-xl font-bold text-white">{score}/9</p>
                </div>
                {isCompetition && (
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-lg px-4 py-2 shadow-glow-purple">
                    <p className="text-sm text-gray-200">PERFECT BEATS</p>
                    <p className="text-xl font-bold text-white">{perfectBeats}</p>
                  </div>
                )}
              </div>
              
              {gameState === 'countdown' && (
                <div className="countdown text-6xl font-bold text-white">{countdown}</div>
              )}
            </div>
          )}
        </div>

        {/* Game Layout - split into two columns for game area and climbing visualization */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Main Game Area - Takes 3/5 of the width on larger screens */}
          <div className="md:col-span-3">
            <div className="bg-gray-800 bg-opacity-80 backdrop-blur-md rounded-xl p-6 shadow-xl border border-gray-700 h-full">
              {gameState === 'playing' && (
                <div className="text-center">
                  <div className="mb-4">
                    <p className="text-xl mb-2 text-white">
                      {showDemo 
                        ? "Watch and listen to the pattern..." 
                        : isListening 
                          ? "Tap to match the rhythm!" 
                          : "Listen carefully..."
                      }
                    </p>
                    <p className="text-gray-400 text-sm">{patternName}</p>
                  </div>
                  
                  {/* Visual beat indicators with improved visualization */}
                  <div className="relative border-t border-b border-gray-600 py-4 mb-8">
                    <div className="flex justify-center gap-2 py-2">
                      {rhythmPattern.map((beat, index) => (
                        <div 
                          key={index}
                          className={`
                            w-10 h-16 rounded-md relative transition-all duration-100
                            beat-marker
                            ${beatMarkers.includes(index) ? 'scale-110' : ''}
                            ${liveBeatPosition === index ? 'shadow-glow' : ''}
                            ${beat 
                              ? 'bg-gradient-to-b from-blue-500 to-indigo-600' 
                              : 'bg-gray-700'
                            }
                            ${gameState === 'feedback' ? getTapStatusClass(index) : ''}
                          `}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            {beatMarkers.includes(index) && beat && (
                              <div className="w-6 h-6 bg-white rounded-full animate-ping opacity-70" 
                                  style={{animationDuration: '0.5s'}}></div>
                            )}
                          </div>
                          {liveBeatPosition === index && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-400"></div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Live beat indicator line */}
                    <div 
                      className="absolute top-0 bottom-0 w-px bg-yellow-400 transition-all duration-50"
                      style={{ 
                        left: liveBeatPosition >= 0 
                          ? `calc(50% - ${(rhythmPattern.length / 2) * 48}px + ${liveBeatPosition * 48}px + 20px)` 
                          : '-100px',
                        display: liveBeatPosition >= 0 ? 'block' : 'none'
                      }}
                    ></div>
                  </div>
                  
                  {/* Game instructions */}
                  {showDemo && (
                    <div className="mb-6 text-yellow-300 font-medium">
                      <span className="animate-pulse">First watch the demo, then try it yourself!</span>
                    </div>
                  )}
                  
                  {/* Tap button */}
                  <button
                    onClick={handleTap}
                    disabled={!isListening || isPaused}
                    className={`
                      w-48 h-48 
                      rounded-full 
                      flex items-center justify-center
                      text-white text-3xl font-bold
                      transition-all
                      shadow-lg
                      ${isListening && !isPaused
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 active:scale-95 cursor-pointer' 
                        : 'bg-gray-700 cursor-not-allowed opacity-50'
                      }
                    `}
                  >
                    TAP
                  </button>
                </div>
              )}
              
              {gameState === 'feedback' && (
                <div className="text-center p-6">
                  <div className={`text-6xl mb-6 ${feedback?.success ? 'text-green-500' : 'text-orange-500'}`}>
                    {feedback?.success ? '👏' : '👍'}
                  </div>
                  <h2 className="text-2xl font-bold mb-4 text-white">{feedback?.message}</h2>
                  
                  {feedback?.accuracy !== undefined && (
                    <div className="mb-6">
                      <p className="text-gray-400 mb-2">Accuracy</p>
                      <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            feedback.accuracy >= 80 ? 'bg-green-500' :
                            feedback.accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${feedback.accuracy}%` }}
                        ></div>
                      </div>
                      <p className="text-xl mt-2 font-bold text-white">{feedback.accuracy}%</p>
                      
                      <div className="grid grid-cols-3 gap-4 mt-6 max-w-md mx-auto text-center">
                        <div className="p-3 bg-green-900 bg-opacity-50 rounded-lg">
                          <p className="text-sm text-gray-300">Correct</p>
                          <p className="text-2xl font-bold text-green-400">{feedback.correctTaps}</p>
                        </div>
                        <div className="p-3 bg-yellow-900 bg-opacity-50 rounded-lg">
                          <p className="text-sm text-gray-300">Mistimed</p>
                          <p className="text-2xl font-bold text-yellow-400">{feedback.mistimed}</p>
                        </div>
                        <div className="p-3 bg-red-900 bg-opacity-50 rounded-lg">
                          <p className="text-sm text-gray-300">Extra taps</p>
                          <p className="text-2xl font-bold text-red-400">{feedback.extraTaps}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap justify-center gap-4">
                    <button
                      onClick={() => playRhythmPattern()}
                      className="mb-6 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors text-sm"
                    >
                      Listen Again
                    </button>
                    
                    <button
                      onClick={handleContinue}
                      className="glow-button bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 rounded-lg transform transition-all hover:-translate-y-1 mb-6"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}
              
              {gameState === 'complete' && (
                <div className="text-center p-6">
                  <div className="text-7xl mb-6">🎉</div>
                  <h2 className="text-3xl font-bold mb-4 text-white">You've Mastered Rhythm!</h2>
                  <p className="text-xl mb-8 text-gray-300">Congratulations on completing all levels!</p>
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
          
          {/* Climbing Game Visualization - Takes 2/5 of the width on larger screens */}
          <div className="md:col-span-2">
            {gameState !== 'idle' && (
              <div className="h-full flex flex-col">
                <h3 className="text-lg font-bold mb-2 text-white text-center">Climb to Victory!</h3>
                <div className="flex-1 flex items-center justify-center">
                  <ClimbingGame 
                    score={score} 
                    maxScore={9} 
                    isActive={climbingGameActive && gameState !== 'countdown'} 
                    onComplete={handleClimbingComplete}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Add styles */}
      <style jsx>{`
        .beat-marker.accurate {
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.7);
          border: 2px solid #10b981;
        }
        .beat-marker.mistimed {
          box-shadow: 0 0 10px rgba(245, 158, 11, 0.7);
          border: 2px solid #f59e0b;
        }
        .beat-marker.extra {
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.7);
          border: 2px solid #ef4444;
        }
        .beat-marker.missed {
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.7);
          border: 2px solid #ef4444;
        }
      `}</style>
    </div>
  );
}

export default RhythmChallenge; 