import { useState, useEffect } from "react"
import axios from "axios"
import { useParams, useNavigate } from "react-router-dom"
import "./devices.css"
import {
  FaHome,
  FaBuilding,
  FaDoorOpen,
  FaBolt,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCamera,
  FaWifi,
  FaUsers,
  FaCog,
  FaChartBar,
  FaInfoCircle,
} from "react-icons/fa"

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

const DevicesPage = () => {
  // Tab state management
  const [activeTab, setActiveTab] = useState("rooms")

  // Person count state
  const [personCount, setPersonCount] = useState(null)
  const [personLastUpdate, setPersonLastUpdate] = useState(null)
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [devices, setDevices] = useState([])
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cameraAvailable, setCameraAvailable] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(true)
  const [cameraError, setCameraError] = useState(null)
  const [cameraUrl, setCameraUrl] = useState("")

  // Add a timestamp to force image refresh
  const [timestamp, setTimestamp] = useState(Date.now())

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
        navigate("/building") // Navigate back to building page which has rooms
        break
      case "analytics":
        navigate("/analytics")
        break
      default:
        break
    }
  }

  // Poll person count when camera is available
  useEffect(() => {
    if (!cameraAvailable || !cameraUrl || !roomId) return
    let isMounted = true
    const interval = setInterval(() => {
      axios
        .get(`http://localhost:5000/api/person_count/${roomId}`)
        .then((res) => {
          if (isMounted && res.data && !res.data.error) {
            setPersonCount(res.data.person_count)
            setPersonLastUpdate(res.data.last_update)
          }
        })
        .catch(() => {
          if (isMounted) setPersonCount(null)
        })
    }, 1000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [cameraAvailable, cameraUrl, roomId])

  // Poll devices state every 2 seconds to update toggles in real time
  useEffect(() => {
    if (!roomId) return
    let isMounted = true
    const interval = setInterval(() => {
      axios.get(`http://localhost:5000/api/rooms/${roomId}/devices`).then((res) => {
        if (isMounted && Array.isArray(res.data)) {
          setDevices(res.data)
        }
      })
    }, 2000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [roomId])

  // Refresh camera feed only when camera is available and component is mounted
  useEffect(() => {
    if (!cameraAvailable || !cameraUrl) return

    const interval = setInterval(() => {
      setTimestamp(Date.now())
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [cameraAvailable, cameraUrl])

  // Check camera status when room changes
  useEffect(() => {
    let isMounted = true

    const checkCameraStatus = async () => {
      if (!roomId) return

      try {
        setCameraLoading(true)
        const response = await axios.get(`http://localhost:5000/api/camera/status/${roomId}`)
        if (isMounted) {
          setCameraAvailable(response.data.available)
          setCameraUrl(response.data.camera_url || "")
        }
      } catch (error) {
        console.error("Error checking camera status:", error)
        if (isMounted) {
          setCameraError("Failed to check camera status")
          setCameraAvailable(false)
        }
      } finally {
        if (isMounted) {
          setCameraLoading(false)
        }
      }
    }

    checkCameraStatus()

    // Cleanup function
    return () => {
      isMounted = false
    }
  }, [roomId])

  // Modal states
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false)
  const [showEditDeviceModal, setShowEditDeviceModal] = useState(false)

  // New device state
  const [newDevice, setNewDevice] = useState({
    hardware_id: "",
    name: "",
    is_enabled: true,
    persons_before_enabled: 1,
    delay_before_enabled: 0,
    delay_before_disabled: 0,
  })

  // Edit device state
  const [deviceToEdit, setDeviceToEdit] = useState(null)

  // Fetch room and devices data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch devices for the room first (since we already have the room ID)
        const [devicesResponse, buildingResponse] = await Promise.all([
          axios.get(`http://localhost:5000/api/rooms/${roomId}/devices`),
          axios.get("http://localhost:5000/api/buildings"),
        ])

        // Find which building contains our room
        let roomData = null
        for (const building of buildingResponse.data) {
          const roomsResponse = await axios.get(`http://localhost:5000/api/buildings/${building.id}/rooms`)
          const foundRoom = roomsResponse.data.find((r) => r.id === Number.parseInt(roomId))
          if (foundRoom) {
            roomData = {
              ...foundRoom,
              buildingName: building.name,
            }
            break
          }
        }

        setRoom(roomData)
        setDevices(devicesResponse.data)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [roomId])

  // Handle input change for add device form
  const handleAddInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setNewDevice((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  // Handle input change for edit device form
  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setDeviceToEdit((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  // Add a new device
  const addDevice = async () => {
    try {
      // First, check if device with this hardware ID exists
      const checkResponse = await axios.get(
        `http://localhost:5000/api/device/status?hardware_id=${newDevice.hardware_id}`,
      )

      let device

      if (checkResponse.data && checkResponse.data.length > 0) {
        // Device exists, update it
        const existingDevice = checkResponse.data[0]
        const updateResponse = await axios.put(`http://localhost:5000/api/devices/${existingDevice.id}`, {
          ...existingDevice,
          name: newDevice.name || existingDevice.name,
          room_id: Number.parseInt(roomId),
          is_enabled: newDevice.is_enabled,
          persons_before_enabled: Number.parseInt(newDevice.persons_before_enabled) || 1,
          delay_before_enabled: Number.parseInt(newDevice.delay_before_enabled) || 0,
          delay_before_disabled: Number.parseInt(newDevice.delay_before_disabled) || 0,
          is_manual: !!newDevice.is_manual,
        })
        device = updateResponse.data.device
      } else {
        // Create new device
        const response = await axios.post(`http://localhost:5000/api/rooms/${roomId}/devices`, {
          ...newDevice,
          hardware_id: newDevice.hardware_id, // Keep as string
          persons_before_enabled: Number.parseInt(newDevice.persons_before_enabled) || 1,
          delay_before_enabled: Number.parseInt(newDevice.delay_before_enabled) || 0,
          delay_before_disabled: Number.parseInt(newDevice.delay_before_disabled) || 0,
          is_manual: !!newDevice.is_manual,
        })
        device = response.data
      }

      // Refresh devices list
      const devicesResponse = await axios.get(`http://localhost:5000/api/rooms/${roomId}/devices`)
      setDevices(devicesResponse.data)

      setShowAddDeviceModal(false)
      setNewDevice({
        hardware_id: "",
        name: "",
        is_enabled: true,
        persons_before_enabled: 0,
        delay_before_enabled: 0,
        persons_before_disabled: 0,
        delay_before_disabled: 0,
      })
    } catch (error) {
      console.error("Error adding device:", error)
      alert("Failed to add device. Please check the hardware ID and try again.")
    }
  }

  // Update a device
  const updateDevice = async () => {
    if (!deviceToEdit) return

    try {
      const response = await axios.put(`http://localhost:5000/api/devices/${deviceToEdit.id}`, {
        ...deviceToEdit,
        // Ensure numeric fields are properly formatted
        hardware_id: String(deviceToEdit.hardware_id),
        persons_before_enabled: Number.parseInt(deviceToEdit.persons_before_enabled) || 1,
        delay_before_enabled: Number.parseInt(deviceToEdit.delay_before_enabled) || 0,
        delay_before_disabled: Number.parseInt(deviceToEdit.delay_before_disabled) || 0,
        // Ensure room_id is included
        room_id: deviceToEdit.room_id || Number.parseInt(roomId),
        is_manual: !!deviceToEdit.is_manual,
      })

      // Update the UI with the response from the backend
      setDevices(devices.map((device) => (device.id === deviceToEdit.id ? response.data.device : device)))

      setShowEditDeviceModal(false)
      setDeviceToEdit(null)
    } catch (error) {
      console.error("Error updating device:", error)
      alert("Failed to update device. Please try again.")
    }
  }

  // Delete a device
  const deleteDevice = async (deviceId) => {
    if (window.confirm("Are you sure you want to delete this device?")) {
      try {
        await axios.delete(`http://localhost:5000/api/devices/${deviceId}`)
        setDevices(devices.filter((device) => device.id !== deviceId))
      } catch (error) {
        console.error("Error deleting device:", error)
      }
    }
  }

  // Open edit modal with device data
  const openEditModal = (device) => {
    setDeviceToEdit(device)
    setShowEditDeviceModal(true)
  }

  // Toggle device status
  const toggleDeviceStatus = async (device) => {
    try {
      const newState = !device.is_enabled

      // Update the device in the backend
      const response = await axios.put(`http://localhost:5000/api/devices/${device.id}`, {
        ...device,
        is_enabled: newState,
        // Ensure numeric fields are properly formatted
        hardware_id: String(device.hardware_id),
        persons_before_enabled: Number.parseInt(device.persons_before_enabled) || 0,
        delay_before_enabled: Number.parseInt(device.delay_before_enabled) || 0,
        persons_before_disabled: Number.parseInt(device.persons_before_disabled) || 0,
        delay_before_disabled: Number.parseInt(device.delay_before_disabled) || 0,
        // Ensure room_id is included if it exists
        room_id: device.room_id || null,
      })

      // Update the UI with the response from the backend
      setDevices(devices.map((d) => (d.id === device.id ? response.data.device : d)))

      console.log(`Device ${device.id} toggled to ${newState ? "ON" : "OFF"}`)
    } catch (error) {
      console.error("Error toggling device status:", error)
      // Show error to user
      alert("Failed to update device. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="app-container">
        <Sidebar activeTab={activeTab} setActiveTab={handleNavigation} />
        <div className="main-content">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading devices...</p>
          </div>
        </div>
      </div>
    )
  }

  // Generate camera feed URL with timestamp to prevent caching
  const cameraFeedUrl = `http://localhost:5000/api/camera/feed/${roomId}?t=${timestamp}`

  if (!room) {
    return (
      <div className="app-container">
        <Sidebar activeTab={activeTab} setActiveTab={handleNavigation} />
        <div className="main-content">
          <div className="error-container">
            <h2>Room not found</h2>
            <p>The requested room could not be found.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={handleNavigation} />
      <div className="main-content">
        <div className="content-wrapper">
          {/* Page Header */}
          <div className="page-header">
            <div className="header-content">
              <h1 className="page-title">
                <FaDoorOpen className="page-icon" />
                {room?.name}
              </h1>
              <p className="page-subtitle">
                {room?.buildingName} • {devices.length} {devices.length === 1 ? "device" : "devices"}
              </p>
            </div>
            <div className="header-actions">
              <button className="btn btn-primary" onClick={() => setShowAddDeviceModal(true)}>
                <FaPlus className="btn-icon" />
                Add Device
              </button>
            </div>
          </div>

          {/* Camera Feed Section */}
          <div className="camera-section">
            <div className="dashboard-card">
              <div className="card-header">
                <h3 className="card-title">
                  <FaCamera className="card-icon" />
                  Live Camera Feed
                </h3>
                {cameraAvailable && (
                  <div className="person-count">
                    <FaUsers className="person-icon" />
                    <span className="count-number">{personCount !== null ? personCount : "..."}</span>
                    <span className="count-label">persons detected</span>
                  </div>
                )}
              </div>
              <div className="card-content">
                {cameraLoading ? (
                  <div className="camera-loading">
                    <div className="spinner"></div>
                    <p>Loading camera feed...</p>
                  </div>
                ) : cameraAvailable ? (
                  <div className="camera-feed">
                    <img
                      src={cameraFeedUrl || "/placeholder.svg"}
                      alt="Live camera feed"
                      className="camera-image"
                      onError={(e) => {
                        console.error("Error loading camera feed")
                        setCameraAvailable(false)
                      }}
                    />
                    <div className="camera-info">
                      <span className="camera-status active">
                        <FaWifi className="status-icon" />
                        LIVE
                      </span>
                      <span className="camera-url" title={cameraUrl}>
                        {cameraUrl.length > 30 ? `${cameraUrl.substring(0, 27)}...` : cameraUrl}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="camera-unavailable">
                    <FaCamera className="camera-icon-large" />
                    <h4>Camera feed is not available</h4>
                    {cameraError && <p className="error-text">{cameraError}</p>}
                    <button className="btn btn-secondary" onClick={() => window.location.reload()}>
                      Retry Connection
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Devices Grid */}
          <div className="devices-section">
            <div className="section-header">
              <h3 className="section-title">
                <FaCog className="section-icon" />
                Device Management
              </h3>
            </div>

            <div className="devices-grid">
              {devices.map((device) => (
                <div key={device.id} className="device-card">
                  <div className="device-header">
                    <div className="device-info">
                      <h4 className="device-name">{device.name}</h4>
                      <span className="device-id">ID: {device.hardware_id}</span>
                    </div>
                    <div className="device-actions">
                      <button className="action-btn edit" onClick={() => openEditModal(device)} title="Edit device">
                        <FaEdit />
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => deleteDevice(device.id)}
                        title="Delete device"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  <div className="device-content">
                    <div className="device-status">
                      <div className="status-row">
                        <span className="status-label">Control Mode:</span>
                        <span className={`status-badge ${device.is_manual ? "manual" : "auto"}`}>
                          {device.is_manual ? "Manual" : "AI"}
                        </span>
                      </div>

                      <div className="status-row">
                        <span className="status-label">Status:</span>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={device.is_enabled}
                            onChange={() => device.is_manual && toggleDeviceStatus(device)}
                            disabled={!device.is_manual}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        <span className={`status-text ${device.is_enabled ? "enabled" : "disabled"}`}>
                          {device.is_enabled ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    </div>

                    <div className="device-settings">
                      <div className="setting-item">
                        <span className="setting-label">Enable when:</span>
                        <span className="setting-value">
                          {device.persons_before_enabled}+ persons for {device.delay_before_enabled}s
                        </span>
                      </div>
                      <div className="setting-item">
                        <span className="setting-label">Disable when:</span>
                        <span className="setting-value">
                          {'<'}{device.persons_before_enabled} persons for {device.delay_before_disabled || device.delay_before_enabled}s
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Device Modal */}
      {showAddDeviceModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Add New Device</h2>
              <p className="modal-subtitle">Configure a new device for this room</p>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label className="form-label">Hardware ID</label>
                <input
                  type="text"
                  name="hardware_id"
                  className="form-input"
                  placeholder="Enter hardware ID"
                  value={newDevice.hardware_id}
                  onChange={handleAddInputChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Device Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  placeholder="Enter device name"
                  value={newDevice.name}
                  onChange={handleAddInputChange}
                />
              </div>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_enabled"
                    checked={newDevice.is_enabled}
                    onChange={handleAddInputChange}
                  />
                  <span className="checkbox-text">Device Enabled</span>
                </label>
              </div>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_manual"
                    checked={!!newDevice.is_manual}
                    onChange={handleAddInputChange}
                  />
                  <span className="checkbox-text">Manual Control</span>
                </label>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Enable when (persons ≥)</label>
                  <input
                    type="number"
                    min="1"
                    name="persons_before_enabled"
                    className="form-input"
                    value={newDevice.persons_before_enabled}
                    onChange={handleAddInputChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Enable delay (seconds)</label>
                  <input
                    type="number"
                    min="0"
                    name="delay_before_enabled"
                    className="form-input"
                    value={newDevice.delay_before_enabled}
                    onChange={handleAddInputChange}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Disable delay (seconds)</label>
                  <input
                    type="number"
                    min="0"
                    name="delay_before_disabled"
                    className="form-input"
                    value={newDevice.delay_before_disabled}
                    onChange={handleAddInputChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <span className="hint" title="Device will disable when persons < enable threshold">
                      Disable when: <FaInfoCircle />
                    </span>
                  </label>
                  <div className="form-input hint-text">
                    {'<'} {newDevice.persons_before_enabled} persons
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddDeviceModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={addDevice}>
                Add Device
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Device Modal */}
      {showEditDeviceModal && deviceToEdit && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Edit Device</h2>
              <p className="modal-subtitle">Update device configuration</p>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label className="form-label">Hardware ID</label>
                <input
                  type="number"
                  name="hardware_id"
                  className="form-input"
                  value={deviceToEdit.hardware_id}
                  onChange={handleEditInputChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Device Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  value={deviceToEdit.name}
                  onChange={handleEditInputChange}
                />
              </div>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_enabled"
                    checked={deviceToEdit.is_enabled}
                    onChange={handleEditInputChange}
                  />
                  <span className="checkbox-text">Device Enabled</span>
                </label>
              </div>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_manual"
                    checked={!!deviceToEdit.is_manual}
                    onChange={handleEditInputChange}
                  />
                  <span className="checkbox-text">Manual Control</span>
                </label>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Enable when (persons ≥)</label>
                  <input
                    type="number"
                    min="1"
                    name="persons_before_enabled"
                    className="form-input"
                    value={deviceToEdit.persons_before_enabled}
                    onChange={handleEditInputChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Enable delay (seconds)</label>
                  <input
                    type="number"
                    min="0"
                    name="delay_before_enabled"
                    className="form-input"
                    value={deviceToEdit.delay_before_enabled}
                    onChange={handleEditInputChange}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Disable delay (seconds)</label>
                  <input
                    type="number"
                    min="0"
                    name="delay_before_disabled"
                    className="form-input"
                    value={deviceToEdit.delay_before_disabled}
                    onChange={handleEditInputChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <span className="hint" title="Device will disable when persons < enable threshold">
                      Disable when: <FaInfoCircle />
                    </span>
                  </label>
                  <div className="form-input hint-text">
                    {'<'} {deviceToEdit.persons_before_enabled} persons
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEditDeviceModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={updateDevice}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DevicesPage
