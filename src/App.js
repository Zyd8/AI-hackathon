import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import BuildingEN from './building-en';
import Room from './room';
import AdminLogin from './admin-login'; // Import the Admin Login page

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Simulate authentication based on login status
  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  return (
    <Router>
      <Routes>
        {/* Route for Admin Login */}
        <Route 
          path="/login" 
          element={<AdminLogin onLogin={handleLogin} />} 
        />

        {/* Protected Routes (Only accessible after login) */}
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/building-en" 
          element={isAuthenticated ? <BuildingEN /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/room" 
          element={isAuthenticated ? <Room /> : <Navigate to="/login" />} 
        />
        
        {/* Default Route (Redirects to login if the user is not authenticated) */}
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
