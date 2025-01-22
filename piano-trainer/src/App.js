import React, { useState, useEffect, useCallback } from 'react';
import * as Tone from 'tone';

function App() {
  const [synth, setSynth] = useState(null);
  const [gameState, setGameState] = useState('idle');
  const [targetNote, setTargetNote] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [resetCountdown, setResetCountdown] = useState(5);

  const notes = [
    { note: 'C4', type: 'white' },
    { note: 'C#4', type: 'black' },
    { note: 'D4', type: 'white' },
    { note: 'D#4', type: 'black' },
    { note: 'E4', type: 'white' },
    { note: 'F4', type: 'white' },
    { note: 'F#4', type: 'black' },
    { note: 'G4', type: 'white' },
    { note: 'G#4', type: 'black' },
    { note: 'A4', type: 'white' },
    { note: 'A#4', type: 'black' },
    { note: 'B4', type: 'white' }
  ];

  useEffect(() => {
    const newSynth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 }
    }).toDestination();
    setSynth(newSynth);
    return () => newSynth.dispose();
  }, []);

  const playTargetNote = useCallback(() => {
    if (synth && targetNote) {
      synth.triggerAttackRelease(targetNote, "2n");
    }
  }, [synth, targetNote]);

  const startNewRound = useCallback(() => {
    const newNote = notes[Math.floor(Math.random() * notes.length)].note;
    setTargetNote(newNote);
    setCountdown(3);
    setResetCountdown(5);
    setFeedback(null);
    setGameState('countdown');
  }, []);

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
  }, [gameState, countdown, playTargetNote]);

  useEffect(() => {
    let timer;
    if (gameState === 'success' && resetCountdown > 0) {
      timer = setTimeout(() => {
        setResetCountdown(prev => prev - 1);
      }, 1000);
    } else if (gameState === 'success' && resetCountdown === 0) {
      if (score === 5) {
        setGameState('gameOver');
      } else {
        startNewRound();
      }
    }
    return () => clearTimeout(timer);
  }, [gameState, resetCountdown, score, startNewRound]);

  const startGame = () => {
    setScore(0);
    startNewRound();
  };

  const handleKeyClick = (noteObj) => {
    if (gameState !== 'playing') return;

    if (noteObj.note === targetNote) {
      setScore(prev => prev + 1);
      setFeedback({ note: noteObj.note, correct: true });
      setGameState('success');
    } else {
      setFeedback({ note: noteObj.note, correct: false });
      setTimeout(() => {
        setFeedback(null);
        setCountdown(3);
        setGameState('countdown');
      }, 1000);
    }
  };

  const getDisplayNote = (note) => {
    return note.note.replace('4', '');
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
              <p className="text-xl">Score: {score}/5</p>
              {gameState === 'countdown' && (
                <p className="text-2xl font-bold">Get ready... {countdown}</p>
              )}
              {gameState === 'success' && (
                <p className="text-2xl font-bold">Next note in... {resetCountdown}</p>
              )}
            </div>
          )}
        </div>

        {/* Piano Keys Container */}
        <div className="relative flex justify-center">
          {/* White Keys */}
          <div className="flex gap-1 relative">
            {notes.filter(note => note.type === 'white').map((noteObj) => (
              <div
                key={noteObj.note}
                onClick={() => handleKeyClick(noteObj)}
                className={`
                  w-16 h-48 
                  cursor-pointer 
                  flex items-end 
                  justify-center 
                  pb-4 
                  rounded-b
                  transition-colors
                  duration-150
                  ${feedback?.note === noteObj.note 
                    ? feedback.correct 
                      ? 'bg-green-200 border-green-500' 
                      : 'bg-red-200 border-red-500'
                    : 'bg-white border-gray-300 hover:bg-gray-100'
                  }
                  border-2
                  relative
                `}
              >
                {getDisplayNote(noteObj)}
              </div>
            ))}
          </div>

          {/* Black Keys */}
          <div className="absolute" style={{ left: '182px', top: '0' }}>
            {notes.filter(note => note.type === 'black').map((noteObj, index) => {
              let leftPosition;
              if (index < 2) { // C# and D#
                leftPosition = index * 68;
              } else { // F#, G#, A#
                leftPosition = (index + 1) * 68;
              }

              return (
                <div
                  key={noteObj.note}
                  onClick={() => handleKeyClick(noteObj)}
                  className={`
                    w-8 h-32
                    cursor-pointer 
                    flex items-end 
                    justify-center 
                    pb-4 
                    absolute
                    transition-colors
                    duration-150
                    ${feedback?.note === noteObj.note 
                      ? feedback.correct 
                        ? 'bg-green-700 border-green-900' 
                        : 'bg-red-700 border-red-900'
                      : 'bg-gray-800 hover:bg-gray-700'
                    }
                    rounded-b
                    border-2
                    border-gray-900
                    text-white
                  `}
                  style={{
                    left: `${leftPosition}px`
                  }}
                >
                  {getDisplayNote(noteObj)}
                </div>
              );
            })}
          </div>
        </div>

        {/* Game Over Screen */}
        {gameState === 'gameOver' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg text-center">
              <h2 className="text-3xl font-bold mb-4">Great Job! 🎉</h2>
              <p className="text-xl mb-4">You completed all 5 rounds!</p>
              <button
                onClick={startGame}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
              >
                Play Again
              </button>
            </div>
          </div>
        )}

        {/* Play Note Button */}
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
