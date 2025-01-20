import React, { useState, useEffect } from 'react';
import * as Tone from 'tone';

function App() {
  const [synth, setSynth] = useState(null);
  const [gameActive, setGameActive] = useState(false);
  const [targetNote, setTargetNote] = useState(null);
  const [score, setScore] = useState(0);

  // define piano keys (just natural keys for now)
  const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];

  // initialize Tone.js synth
  useEffect(() => {
    const newSynth = new Tone.Synth().toDestination();
    setSynth(newSynth);
    
    // cleanup
    return () => {
      if (newSynth) {
        newSynth.dispose();
      }
    };
  }, []);

  // play a note when a key is clicked
  const playNote = (note) => {
    if (synth) {
      synth.triggerAttackRelease(note, "8n");
      
      if (gameActive && targetNote) {
        checkAnswer(note);
      }
    }
  };

  // start the game
  const startGame = () => {
    setGameActive(true);
    pickNewNote();
    setScore(0);
  };

  // pick a new random note
  const pickNewNote = () => {
    const randomNote = notes[Math.floor(Math.random() * notes.length)];
    setTargetNote(randomNote);
  };

  // check if the played note matches the target
  const checkAnswer = (playedNote) => {
    if (playedNote === targetNote) {
      setScore(prevScore => prevScore + 1);
      pickNewNote();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Piano Key Trainer</h1>
        
        {/* Game controls */}
        <div className="text-center mb-8">
          <button
            onClick={gameActive ? () => setGameActive(false) : startGame}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            {gameActive ? 'Stop Game' : 'Start Game'}
          </button>
          
          {gameActive && (
            <div className="mt-4">
              <p className="text-xl">Find this note: {targetNote}</p>
              <p className="text-lg mt-2">Score: {score}</p>
            </div>
          )}
        </div>

        {/* Piano keys */}
        <div className="flex justify-center gap-1">
          {notes.map((note) => (
            <div
              key={note}
              onClick={() => playNote(note)}
              className={`
                w-16 h-48 
                bg-white 
                border border-gray-300 
                cursor-pointer 
                hover:bg-gray-100 
                flex items-end 
                justify-center 
                pb-4 
                rounded-b
                ${gameActive && note === targetNote ? 'border-blue-500 border-2' : ''}
              `}
            >
              {note.charAt(0)}
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="text-center mt-8 text-gray-600">
          {gameActive 
            ? 'Click the highlighted note!' 
            : 'Click any key to play a note, or start the game to practice!'}
        </div>
      </div>
    </div>
  );
}

export default App;
