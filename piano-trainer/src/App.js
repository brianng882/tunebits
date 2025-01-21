import React, { useState, useEffect } from 'react';
import * as Tone from 'tone';

function App() {
  const [synth, setSynth] = useState(null);
  const [gameState, setGameState] = useState('idle'); // idle, countdown, playing, success, gameOver
  const [targetNote, setTargetNote] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null); // { note: string, correct: boolean }
  const [resetCountdown, setResetCountdown] = useState(5);

  const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];

  // Initialize synth
  useEffect(() => {
    const newSynth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 }
    }).toDestination();
    setSynth(newSynth);
    return () => newSynth.dispose();
  }, []);

  // Handle countdown timer
  useEffect(() => {
    let timer;
    if (gameState === 'countdown' && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (gameState === 'countdown' && countdown === 0) {
      playTargetNote();
      setGameState('playing');
    }
    return () => clearTimeout(timer);
  }, [gameState, countdown]);

  // Handle reset countdown after correct answer
  useEffect(() => {
    let timer;
    if (gameState === 'success' && resetCountdown > 0) {
      timer = setTimeout(() => {
        setResetCountdown(prev => prev - 1);
      }, 1000);
    } else if (gameState === 'success' && resetCountdown === 0) {
      if (score === 10) {
        setGameState('gameOver');
      } else {
        startNewRound();
      }
    }
    return () => clearTimeout(timer);
  }, [gameState, resetCountdown, score]);

  const startGame = () => {
    setScore(0);
    startNewRound();
  };

  const startNewRound = () => {
    const newNote = notes[Math.floor(Math.random() * notes.length)];
    setTargetNote(newNote);
    setCountdown(3);
    setResetCountdown(5);
    setFeedback(null);
    setGameState('countdown');
  };

  const playTargetNote = () => {
    if (synth && targetNote) {
      synth.triggerAttackRelease(targetNote, "2n");
    }
  };

  const handleKeyClick = (note) => {
    if (gameState !== 'playing') return;

    if (note === targetNote) {
      // Correct answer
      setScore(prev => prev + 1);
      setFeedback({ note, correct: true });
      setGameState('success');
    } else {
      // Wrong answer
      setFeedback({ note, correct: false });
      setTimeout(() => {
        setFeedback(null);
        setCountdown(3);
        setGameState('countdown');
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Game Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Find The Note</h1>
          
          {gameState === 'idle' && (
            <button
              onClick={startGame}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
            >
              Start Game
            </button>
          )}

          {gameState !== 'idle' && (
            <div className="space-y-2">
              <p className="text-xl">Score: {score}/10</p>
              {gameState === 'countdown' && (
                <p className="text-2xl font-bold">Get ready... {countdown}</p>
              )}
              {gameState === 'success' && (
                <p className="text-2xl font-bold">Next note in... {resetCountdown}</p>
              )}
            </div>
          )}
        </div>

        {/* Piano Keys */}
        <div className="flex justify-center gap-1">
          {notes.map((note) => (
            <div
              key={note}
              onClick={() => handleKeyClick(note)}
              className={`
                w-16 h-48 
                cursor-pointer 
                flex items-end 
                justify-center 
                pb-4 
                rounded-b
                transition-colors
                duration-150
                ${feedback?.note === note 
                  ? feedback.correct 
                    ? 'bg-green-200 border-green-500' 
                    : 'bg-red-200 border-red-500'
                  : 'bg-white border-gray-300 hover:bg-gray-100'
                }
                border-2
              `}
            >
              {note.charAt(0)}
            </div>
          ))}
        </div>

        {/* Game Over Screen */}
        {gameState === 'gameOver' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg text-center">
              <h2 className="text-3xl font-bold mb-4">Great Job! 🎉</h2>
              <p className="text-xl mb-4">You completed all 10 rounds!</p>
              <button
                onClick={startGame}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
              >
                Play Again
              </button>
            </div>
          </div>
        )}

        {/* Play Note Button (during game) */}
        {gameState === 'playing' && (
          <div className="text-center mt-6">
            <button
              onClick={playTargetNote}
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
            >
              Play Note Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
