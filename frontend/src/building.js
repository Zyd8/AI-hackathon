import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import {
  FaHome,
  FaBuilding,
  FaDoorOpen,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaWifi,
  FaPencilAlt,
  FaChartBar,
  FaBolt,
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

const BuildingNavbar = ({ buildings, onSelectBuilding, activeBuilding, fromBuildingsPage, setActiveTab }) => (
  <div className="building-navbar">
    {buildings.map((building) => (
      <div key={building.id} className="building-nav-item">
        <button
          className={`building-button ${!fromBuildingsPage && activeBuilding?.id === building.id ? "building-button-active" : ""}`}
          onClick={() => {
            onSelectBuilding(building)
            if (fromBuildingsPage && setActiveTab) {
              setActiveTab("rooms")
            }
          }}
        >
          {building.name}
        </button>
      </div>
    ))}
  </div>
)

const BuildingNavigation = () => {
  const [activeTab, setActiveTab] = useState("buildings")
  const [buildings, setBuildings] = useState([])
  const [rooms, setRooms] = useState([])
  const [selectedBuilding, setSelectedBuilding] = useState(null)
  const [devices, setDevices] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)

  // Modal states
  const [showDevicesModal, setShowDevicesModal] = useState(false)
  const [showAddBuildingModal, setShowAddBuildingModal] = useState(false)
  const [showAddRoomModal, setShowAddRoomModal] = useState(false)
  const [showEditRoomModal, setShowEditRoomModal] = useState(false)
  const [showEditBuildingModal, setShowEditBuildingModal] = useState(false)

  // Add building state
  const [newBuilding, setNewBuilding] = useState({ name: "", description: "" })

  // Add room state
  const [newRoomName, setNewRoomName] = useState("")
  const [newRoomBuildingId, setNewRoomBuildingId] = useState("")
  const [newRoomCamera, setNewRoomCamera] = useState("")

  // Edit room state
  const [roomToEditId, setRoomToEditId] = useState(null)
  const [editRoomName, setEditRoomName] = useState("")
  const [editRoomCamera, setEditRoomCamera] = useState("")

  // Edit building state
  const [buildingToEdit, setBuildingToEdit] = useState(null)
  const [editBuildingName, setEditBuildingName] = useState("")
  const [editBuildingDescription, setEditBuildingDescription] = useState("")

  // State to manage the list of rooms and the selected sort option
  const [sortOption, setSortOption] = useState("az")
  const [searchTerm, setSearchTerm] = useState("")
  const [buildingSearchTerm, setBuildingSearchTerm] = useState("")
  const [buildingSortOption, setBuildingSortOption] = useState("az")

  // Mock energy data for dashboard
  const energyData = {
    totalConsumption: 3230,
    monthlySavings: 1240,
    efficiency: 87,
    carbonReduction: 2.4,
  }

  // Fetch buildings from API
  const fetchBuildings = () => {
    axios
      .get("http://localhost:5000/api/buildings")
      .then((response) => {
        setBuildings(response.data)
      })
      .catch((error) => {
        console.error("Error fetching buildings:", error)
      })
  }

  useEffect(() => {
    fetchBuildings()
  }, [])

  // When buildings load, set selected building and fetch its rooms
  useEffect(() => {
    if (buildings.length > 0) {
      // If no building is selected or the selected building no longer exists
      if (!selectedBuilding || !buildings.some(b => b.id === selectedBuilding.id)) {
        setSelectedBuilding(buildings[0]);
        fetchRooms(buildings[0]);
      }
    } else {
      // If no buildings exist, clear the selected building and rooms
      setSelectedBuilding(null);
      setRooms([]);
    }
  }, [buildings]);

  // Fetch rooms for a building
  const fetchRooms = (building) => {
    axios
      .get(`http://localhost:5000/api/buildings/${building.id}/rooms`)
      .then((response) => {
        // Get device counts for each room
        const roomsWithDeviceCounts = response.data

        // Create an array of promises to fetch device counts
        const deviceCountPromises = roomsWithDeviceCounts.map((room) =>
          axios
            .get(`http://localhost:5000/api/rooms/${room.id}/devices`)
            .then((devicesResponse) => ({
              ...room,
              devices_count: devicesResponse.data.length,
            }))
            .catch((error) => {
              console.error(`Error fetching devices for room ${room.id}:`, error)
              return { ...room, devices_count: 0 }
            }),
        )

        // Wait for all device count requests to complete
        Promise.all(deviceCountPromises).then((roomsWithCounts) => {
          setRooms(roomsWithCounts)
          setSelectedBuilding(building)
        })
      })
      .catch((error) => {
        console.error("Error fetching rooms:", error)
      })
  }

  // Add a new building
  const addBuilding = () => {
    if (!newBuilding.name.trim()) {
      alert("Building name is required")
      return
    }

    axios
      .post("http://localhost:5000/api/buildings", newBuilding)
      .then(() => {
        fetchBuildings()
        setShowAddBuildingModal(false)
        setNewBuilding({ name: "", description: "" })
      })
      .catch((error) => {
        console.error("Error adding building:", error)
      })
  }

  // Add a new room
  const addRoom = () => {
    if (!newRoomBuildingId) {
      alert("Please select a building for the new room")
      return
    }
    if (!newRoomName.trim()) {
      alert("Room name is required")
      return
    }

    axios
      .post(`http://localhost:5000/api/buildings/${newRoomBuildingId}/rooms`, {
        name: newRoomName,
        live_camera: newRoomCamera,
      })
      .then(() => {
        const building = buildings.find((b) => b.id === newRoomBuildingId)
        if (building) {
          fetchRooms(building)
        }
        setNewRoomName("")
        setNewRoomCamera("")
        setNewRoomBuildingId("")
        setShowAddRoomModal(false)
      })
      .catch((error) => {
        console.error("Error adding room:", error)
      })
  }

  // Update building info
  const handleUpdateBuilding = () => {
    if (!buildingToEdit) {
      alert("Please select a building to edit")
      return
    }
    if (!editBuildingName.trim()) {
      alert("Building name cannot be empty")
      return
    }

    axios
      .put(`http://localhost:5000/api/buildings/${buildingToEdit.id}`, {
        name: editBuildingName,
        description: editBuildingDescription,
      })
      .then(() => {
        fetchBuildings()
        setShowEditBuildingModal(false)
        setBuildingToEdit(null)
        setEditBuildingName("")
        setEditBuildingDescription("")
      })
      .catch((error) => {
        console.error("Error updating building:", error)
      })
  }

  // Update room info
  const handleUpdateRoom = () => {
    if (!roomToEditId) {
      alert("Please select a room to edit")
      return
    }
    if (!editRoomName.trim()) {
      alert("Room name cannot be empty")
      return
    }

    axios
      .put(`http://localhost:5000/api/rooms/${roomToEditId}`, {
        name: editRoomName,
        live_camera: editRoomCamera,
      })
      .then(() => {
        if (selectedBuilding) {
          fetchRooms(selectedBuilding)
        }
        setShowEditRoomModal(false)
        setRoomToEditId(null)
        setEditRoomName("")
        setEditRoomCamera("")
      })
      .catch((err) => {
        console.error("Failed to update room", err)
      })
  }

  // Function to handle sorting
  const sortRooms = (option) => {
    const sortedRooms = [...rooms]
    if (option === "az") {
      sortedRooms.sort((a, b) => a.name.localeCompare(b.name))
    } else if (option === "za") {
      sortedRooms.sort((a, b) => b.name.localeCompare(a.name))
    }
    setRooms(sortedRooms)
  }

  // Function to handle building sorting
  const sortBuildings = (option) => {
    const sortedBuildings = [...buildings]
    if (option === "az") {
      sortedBuildings.sort((a, b) => a.name.localeCompare(b.name))
    } else if (option === "za") {
      sortedBuildings.sort((a, b) => b.name.localeCompare(a.name))
    }
    setBuildings(sortedBuildings)
  }

  // Handler for when the sort option changes
  const handleSortChange = (e) => {
    const value = e.target.value
    setSortOption(value)
    sortRooms(value)
  }

  // Handler for when the building sort option changes
  const handleBuildingSortChange = (e) => {
    const value = e.target.value
    setBuildingSortOption(value)
    sortBuildings(value)
  }

  // Filtered rooms based on search term
  const filteredRooms = rooms.filter((room) => room.name.toLowerCase().includes(searchTerm.toLowerCase()))

  // Filtered buildings based on search term
  const filteredBuildings = buildings.filter((building) =>
    building.name.toLowerCase().includes(buildingSearchTerm.toLowerCase()),
  )

  // Delete a building
  const deleteBuilding = async (buildingId) => {
    try {
      await axios.delete(`http://localhost:5000/api/buildings/${buildingId}`);
      // After successful deletion, fetch updated buildings list
      fetchBuildings();
      // Clear rooms if the deleted building was selected
      if (selectedBuilding && selectedBuilding.id === buildingId) {
        setRooms([]);
      }
    } catch (error) {
      console.error("Error deleting building:", error);
      alert("Failed to delete building. Please try again.");
    }
  };

  // Delete a room
  const deleteRoom = async (roomId) => {
    if (!roomId) {
      console.error("No room ID provided for deletion");
      return;
    }

    if (window.confirm("Are you sure you want to delete this room? This will also delete all devices in the room.")) {
      try {
        // First check if the room exists
        const checkResponse = await axios.get(`http://localhost:5000/api/buildings/${selectedBuilding.id}/rooms`);
        const roomExists = checkResponse.data.some(room => room.id === roomId);
        
        if (!roomExists) {
          alert("Room not found. It may have been already deleted.");
          // Refresh the rooms list
          if (selectedBuilding) {
            fetchRooms(selectedBuilding);
          }
          return;
        }

        await axios.delete(`http://localhost:5000/api/rooms/${roomId}`);
        if (selectedBuilding) {
          fetchRooms(selectedBuilding);
        }
      } catch (error) {
        console.error("Error deleting room:", error);
        if (error.response?.status === 404) {
          alert("Room not found. It may have been already deleted.");
        } else {
          alert("Failed to delete room. Please try again.");
        }
        // Refresh the rooms list in case of any error
        if (selectedBuilding) {
          fetchRooms(selectedBuilding);
        }
      }
    }
  }

  // Fetch devices for a room and open modal
  const fetchDevices = (room) => {
    axios
      .get(`http://localhost:5000/api/rooms/${room.id}/devices`)
      .then((response) => {
        setDevices(response.data)
        setSelectedRoom(room)
        setShowDevicesModal(true)
      })
      .catch((error) => {
        console.error("Error fetching devices:", error)
      })
  }

  const closeDevicesModal = () => {
    setShowDevicesModal(false)
    setSelectedRoom(null)
    setDevices([])
  }

  const navigate = useNavigate()

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="main-content">
        <div className="content-wrapper">
          <div className="page-header">
            <div className="header-content">
              <h1 className="page-title">Energy Management Dashboard</h1>
              <p className="page-subtitle">Monitor and optimize your building's energy consumption</p>
            </div>
            <div className="header-actions">
              {/* Building buttons - show only when buildings tab is active */}
              {activeTab === "buildings" && (
                <>
                  <button className="btn btn-primary" onClick={() => setShowAddBuildingModal(true)}>
                    <FaPlus className="btn-icon" />
                    Add Building
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      if (!selectedBuilding) {
                        alert("Please select a building to edit")
                        return
                      }
                      setBuildingToEdit(selectedBuilding)
                      setEditBuildingName(selectedBuilding.name)
                      setEditBuildingDescription(selectedBuilding.description || "")
                      setShowEditBuildingModal(true)
                    }}
                  >
                    <FaEdit className="btn-icon" />
                    Edit Building
                  </button>
                </>
              )}

              {/* Room buttons - show only when rooms tab is active */}
              {activeTab === "rooms" && selectedBuilding && (
                <>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setShowAddRoomModal(true)
                      setNewRoomBuildingId(selectedBuilding.id)
                    }}
                  >
                    <FaPlus className="btn-icon" />
                    Add Room
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowEditRoomModal(true)}>
                    <FaEdit className="btn-icon" />
                    Edit Room
                  </button>
                </>
              )}

              {/* No buttons for dashboard and analytics tabs */}
            </div>
          </div>

          {/* Building Navbar - Show only for rooms tab */}
          {activeTab === "rooms" && (
            <BuildingNavbar
              buildings={buildings}
              activeBuilding={selectedBuilding}
              onSelectBuilding={fetchRooms}
              fromBuildingsPage={false}
            />
          )}

          {activeTab === "dashboard" && (
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
          )}

          {activeTab === "buildings" && (
            <div className="buildings-content">
              <BuildingNavbar
                buildings={buildings}
                activeBuilding={selectedBuilding}
                onSelectBuilding={fetchRooms}
                fromBuildingsPage={true}
                setActiveTab={setActiveTab}
              />

              {/* Buildings header with search and sort */}
              <div className="rooms-header">
                <div style={{ marginBottom: "16px" }}>
                  <div className="rooms-title">
                    <FaBuilding className="rooms-icon" />
                    Buildings
                  </div>
                </div>
                <div className="rooms-controls">
                  <div className="search-controls">
                    <div className="search-box">
                      <FaSearch className="search-icon" />
                      <input
                        type="text"
                        placeholder="Search buildings..."
                        className="search-input"
                        value={buildingSearchTerm}
                        onChange={(e) => setBuildingSearchTerm(e.target.value)}
                      />
                    </div>
                    <select className="sort-select" value={buildingSortOption} onChange={handleBuildingSortChange}>
                      <option value="az">A–Z</option>
                      <option value="za">Z–A</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="buildings-grid">
                {filteredBuildings.map((building) => (
                  <div key={building.id} className="building-card">
                    <div className="building-card-header">
                      <div className="building-card-title">{building.name}</div>
                    </div>
                    <div className="building-card-actions">
                      <button
                        className="action-btn edit"
                        onClick={() => {
                          setBuildingToEdit(building)
                          setEditBuildingName(building.name)
                          setEditBuildingDescription(building.description || "")
                          setShowEditBuildingModal(true)
                        }}
                        title="Edit building"
                      >
                        ✎
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => {
                          if (window.confirm(`Delete ${building.name}?`)) {
                            deleteBuilding(building.id)
                          }
                        }}
                        title="Delete building"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "rooms" && (
            <div className="rooms-content">
              {buildings.length === 0 ? (
                <div className="no-buildings-message">
                  <FaBuilding className="message-icon" />
                  <h3>No Buildings Available</h3>
                  <p>Please add a building first to manage rooms.</p>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      setActiveTab("buildings");
                      setShowAddBuildingModal(true);
                    }}
                  >
                    Add Building
                  </button>
                </div>
              ) : (
                <>
                  {/* Navbar with only search and sort */}
                  <div className="rooms-header">
                    <div style={{ marginBottom: "16px" }}>
                      <div className="rooms-title">
                        <FaBuilding className="rooms-icon" />
                        Rooms in {selectedBuilding?.name || "Select a Building"}
                      </div>
                    </div>
                    <div className="rooms-controls">
                      <div className="search-controls">
                        <div className="search-box">
                          <FaSearch className="search-icon" />
                          <input
                            type="text"
                            placeholder="Search rooms..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        <select className="sort-select" value={sortOption} onChange={handleSortChange}>
                          <option value="az">A–Z</option>
                          <option value="za">Z–A</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="rooms-grid">
                    {filteredRooms.map((room) => (
                      <div
                        key={room.id}
                        className="room-card"
                        onClick={() => {
                          setSelectedRoom(room)
                          navigate(`/devices/${room.id}`)
                        }}
                      >
                        <div className="room-header">
                          <div className="room-info">
                            <FaDoorOpen className="room-icon" />
                            <span className="room-name">{room.name}</span>
                          </div>
                          <div className="room-status online">
                            <FaWifi className="status-icon" />
                            Active
                          </div>
                        </div>
                        <div className="room-content">
                          <div className="room-detail">
                            <span className="detail-label">Camera:</span>
                            <span className="detail-value">{room.live_camera || "No camera"}</span>
                          </div>
                          {/* Add device count detail */}
                          <div className="room-detail">
                            <span className="detail-label">Devices:</span>
                            <span className="detail-value">{room.devices_count || 0}</span>
                          </div>
                        </div>
                        <div className="room-actions">
                          <button
                            className="action-btn edit"
                            onClick={(e) => {
                              e.stopPropagation()
                              setRoomToEditId(room.id)
                              setEditRoomName(room.name)
                              setEditRoomCamera(room.live_camera || "")
                              setShowEditRoomModal(true)
                              setSelectedRoom(room)
                            }}
                            title="Edit room"
                          >
                            <FaPencilAlt />
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedRoom(room)
                              if (window.confirm(`Delete ${room.name}?`)) {
                                deleteRoom(room.id)
                              }
                            }}
                            title="Delete room"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "analytics" && (
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
              </div>

              <div className="recommendations-card">
                <div className="card-header">
                  <h3 className="card-title">Efficiency Recommendations</h3>
                  <p className="card-subtitle">AI-powered suggestions to optimize energy usage</p>
                </div>
                <div className="recommendations-list">
                  <div className="recommendation high">
                    <div className="recommendation-priority">High Impact</div>
                    <div className="recommendation-text">
                      Reduce HVAC usage during off-hours to save up to $340/month
                    </div>
                  </div>
                  <div className="recommendation medium">
                    <div className="recommendation-priority">Medium Impact</div>
                    <div className="recommendation-text">Upgrade to LED lighting in Warehouse A to save $120/month</div>
                  </div>
                  <div className="recommendation low">
                    <div className="recommendation-priority">Low Impact</div>
                    <div className="recommendation-text">Install smart power strips to eliminate phantom loads</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modals */}
          {showAddBuildingModal && (
            <div className="modal-overlay">
              <div className="modal">
                <div className="modal-header">
                  <h2 className="modal-title">Add Building</h2>
                  <p className="modal-subtitle">Create a new building to manage rooms and devices.</p>
                </div>
                <div className="modal-content">
                  <div className="form-group">
                    <label className="form-label">Building Name</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="Enter building name"
                      value={newBuilding.name}
                      onChange={(e) => setNewBuilding({ ...newBuilding, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="Enter description (optional)"
                      value={newBuilding.description}
                      onChange={(e) => setNewBuilding({ ...newBuilding, description: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowAddBuildingModal(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={addBuilding}>
                    Add Building
                  </button>
                </div>
              </div>
            </div>
          )}

          {showEditBuildingModal && (
            <div className="modal-overlay">
              <div className="modal">
                <div className="modal-header">
                  <h2 className="modal-title">Edit Building</h2>
                  <p className="modal-subtitle">Update building information.</p>
                </div>
                <div className="modal-content">
                  <div className="form-group">
                    <label className="form-label">Select Building</label>
                    <select
                      className="form-select"
                      value={buildingToEdit?.id?.toString() || ""}
                      onChange={(e) => {
                        const selectedId = Number.parseInt(e.target.value)
                        const building = buildings.find((b) => b.id === selectedId)
                        setBuildingToEdit(building)
                        setEditBuildingName(building?.name || "")
                        setEditBuildingDescription(building?.description || "")
                      }}
                    >
                      <option value="" disabled>
                        Select a building
                      </option>
                      {buildings.map((building) => (
                        <option key={building.id} value={building.id.toString()}>
                          {building.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Building Name</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="Enter building name"
                      value={editBuildingName}
                      onChange={(e) => setEditBuildingName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="Enter description (optional)"
                      value={editBuildingDescription}
                      onChange={(e) => setEditBuildingDescription(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowEditBuildingModal(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleUpdateBuilding}>
                    Update Building
                  </button>
                </div>
              </div>
            </div>
          )}

          {showAddRoomModal && (
            <div className="modal-overlay">
              <div className="modal">
                <div className="modal-header">
                  <h2 className="modal-title">Add New Room</h2>
                  <p className="modal-subtitle">Create a new room in the selected building.</p>
                </div>
                <div className="modal-content">
                  <div className="form-group">
                    <label className="form-label">Select Building</label>
                    <select
                      className="form-select"
                      value={newRoomBuildingId?.toString() || ""}
                      onChange={(e) => setNewRoomBuildingId(Number.parseInt(e.target.value))}
                    >
                      <option value="" disabled>
                        Select a building
                      </option>
                      {buildings.map((building) => (
                        <option key={building.id} value={building.id.toString()}>
                          {building.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Room Name</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="Room Name (e.g. EN205)"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Camera IP</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="Camera IP (e.g. 192.168.12)"
                      value={newRoomCamera}
                      onChange={(e) => setNewRoomCamera(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowAddRoomModal(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={addRoom}>
                    Add Room
                  </button>
                </div>
              </div>
            </div>
          )}

          {showEditRoomModal && (
            <div className="modal-overlay">
              <div className="modal">
                <div className="modal-header">
                  <h2 className="modal-title">Edit Room</h2>
                  <p className="modal-subtitle">Update room information.</p>
                </div>
                <div className="modal-content">
                  <div className="form-group">
                    <label className="form-label">Select Room</label>
                    <select
                      className="form-select"
                      value={roomToEditId?.toString() || ""}
                      onChange={(e) => {
                        const selectedId = Number.parseInt(e.target.value)
                        setRoomToEditId(selectedId)

                        const room = rooms.find((r) => r.id === selectedId)
                        if (room) {
                          setEditRoomName(room.name)
                          setEditRoomCamera(room.live_camera || "")
                        } else {
                          setEditRoomName("")
                          setEditRoomCamera("")
                        }
                      }}
                    >
                      <option value="" disabled>
                        Select a room
                      </option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id.toString()}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Room Name</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="Room Name"
                      value={editRoomName}
                      onChange={(e) => setEditRoomName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Camera IP</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="Camera IP"
                      value={editRoomCamera}
                      onChange={(e) => setEditRoomCamera(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowEditRoomModal(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleUpdateRoom}>
                    Update Room
                  </button>
                </div>
              </div>
            </div>
          )}

          {showDevicesModal && (
            <div className="modal-overlay" onClick={closeDevicesModal}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2 className="modal-title">Devices in {selectedRoom?.name}</h2>
                  <p className="modal-subtitle">View all devices in this room.</p>
                </div>
                <div className="modal-content">
                  {devices.length > 0 ? (
                    <div className="device-list">
                      {devices.map((device) => (
                        <div key={device.id} className="device-item">
                          <FaWifi className="device-icon" />
                          <span>{device.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">No devices found in this room.</div>
                  )}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-primary" onClick={closeDevicesModal}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BuildingNavigation
