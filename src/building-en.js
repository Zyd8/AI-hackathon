import React from 'react';
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
  const rooms = ['EN401', 'EN402', 'EN403', 'EN404', 'EN405'];

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
            <h2>Rooms</h2>
            <div className="room-controls">
              <input type="text" id="roomSearch" placeholder="Search..." />
              <select id="roomSort">
                <option value="az">A–Z</option>
                <option value="za">Z–A</option>
              </select>
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

        <section className="add-buttons">
          <button onClick={() => (window.location.href = '/add-device')}>Add Device</button>
          <button onClick={() => (window.location.href = '/add-room')}>Add Room</button>
        </section>
      </div>
    </div>
  );
};

export default ENBuilding;
