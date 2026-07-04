// src/components/AdminLogin.jsx
import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/auth-context";
import "./LoginStyles.css";
import API_BASE_URL from "../api.js";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
      const data = res.data;

      if (data.role !== "admin") {
        alert("Unauthorized access");
        setLoading(false);
        return;
      }

      login(data);
      navigate("/admin");
    } catch (err) {
      alert("Login failed. Please check your credentials.");
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <span className="login-role-badge admin">Admin Portal</span>
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
              placeholder="admin@gasma.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
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
              disabled={loading}
            />
          </div>
          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Signing in...
              </>
            ) : "Sign In"}
          </button>
        </form>

        <div className="login-footer">
          <Link to="/forgot-password" className="login-footer-link">Forgot your password?</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
