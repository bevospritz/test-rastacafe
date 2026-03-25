// src/Login.js

import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../Home/Home.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:5000/login",
        {
          email: email,
          password: password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true, // ← aggiungi questa riga
        },
      );

      if (response.status === 200) {
        navigate("/dashboard");
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        alert("Invalid credentials");
      } else {
        alert("Server error");
      }
    }
  };

  return (
    <div className="Home">
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <label className="label" htmlFor="email">
          Email:
        </label>
        <input
          className="input"
          type="email"
          id="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label className="label" htmlFor="password">
          Password:
        </label>
        <input
          className="input"
          type="password"
          id="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="button">
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
