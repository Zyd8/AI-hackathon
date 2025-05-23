import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import BuildingNavigation from './building';
import DevicesPage from './devices';
import AdminLogin from './admin-login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Initialize from localStorage
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  // Update localStorage when authentication state changes
  useEffect(() => {
    localStorage.setItem('isAuthenticated', isAuthenticated);
  }, [isAuthenticated]);

  // Handle successful login
  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
  };

  // Protected route component
  const ProtectedRoute = ({ element: Element, ...rest }) => {
    return isAuthenticated ? (
      <Element onLogout={handleLogout} {...rest} />
    ) : (
      <Navigate to="/admin-login" replace />
    );
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/building" 
          element={
            <ProtectedRoute 
              element={BuildingNavigation} 
            />
          } 
        />
        <Route 
          path="/devices/:roomId" 
          element={
            <ProtectedRoute 
              element={DevicesPage} 
            />
          } 
        />
        <Route 
          path="/admin-login" 
          element={
            isAuthenticated ? (
              <Navigate to="/building" replace />
            ) : (
              <AdminLogin onLogin={handleLogin} />
            )
          } 
        />
        <Route path="/" element={<Navigate to="/admin-login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
