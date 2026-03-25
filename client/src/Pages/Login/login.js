import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../Home/Home.css";
import { useAuth } from "../../AuthContext";

const Login = () => {
  const { fetchUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:5000/login",
        { email, password },
        { withCredentials: true }
      );

      if (response.status === 200) {
        await fetchUser(); 
        navigate("/dashboard");
      }
    } catch (error) {
      if (error.response?.status === 400) {
        alert("Credenziali non valide.");
      } else {
        alert("Errore del server.");
      }
    }
  };

  return (
    <div className="Home">
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <label className="label" htmlFor="email">Email:</label>
        <input
          className="input"
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label className="label" htmlFor="password">Password:</label>
        <input
          className="input"
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="button">Login</button>
      </form>
    </div>
  );
};

export default Login;