import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './admin-login';
import Dashboard from './dashboard';
import BuildingNavigation from './building';
import DevicesPage from './devices';
import Analytics from './analytics';

function App() {
  // Initialize isAuthenticated from localStorage
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const savedAuth = localStorage.getItem('isAuthenticated');
    return savedAuth === 'true';
  });

  // Update localStorage when authentication state changes
  useEffect(() => {
    localStorage.setItem('isAuthenticated', isAuthenticated);
  }, [isAuthenticated]);

  // Handle successful login
  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
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
          element={<ProtectedRoute element={BuildingNavigation} />}
        />
        <Route
          path="/devices/:roomId"
          element={<ProtectedRoute element={DevicesPage} />}
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
        <Route
          path="/dashboard"
          element={<ProtectedRoute element={Dashboard} />}
        />
        <Route
          path="/analytics"
          element={<ProtectedRoute element={Analytics} />}
        />
        <Route path="/" element={<Navigate to="/admin-login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
