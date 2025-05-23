import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  FaHome,
  FaBuilding,
  FaDoorOpen,
  FaBolt,
  FaWifi,
  FaChartBar,
  FaDollarSign,
  FaLeaf,
  FaArrowDown,
  FaArrowUp,
} from "react-icons/fa"
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

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard")
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

  // Mock energy data for dashboard
  const energyData = {
    totalConsumption: 3230,
    monthlySavings: 1240,
    efficiency: 87,
    carbonReduction: 2.4,
  }

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={handleNavigation} />

      <div className="main-content">
        <div className="content-wrapper">
          <div className="page-header">
            <div className="header-content">
              <h1 className="page-title">
                <FaHome className="page-icon" />
                Energy Management Dashboard
              </h1>
              <p className="page-subtitle">Monitor and optimize your building's energy consumption</p>
            </div>
          </div>

          <div className="dashboard-content">
            {/* Energy Overview Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-title">Total Consumption</div>
                  <FaBolt className="stat-icon consumption" />
                </div>
                <div className="stat-value">{energyData.totalConsumption} kWh</div>
                <div className="stat-change positive">
                  <FaArrowDown className="change-icon" />
                  12% from last month
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-title">Monthly Savings</div>
                  <FaDollarSign className="stat-icon savings" />
                </div>
                <div className="stat-value">${energyData.monthlySavings}</div>
                <div className="stat-change positive">
                  <FaArrowUp className="change-icon" />
                  8% increase
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-title">Efficiency Score</div>
                  <FaChartBar className="stat-icon efficiency" />
                </div>
                <div className="stat-value">{energyData.efficiency}%</div>
                <div className="efficiency-bar">
                  <div className="efficiency-fill" style={{ width: `${energyData.efficiency}%` }}></div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-title">Carbon Reduction</div>
                  <FaLeaf className="stat-icon carbon" />
                </div>
                <div className="stat-value">{energyData.carbonReduction}t CO₂</div>
                <div className="stat-change">This month</div>
              </div>
            </div>

            {/* Building Status */}
            <div className="dashboard-grid">
              <div className="dashboard-card">
                <div className="card-header">
                  <h3 className="card-title">Building Status</h3>
                  <p className="card-subtitle">Real-time monitoring of your facilities</p>
                </div>
                <div className="card-content">
                  <div className="building-item">
                    <div className="building-info">
                      <FaBuilding className="building-icon" />
                      <div className="building-details">
                        <div className="building-name">Main Building</div>
                        <div className="building-meta">5 rooms • 12 devices</div>
                      </div>
                    </div>
                    <div className="building-status">
                      <FaWifi className="status-icon online" />
                      <span className="status-text">Online</span>
                    </div>
                  </div>
                  <div className="building-item">
                    <div className="building-info">
                      <FaBuilding className="building-icon" />
                      <div className="building-details">
                        <div className="building-name">Warehouse A</div>
                        <div className="building-meta">3 rooms • 8 devices</div>
                      </div>
                    </div>
                    <div className="building-status">
                      <FaWifi className="status-icon online" />
                      <span className="status-text">Online</span>
                    </div>
                  </div>
                  <div className="building-item">
                    <div className="building-info">
                      <FaBuilding className="building-icon" />
                      <div className="building-details">
                        <div className="building-name">Office Complex</div>
                        <div className="building-meta">8 rooms • 24 devices</div>
                      </div>
                    </div>
                    <div className="building-status">
                      <FaWifi className="status-icon online" />
                      <span className="status-text">Online</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="card-header">
                  <h3 className="card-title">Recent Activity</h3>
                  <p className="card-subtitle">Latest system updates</p>
                </div>
                <div className="card-content">
                  <div className="activity-item">
                    <div className="activity-icon">
                      <FaBuilding />
                    </div>
                    <div className="activity-details">
                      <div className="activity-title">Building added</div>
                      <div className="activity-time">2 minutes ago</div>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon">
                      <FaDoorOpen />
                    </div>
                    <div className="activity-details">
                      <div className="activity-title">Room updated</div>
                      <div className="activity-time">5 minutes ago</div>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon">
                      <FaBolt />
                    </div>
                    <div className="activity-details">
                      <div className="activity-title">Energy report generated</div>
                      <div className="activity-time">1 hour ago</div>
                    </div>
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

export default Dashboard
