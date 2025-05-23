import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './admin-login';
import Dashboard from './dashboard';
import BuildingNavigation from './building';
import DevicesPage from './devices';
import Analytics from './analytics';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Handle successful login
  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  // Protected route component
  const ProtectedRoute = ({ element: Element, ...rest }) => {
    return isAuthenticated ? (
      <Element {...rest} />
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
