import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

import PopularSports from "../components/PopularSports";


export default function Home() {
  const navigate = useNavigate();

  const [sport, setSport] = useState("Football");
  const [city, setCity] = useState("Beirut");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("08:00");

  const cities = [
    {
      name: "Beirut",
      courts: 150,
      img: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=60",
    },
    {
      name: "Tripoli",
      courts: 45,
      img: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=800&q=60",
    },
    {
      name: "Sidon",
      courts: 38,
      img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=60",
    },
    {
      name: "Jounieh",
      courts: 52,
      img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=60",
    },
    {
      name: "Byblos",
      courts: 28,
      img: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=60",
    },
    {
      name: "Zahle",
      courts: 32,
      img: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=60",
    },
  ];

  // 🔥 Handle search → go to Discover page
  const handleSearch = () => {
    if (!date) {
      alert("Please select a date.");
      return;
    }

    navigate(
      `/discover?sport=${sport}&city=${city}&date=${date}&time=${time}`
    );
  };

  return (
    <div className="home-page">
      {/* HERO SECTION */}
      <div className="hero">
        <img
          src="https://cdn.pixabay.com/photo/2016/05/27/14/33/football-1419954_960_720.jpg"
          className="hero-img"
          alt="Football Field"
        />

        <div className="hero-content">
          <h1>Book Sports Courts Across Lebanon</h1>
          <p>Football, padel, basketball, tennis and more – all in one place.</p>

          {/* SEARCH BOX */}
          <div className="search-box">
            <select value={sport} onChange={(e) => setSport(e.target.value)}>
              <option>Football</option>
              <option>Basketball</option>
              <option>Tennis</option>
              <option>Padel</option>
              <option>Volleyball</option>
              <option>Swimming</option>
            </select>

            <select value={city} onChange={(e) => setCity(e.target.value)}>
              <option>Beirut</option>
              <option>Tripoli</option>
              <option>Sidon</option>
              <option>Jounieh</option>
              <option>Byblos</option>
              <option>Zahle</option>
            </select>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            <select value={time} onChange={(e) => setTime(e.target.value)}>
              <option>08:00</option>
              <option>09:00</option>
              <option>10:00</option>
              <option>11:00</option>
              <option>12:00</option>
              <option>13:00</option>
              <option>14:00</option>
              <option>15:00</option>
              <option>16:00</option>
              <option>17:00</option>
              <option>18:00</option>
            </select>

            <button className="find-btn" onClick={handleSearch}>
              Find Courts
            </button>
          </div>
        </div>
      </div>

      {/* POPULAR SPORTS */}
      <PopularSports />

      {/* TOP CITIES */}
      <h2 className="section-title">Top Cities</h2>
      <p className="section-sub">
        Find courts in your favorite Lebanese cities
      </p>

      <div className="city-grid">
        {cities.map((c, i) => (
          <div className="city-card" key={i}>
            <img src={c.img} alt={c.name} />
            <div className="city-info">
              <h3>{c.name}</h3>
              <p>{c.courts} courts</p>
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <footer className="footer">© 2025 Sport Lebanon. All rights reserved.</footer>
    </div>
  );
}
