import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import BuildingEN from './building-en';
import Room from './room';
import AdminLogin from './admin-login'; // Import the Admin Login page
import BuildingNavigation from './BuildingNavigation';

function App() {
  // Initialize isAuthenticated from localStorage, default to false
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const savedAuth = localStorage.getItem('isAuthenticated');
    return savedAuth === 'true';
  });

  // Update localStorage when authentication state changes
  useEffect(() => {
    localStorage.setItem('isAuthenticated', isAuthenticated);
  }, [isAuthenticated]);

  // Simulate authentication based on login status
  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
  };

  // Add logout handler
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
  };

  return (
    <Router>
      <Routes>
        {/* Route for Admin Login */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? 
            <Navigate to="/building" /> : 
            <AdminLogin onLogin={handleLogin} />
          } 
        />

        {/* Protected Routes (Only accessible after login) */}
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/building" 
          element={
            isAuthenticated ? (
              <BuildingNavigation onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/room" 
          element={isAuthenticated ? <Room onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
        
        {/* Default Route (Redirects to login if the user is not authenticated) */}
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
