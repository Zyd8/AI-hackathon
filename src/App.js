import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import BuildingEN from './building-en';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/building-en" element={<BuildingEN />} />
      </Routes>
    </Router>
  );
}

export default App;
