import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { FaHome, FaBuilding, FaDoorOpen, FaBolt, FaChartBar, FaDollarSign } from "react-icons/fa"
import "./building.css"

const Sidebar = ({ activeTab, setActiveTab }) => (
  <div className="sidebar">
    <div className="sidebar-header">
      <FaBolt className="sidebar-logo" />
      <h1 className="sidebar-title">EcoVolt</h1>
    </div>

    <nav className="sidebar-nav">
      <button
        className={`nav-button ${activeTab === "dashboard" ? "nav-button-active" : ""}`}
        onClick={() => setActiveTab("dashboard")}
      >
        <FaHome className="nav-icon" />
        Dashboard
      </button>
      <button
        className={`nav-button ${activeTab === "buildings" ? "nav-button-active" : ""}`}
        onClick={() => setActiveTab("buildings")}
      >
        <FaBuilding className="nav-icon" />
        Buildings
      </button>
      <button
        className={`nav-button ${activeTab === "rooms" ? "nav-button-active" : ""}`}
        onClick={() => setActiveTab("rooms")}
      >
        <FaDoorOpen className="nav-icon" />
        Rooms
      </button>
      <button
        className={`nav-button ${activeTab === "analytics" ? "nav-button-active" : ""}`}
        onClick={() => setActiveTab("analytics")}
      >
        <FaChartBar className="nav-icon" />
        Analytics
      </button>
    </nav>
  </div>
)

const Analytics = () => {
  const [activeTab, setActiveTab] = useState("analytics")
  const navigate = useNavigate()

  // Handle navigation
  const handleNavigation = (tab) => {
    setActiveTab(tab)
    switch (tab) {
      case "dashboard":
        navigate("/dashboard")
        break
      case "buildings":
        navigate("/building")
        break
      case "rooms":
        navigate("/building")
        break
      case "analytics":
        navigate("/analytics")
        break
      default:
        break
    }
  }

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={handleNavigation} />

      <div className="main-content">
        <div className="content-wrapper">
          <div className="page-header">
            <div className="header-content">
              <h1 className="page-title">
                <FaChartBar className="page-icon" />
                Analytics & Reports
              </h1>
              <p className="page-subtitle">Analyze energy consumption patterns and optimize efficiency</p>
            </div>
          </div>

          <div className="analytics-content">
            <div className="analytics-grid">
              <div className="analytics-card">
                <div className="card-header">
                  <h3 className="card-title">Energy Consumption Trends</h3>
                  <p className="card-subtitle">Weekly consumption patterns</p>
                </div>
                <div className="chart-placeholder">
                  <FaChartBar className="chart-icon" />
                  <p>Chart visualization would go here</p>
                </div>
              </div>

              <div className="analytics-card">
                <div className="card-header">
                  <h3 className="card-title">Cost Analysis</h3>
                  <p className="card-subtitle">Monthly cost breakdown</p>
                </div>
                <div className="chart-placeholder">
                  <FaDollarSign className="chart-icon" />
                  <p>Cost analysis chart would go here</p>
                </div>
              </div>

              <div className="analytics-card">
                <div className="card-header">
                  <h3 className="card-title">Building Comparison</h3>
                  <p className="card-subtitle">Energy usage across buildings</p>
                </div>
                <div className="chart-placeholder">
                  <FaBuilding className="chart-icon" />
                  <p>Building comparison chart would go here</p>
                </div>
              </div>

              <div className="analytics-card">
                <div className="card-header">
                  <h3 className="card-title">Peak Usage Hours</h3>
                  <p className="card-subtitle">Daily consumption patterns</p>
                </div>
                <div className="chart-placeholder">
                  <FaBolt className="chart-icon" />
                  <p>Peak usage chart would go here</p>
                </div>
              </div>
            </div>

            <div className="recommendations-card">
              <div className="card-header">
                <h3 className="card-title">Efficiency Recommendations</h3>
                <p className="card-subtitle">AI-powered suggestions to optimize energy usage</p>
              </div>
              <div className="recommendations-list">
                <div className="recommendation high">
                  <div className="recommendation-priority">High Impact</div>
                  <div className="recommendation-text">Reduce HVAC usage during off-hours to save up to $340/month</div>
                </div>
                <div className="recommendation medium">
                  <div className="recommendation-priority">Medium Impact</div>
                  <div className="recommendation-text">Upgrade to LED lighting in Warehouse A to save $120/month</div>
                </div>
                <div className="recommendation low">
                  <div className="recommendation-priority">Low Impact</div>
                  <div className="recommendation-text">Install smart power strips to eliminate phantom loads</div>
                </div>
                <div className="recommendation medium">
                  <div className="recommendation-priority">Medium Impact</div>
                  <div className="recommendation-text">Optimize device schedules based on occupancy patterns</div>
                </div>
                <div className="recommendation high">
                  <div className="recommendation-priority">High Impact</div>
                  <div className="recommendation-text">
                    Implement automated lighting controls in conference rooms to save $200/month
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
