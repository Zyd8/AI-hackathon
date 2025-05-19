import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import BuildingNavigation from './building';
import DevicesPage from './devices';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/building" element={<BuildingNavigation/>} />
        <Route path="/devices/:roomId" element={<DevicesPage />} />
        <Route path="/" element={<Navigate to="/building" />} />
      </Routes>
    </Router>
  );
}

export default App;
