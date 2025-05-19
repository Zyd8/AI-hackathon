import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

const Sidebar = () => (
  <div className="sidebar">
    <h2>UEcoManage</h2>
  </div>
);

const BuildingNavbar = ({ buildings, onSelectBuilding, activeBuilding, onDeleteBuilding }) => (
  <nav className="building-navbar">
    {buildings.map((building) => (
      <div key={building.id} className="building-nav-item">
        <button
          className={activeBuilding?.id === building.id ? "active" : ""}
          onClick={() => onSelectBuilding(building)}
        >
          {building.name}
        </button>
        <button 
          className="delete-building-btn"
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(`Are you sure you want to delete ${building.name}? This will also delete all rooms and devices in it.`)) {
              onDeleteBuilding(building.id);
            }
          }}
          title="Delete building"
        >
          ×
        </button>
      </div>
    ))}
  </nav>
);

const BuildingNavigation = () => {
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Modal states
  const [showDevicesModal, setShowDevicesModal] = useState(false);
  const [showAddBuildingModal, setShowAddBuildingModal] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showEditRoomModal, setShowEditRoomModal] = useState(false);

  // Add building state
  const [newBuilding, setNewBuilding] = useState({ name: '', description: '' });

  // Add room state
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomBuildingId, setNewRoomBuildingId] = useState('');
  const [newRoomCamera, setNewRoomCamera] = useState('');

  // Edit room state
  const [roomToEditId, setRoomToEditId] = useState(null);
  const [editRoomName, setEditRoomName] = useState('');
  const [editRoomCamera, setEditRoomCamera] = useState('');
  // Edit builoding
  const [showEditBuildingModal, setShowEditBuildingModal] = useState(false);
  const [buildingToEdit, setBuildingToEdit] = useState(null);
  const [editBuildingName, setEditBuildingName] = useState('');
  const [editBuildingDescription, setEditBuildingDescription] = useState('');

  // State to manage the list of rooms and the selected sort option
  const [sortOption, setSortOption] = useState('az');
  const [searchTerm, setSearchTerm] = useState('');


  // Fetch buildings from API
  const fetchBuildings = () => {
    axios.get('http://localhost:5000/api/buildings')
      .then((response) => {
        setBuildings(response.data);
      })
      .catch((error) => {
        console.error('Error fetching buildings:', error);
      });
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  // When buildings load, set selected building and fetch its rooms
  useEffect(() => {
    if (buildings.length > 0) {
      setSelectedBuilding(buildings[0]);
      fetchRooms(buildings[0]);
    }
  }, [buildings]);

  // Fetch rooms for a building
  const fetchRooms = (building) => {
    axios.get(`http://localhost:5000/api/buildings/${building.id}/rooms`)
      .then((response) => {
        setRooms(response.data);
        setSelectedBuilding(building);
      })
      .catch((error) => {
        console.error('Error fetching rooms:', error);
      });
  };

  // Add a new building
  const addBuilding = () => {
    if (!newBuilding.name.trim()) {
      alert('Building name is required');
      return;
    }

    axios.post('http://localhost:5000/api/buildings', newBuilding)
      .then(() => {
        fetchBuildings(); // Refresh buildings from backend
        setShowAddBuildingModal(false);
        setNewBuilding({ name: '', description: '' });
      })
      .catch((error) => {
        console.error('Error adding building:', error);
      });
  };

  // Add a new room
  const addRoom = () => {
    if (!newRoomBuildingId) {
      alert('Please select a building for the new room');
      return;
    }
    if (!newRoomName.trim()) {
      alert('Room name is required');
      return;
    }

    axios.post(`http://localhost:5000/api/buildings/${newRoomBuildingId}/rooms`, {
      name: newRoomName,
      live_camera: newRoomCamera,
    })
      .then(() => {
        const building = buildings.find(b => b.id === newRoomBuildingId);
        if (building) {
          fetchRooms(building);
        }
        setNewRoomName('');
        setNewRoomCamera('');
        setNewRoomBuildingId('');
        setShowAddRoomModal(false);
      })
      .catch((error) => {
        console.error('Error adding room:', error);
      });
  };

  // Update building info
  const handleUpdateBuilding = () => {
    if (!buildingToEdit) {
      alert('Please select a building to edit');
      return;
    }
    if (!editBuildingName.trim()) {
      alert('Building name cannot be empty');
      return;
    }

    
    axios.put(`http://localhost:5000/api/buildings/${buildingToEdit.id}`, {
      name: editBuildingName,
      description: editBuildingDescription,
    })
      .then(() => {
        fetchBuildings(); // Refresh the buildings list
        setShowEditBuildingModal(false);
        setBuildingToEdit(null);
        setEditBuildingName('');
        setEditBuildingDescription('');
      })
      .catch((error) => {
        console.error('Error updating building:', error);
      });
  };
  // Update room info
  const handleUpdateRoom = () => {
    if (!roomToEditId) {
      alert('Please select a room to edit');
      return;
    }
    if (!editRoomName.trim()) {
      alert('Room name cannot be empty');
      return;
    }

    axios.put(`http://localhost:5000/api/rooms/${roomToEditId}`, {
      name: editRoomName,
      live_camera: editRoomCamera,
    })
      .then(() => {
        if (selectedBuilding) {
          fetchRooms(selectedBuilding);
        }
        setShowEditRoomModal(false);
        setRoomToEditId(null);
        setEditRoomName('');
        setEditRoomCamera('');
      })
      .catch(err => {
        console.error('Failed to update room', err);
      });
  };

  // Function to handle sorting
  const sortRooms = (option) => {
    let sortedRooms = [...rooms];
    if (option === 'az') {
      sortedRooms.sort(); // Sort alphabetically A–Z
    } else if (option === 'za') {
      sortedRooms.sort().reverse(); // Sort alphabetically Z–A
    }
    setRooms(sortedRooms); // Update the rooms state with the sorted list
  };

  // Handler for when the sort option changes
  const handleSortChange = (e) => {
    const newSortOption = e.target.value;
    setSortOption(newSortOption); // Update the selected sort option
    sortRooms(newSortOption); // Sort the rooms based on the new option
  };

  // Filtered rooms based on search term
  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Delete a building
  const deleteBuilding = async (buildingId) => {
    try {
      await axios.delete(`http://localhost:5000/api/buildings/${buildingId}`);
      // Refresh buildings list
      fetchBuildings();
    } catch (error) {
      console.error('Error deleting building:', error);
      alert('Failed to delete building. Please try again.');
    }
  };

  // Delete a room
  const deleteRoom = async (roomId) => {
    try {
      await axios.delete(`http://localhost:5000/api/rooms/${roomId}`);
      // Refresh rooms list if we have a selected building
      if (selectedBuilding) {
        fetchRooms(selectedBuilding);
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      alert('Failed to delete room. Please try again.');
    }
  };

  // Fetch devices for a room and open modal
  const fetchDevices = (room) => {
    axios.get(`http://localhost:5000/api/rooms/${room.id}/devices`)
      .then((response) => {
        setDevices(response.data);
        setSelectedRoom(room);
        setShowDevicesModal(true);
      })
      .catch((error) => {
        console.error('Error fetching devices:', error);
      });
  };

  const closeDevicesModal = () => {
    setShowDevicesModal(false);
    setSelectedRoom(null);
    setDevices([]);
  };

  const navigate = useNavigate();
  
  return (
    <div className="main">
        <header>
          <h1>UEcoManage Admin</h1>
          <p style={{ color: '#475569', marginTop: '10px' }}>
            Monitor and manage buildings, rooms, and devices.
          </p>

          <div className="controls-right">
            <button onClick={() => setShowAddBuildingModal(true)}>Add Building</button>
            {/* You can implement Edit Building button logic later */}
            <button 
              onClick={() => {
                if (!selectedBuilding) {
                  alert("Please select a building to edit");
                  return;
                }
                setBuildingToEdit(selectedBuilding);
                setEditBuildingName(selectedBuilding.name);
                setEditBuildingDescription(selectedBuilding.description || '');
                setShowEditBuildingModal(true);
              }}
            >
              Edit Building
            </button>
          </div>
        </header>

        <BuildingNavbar
          buildings={buildings}
          activeBuilding={selectedBuilding}
          onSelectBuilding={fetchRooms}
          onDeleteBuilding={deleteBuilding}
        />

        {/* Add Building Modal */}
        {showAddBuildingModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Add Building</h2>
              <input
                type="text"
                placeholder="Building Name"
                value={newBuilding.name}
                onChange={(e) => setNewBuilding({ ...newBuilding, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Description"
                value={newBuilding.description}
                onChange={(e) => setNewBuilding({ ...newBuilding, description: e.target.value })}
              />
              <div className="modal-buttons">
                <button onClick={addBuilding}>Add Building</button>
                <button onClick={() => setShowAddBuildingModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
        {/* Edit Building Modal */}
        {showEditBuildingModal && (
        <div className="modal-overlay">
          <div className="modal">
            <button className="modal-close" onClick={() => setShowEditBuildingModal(false)}>×</button>
            <h2>Edit Building</h2>

            <select
              value={buildingToEdit?.id || ''}
              onChange={(e) => {
                const selectedId = parseInt(e.target.value);
                const building = buildings.find(b => b.id === selectedId);
                setBuildingToEdit(building);
                setEditBuildingName(building?.name || '');
                setEditBuildingDescription(building?.description || '');
              }}
            >
              <option value="" disabled>Select Building</option>
              {buildings.map(building => (
                <option key={building.id} value={building.id}>{building.name}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Building Name"
              value={editBuildingName}
              onChange={(e) => setEditBuildingName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Description"
              value={editBuildingDescription}
              onChange={(e) => setEditBuildingDescription(e.target.value)}
            />

            <div className="modal-buttons">
              <button onClick={handleUpdateBuilding}>Update Building</button>
              <button onClick={() => setShowEditBuildingModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

        {/* Rooms Section */}
        {selectedBuilding && (
          <section className="rooms">
            <div className="rooms-header">
              <h2>Rooms in {selectedBuilding.name}</h2>
              <div className="controls-container">
              <div className="controls-left">
                <input 
                type="text" 
                id="roomSearch" 
                placeholder="Search..." 
                value ={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} />
                
                <select
                  id="roomSort"
                  value={sortOption}
                  onChange={handleSortChange}
                >
                  <option value="az">A–Z</option>
                  <option value="za">Z–A</option>
                </select>
              </div>
              <div className="controls-right">
                <button onClick={() => {
                  setShowAddRoomModal(true);
                  setNewRoomBuildingId(selectedBuilding.id);
                }}>
                  Add Room
                </button>
                <button onClick={() => setShowEditRoomModal(true)}>Edit Room</button>
                <button 
                  onClick={() => {
                    if (!selectedRoom) {
                      alert("Please select a room to delete");
                      return;
                    }
                    if (window.confirm(`Are you sure you want to delete ${selectedRoom.name}? This will also delete all devices in it.`)) {
                      deleteRoom(selectedRoom.id);
                    }
                  }}
                >
                  Delete Room
                </button>
              </div>
              </div>
            </div>

            <div className="rooms-grid">
              {/* Renders each room in the filtered rooms list as a clickable card,
                  allowing users to view devices associated with the room. */}
              {filteredRooms.map((room) => (
                <div
                  key={room.id}
                  className="room-card"
                  onClick={() => navigate(`/devices/${room.id}`)}
                >
                  <div className="room-card-content">
                    {room.name}
                  </div>
                  <button 
                    className="edit-room-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRoomToEditId(room.id);
                      setEditRoomName(room.name);
                      setEditRoomCamera(room.live_camera || '');
                      setShowEditRoomModal(true);
                    }}
                    title="Edit room"
                  >
                    ✎
                  </button>
                  <button 
                    className="delete-room-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Are you sure you want to delete ${room.name}? This will also delete all devices in it.`)) {
                        deleteRoom(room.id);
                      }
                    }}
                    title="Delete room"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Add Room Modal */}
        {showAddRoomModal && (
          <div className="modal-overlay">
            <div className="modal">
              <button className="modal-close" onClick={() => setShowAddRoomModal(false)}>×</button>
              <h2>Add New Room</h2>

              <select
                value={newRoomBuildingId}
                onChange={(e) => setNewRoomBuildingId(parseInt(e.target.value))}
              >
                <option value="" disabled>Select Building</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>

              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Room Name (e.g. EN205)"
              />

              <input
                type="text"
                value={newRoomCamera}
                onChange={(e) => setNewRoomCamera(e.target.value)}
                placeholder="Camera IP (e.g. 192.168.12)"
              />

              <div className="modal-buttons">
                <button className="cancel-btn" onClick={() => setShowAddRoomModal(false)}>Cancel</button>
                <button onClick={addRoom}>Add Room</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Room Modal */}
        {showEditRoomModal && (
          <div className="modal-overlay">
            <div className="modal">
              <button className="modal-close" onClick={() => setShowEditRoomModal(false)}>×</button>
              <h2>Edit Room</h2>

              <select
                value={roomToEditId || ''}
                onChange={(e) => {
                  const selectedId = parseInt(e.target.value);
                  setRoomToEditId(selectedId);

                  const room = rooms.find(r => r.id === selectedId);
                  if (room) {
                    setEditRoomName(room.name);
                    setEditRoomCamera(room.live_camera || '');
                  } else {
                    setEditRoomName('');
                    setEditRoomCamera('');
                  }
                }}
              >
                <option value="" disabled>Select Room</option>
                {rooms.map(room => (
                  <option key={room.id} value={room.id}>{room.name}</option>
                ))}
              </select>

              <input
                type="text"
                value={editRoomName}
                onChange={(e) => setEditRoomName(e.target.value)}
                placeholder="Room Name"
              />

              <input
                type="text"
                value={editRoomCamera}
                onChange={(e) => setEditRoomCamera(e.target.value)}
                placeholder="Camera IP"
              />

              <div className="modal-buttons">
                <button className="cancel-btn" onClick={() => setShowEditRoomModal(false)}>Cancel</button>
                <button onClick={handleUpdateRoom}>Update Room</button>
              </div>
            </div>
          </div>
        )}

        {/* Devices Modal */}
        {showDevicesModal && (
          <div className="modal-overlay" onClick={closeDevicesModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={closeDevicesModal}>×</button>
              <h2>Devices in {selectedRoom?.name}</h2>
              <ul>
                {devices.map(device => (
                  <li key={device.id}>{device.name}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
  );
};

export default BuildingNavigation;
