import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './App.css';

const Sidebar = () => (
  <div className="sidebar">
    <h2>UEcoManage</h2>
    <Link to="/Dashboard">Dashboard</Link>
    <Link to="/building-en" className="active">EN Building</Link>
    <Link to="/room">Room</Link>
  </div>
);

const BuildingNavbar = () => {
  const [buildings, setBuildings] = useState([]);
  const [activeBuilding, setActiveBuilding] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/buildings")
      .then((response) => response.json())
      .then((data) => {
        console.log("Fetched Buildings:", data); // Debugging line
        setBuildings(data);
      })
      .catch((error) => console.error("Error fetching buildings:", error));
  }, []);

  return (
    <nav className="building-navbar">
      {buildings.map((building) => (
        <Link
          key={building.name}
          to={building.path}
          className={activeBuilding === building.name ? "active" : ""}
          onClick={() => setActiveBuilding(building.name)}
        >
          {building.name}
        </Link>
      ))}
    </nav>
  );
};

const ENBuilding = () => {

  // State to manage the list of rooms and the selected sort option
  const [rooms, setRooms] = useState([]);
  const [sortOption, setSortOption] = useState('az');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  const [newCamera, setNewCamera] = useState("");  // ← state for live_camera

    // Fetch rooms from the backend
    useEffect(() => {
      fetch("http://localhost:5000/api/rooms/EN")
        .then((response) => response.json())
        .then((data) => {
          // Sort the rooms alphabetically initially
          const sortedRooms = data.map((item) => item.name).sort();
          setRooms(sortedRooms);
        })
        .catch((error) => console.error("Error fetching rooms:", error));
    }, []);
    

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

  const selectRoom = (room) => {
    alert(`You selected ${room}`);
  };

  // Handle opening and closing the modal
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  // Handle adding a new room
  const handleAddRoom = () => {
    if (!newRoomName.trim() || !newCamera.trim()) {
      alert("Room name and camera cannot be empty");
      return;
    }

    fetch("http://localhost:5000/api/rooms/EN", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newRoomName,
        live_camera: newCamera
      })
    })
      .then(res => res.json().then(json => ({ status: res.status, body: json })))
      .then(({ status, body }) => {
        if (status === 201) {
          setRooms(prev => [...prev, newRoomName]);
          setNewRoomName("");
          setNewCamera("");
          toggleModal();
          alert("Room added!");
        } else {
          alert(body.error);
        }
      })
      .catch(err => {
        console.error(err);
        alert("Failed to add room");
      });
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main">
        <header>
          <h1>Energy Saver Admin</h1>
          <p style={{ color: '#475569', marginTop: '10px' }}>
            Monitor and manage energy usage across buildings with ease.
          </p>
        </header>

        <BuildingNavbar />

        <section className="rooms">
          <div className="rooms-header">
            <h2>Engineering Building Rooms</h2>
            <div className="controls-container">
              <div className="controls-left">
                <input type="text" id="roomSearch" placeholder="Search..." />
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
                <button onClick={toggleModal}>Add</button>
                <button onClick={() => (window.location.href = '/edit')}>Edit</button>
              </div>
            </div>
          </div>

          <div className="rooms-grid" id="roomsGrid">
            {rooms.map((room,index) => (
              <div key={index} className="room-card" onClick={() => selectRoom(room)}>
                {room}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Modal for adding a new room */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <button className="modal-close" onClick={toggleModal}>×</button>
            <h2>Add New Room</h2>
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="e.g EN205"
            />
            
            <input
              type="text"
              value={newCamera}
              onChange={(e) => setNewCamera(e.target.value)}
              placeholder="e.g 192.168.12"
            />
            <div className="modal-buttons">
              <button className="cancel-btn" onClick={toggleModal}>Cancel</button>
              <button onClick={handleAddRoom}>Add Room</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ENBuilding;
