import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navigation/Navbar';
import HomePage from './pages/HomePage';
import DiscoveryPage from './pages/DiscoveryPage';
import GamePage from './pages/GamePage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/discovery" element={<DiscoveryPage />} />
        <Route path="/game/:level/:gameId" element={<GamePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
