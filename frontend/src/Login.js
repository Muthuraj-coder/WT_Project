import React, { useState } from "react";
import "./login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("https://wt-project-backend-ci10.onrender.com/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
      } else {
        localStorage.setItem("token", data.token);
        if (data.role === "admin") {
          window.location.href = "/admin-dashboard";
        } else {
          window.location.href = "/student-dashboard";
        }
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="login-container">
      {/* Decorative elements */}
      <div className="blob-1"></div>
      <div className="blob-2"></div>
      
      <div className="login-wrapper">
        {/* Left section with app info */}
        <div className="app-info">
          <div className="app-logo">
            <div className="logo-icon">
              <i className="fas fa-calendar-check"></i>
            </div>
            <h1 className="app-title">Tracktendance</h1>
          </div>
          <p className="app-description">
            Smart Attendance, Smarter Progress. Simplify attendance tracking 
            and gain valuable insights for better academic management.
          </p>
          <div className="app-features">
            <div className="app-feature">
              <i className="fas fa-check-circle"></i>
              <span>One-Click Attendance Marking</span>
            </div>
            <div className="app-feature">
              <i className="fas fa-chart-line"></i>
              <span>Real-time Attendance Analytics</span>
            </div>
            <div className="app-feature">
              <i className="fas fa-user-shield"></i>
              <span>Role-based Access Control</span>
            </div>
            <div className="app-feature">
              <i className="fas fa-chart-bar"></i>
              <span>Visual Department Reports</span>
            </div>
          </div>
        </div>

        {/* Right section with login form */}
        <div className="login-card">
          <h2 className="login-title">Login</h2>
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Password (Roll Number for Students)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="remember-me">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember">Remember me</label>
            </div>
            <button type="submit" className="login-button">
              Login
            </button>
          </form>
          {error && <p className="error-message">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default Login;