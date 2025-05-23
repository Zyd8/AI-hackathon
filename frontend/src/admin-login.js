import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./admin-login.css"
import axios from "axios"
import { FaBolt, FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa"

const AdminLogin = ({ onLogin }) => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await axios.post("http://localhost:5000/api/login", {
        username,
        password,
      })

      if (response.data.success) {
        onLogin()
        navigate("/building")
      } else {
        setError("Invalid username or password")
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError("Invalid username or password")
      } else {
        setError("Something went wrong. Please try again later.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <FaBolt className="logo-icon" />
              <h1 className="logo-title">EcoVolt</h1>
            </div>
            <h2 className="login-title">Admin Login</h2>
            <p className="login-subtitle">Access your energy management dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label className="form-label">Username</label>
              <div className="input-wrapper">
                <FaUser className="input-icon" />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <FaLock className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {error && (
              <div className="error-message">
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className={`login-btn ${loading ? "loading" : ""}`} disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>Secure energy management system</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
