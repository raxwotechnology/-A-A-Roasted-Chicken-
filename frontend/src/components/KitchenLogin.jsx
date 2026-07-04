// src/components/KitchenLogin.jsx
import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/auth-context";
import "./LoginStyles.css";
import API_BASE_URL from "../api.js";

const KitchenLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });
      const data = res.data;

      if (data.role !== "kitchen") {
        alert("Unauthorized access");
        return;
      }

      login(data);
      navigate("/kitchen");
    } catch (err) {
      alert("Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <span className="login-role-badge kitchen">Kitchen Portal</span>
          <h2 className="login-title">Sign In</h2>
        </div>

        <div className="login-divider" />

        <form onSubmit={handleLogin} className="login-form">
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              id="email"
              placeholder="kitchen@gasma.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-submit-btn">Sign In</button>
        </form>

        <div className="login-footer">
          <p className="login-footer-text">Don't have an account?{" "}
            <Link to="/signup?role=kitchen" className="login-footer-link">Sign Up</Link>
          </p>
          <Link to="/forgot-password" className="login-footer-link">Forgot your password?</Link>
        </div>
      </div>
    </div>
  );
};

export default KitchenLogin;
