import React, { useState } from 'react';
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

const BuildingNavbar = () => (
  <nav className="building-navbar">
    <Link to="/building-en" className="active">EN</Link>
    <Link to="/building-tyk">TYK</Link>
    <Link to="/building-lct">LCT</Link>
    <Link to="/building-admin">Admin</Link>
    <Link to="/building-old-academic">Old Academic</Link>
  </nav>
);

const ENBuilding = () => {
  const initialRooms = ['EN401', 'EN402', 'EN403', 'EN404', 'EN405'];

  // State to manage the list of rooms and the selected sort option
  const [rooms, setRooms] = useState(initialRooms);
  const [sortOption, setSortOption] = useState('az');

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
                <button onClick={() => (window.location.href = '/add')}>Add</button>
                <button onClick={() => (window.location.href = '/edit')}>Edit</button>
              </div>
            </div>
          </div>

          <div className="rooms-grid" id="roomsGrid">
            {rooms.map((room) => (
              <div key={room} className="room-card" onClick={() => selectRoom(room)}>
                {room}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ENBuilding;
