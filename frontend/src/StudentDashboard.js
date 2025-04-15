import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./studentDashboard.css";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  useEffect(() => {
    // Try to get user from localStorage first
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setStudent(parsedUser);
      } catch (error) {
        console.error("Error parsing user from localStorage:", error);
      }
    }

    // If no user in localStorage or parsing failed, fetch from token
    if (!student) {
      const token = localStorage.getItem("token");
      if (token) {
        // Extract user info from JWT token
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const tokenData = JSON.parse(window.atob(base64));
          
          // Set user data from token
          if (tokenData.name && tokenData.rollno) {
            setStudent({
              name: tokenData.name,
              rollno: tokenData.rollno
            });
            
            // Save to localStorage for future use
            localStorage.setItem("user", JSON.stringify({
              name: tokenData.name,
              rollno: tokenData.rollno
            }));
          } else {
            // If token doesn't have user data, fetch from backend
            fetchUserData(token);
          }
        } catch (error) {
          console.error("Error extracting user from token:", error);
          fetchUserData(token);
        }
      }
    }

    // Update clock
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch user data from backend if not available in localStorage or token
  const fetchUserData = async (token) => {
    try {
      const response = await axios.get(
        "http://localhost:5001/api/user-profile", 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data) {
        setStudent(response.data);
        localStorage.setItem("user", JSON.stringify(response.data));
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  };

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ ...notification, show: false });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const markAttendance = async () => {
    try {
      await axios.post(
        "http://localhost:5001/api/mark-attendance",
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setNotification({
        show: true,
        message: "Attendance marked successfully",
        type: "success"
      });
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Error marking attendance";
      setNotification({
        show: true,
        message: errorMsg,
        type: "error"
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const formatDate = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const closeNotification = () => {
    setNotification({ ...notification, show: false });
  };

  return (
    <div className="student-dashboard">
      {notification.show && (
        <div className={`notification-toast ${notification.type}`}>
          <div className="notification-content">
            <i className={`fas ${notification.type === "success" ? "fa-check-circle" : "fa-exclamation-circle"}`}></i>
            <span>{notification.message}</span>
          </div>
          <button className="notification-close" onClick={closeNotification}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      <div className="dashboard-sidebar">
        <div className="logo-container">
          <div className="logo">S</div>
          <h3>Student Portal</h3>
        </div>
        
        <div className="sidebar-menu">
          <div className="menu-item active">
            <i className="fas fa-home"></i>
            <span>Dashboard</span>
          </div>
          <div className="menu-item" onClick={() => navigate("/stats")}>
            <i className="fas fa-chart-bar"></i>
            <span>Statistics</span>
          </div>
        </div>
        
        <div className="sidebar-footer">
          <button className="logout-button" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
      
      <div className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-welcome">
            <h2>Student Dashboard</h2>
            <p className="date-display">{formatDate(currentTime)}</p>
          </div>
          
          <div className="header-info">
            <div className="time-display">
              <i className="far fa-clock"></i>
              <span>{formatTime(currentTime)}</span>
            </div>
            
            {student && (
              <div className="user-profile">
                <div className="profile-avatar">
                  {student.name ? student.name.charAt(0) : "S"}
                </div>
                <div className="profile-info">
                  <p className="profile-name">{student.name || "Student"}</p>
                  <p className="profile-id">{student.rollno || ""}</p>
                </div>
              </div>
            )}
          </div>
        </header>
        
        <div className="dashboard-content">
          <div className="welcome-card">
            <div className="welcome-message">
              <h3>Welcome back, {student?.name || "Student"}!</h3>
              <p>Track your attendance and academic progress</p>
            </div>
            <div className="attendance-action">
              <button className="attendance-button" onClick={markAttendance}>
                <i className="fas fa-check-circle"></i>
                <span>Mark Attendance</span>
              </button>
              <p className="attendance-note">Don't forget to mark your attendance daily</p>
            </div>
          </div>
          
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <div className="card-icon attendance">
                <i className="fas fa-user-check"></i>
              </div>
              <div className="card-content">
                <h4>Attendance</h4>
                <p className="card-value">85%</p>
                <p className="card-description">Your current attendance rate</p>
              </div>
            </div>
          </div>
          
          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <div className="actions-container">
              <button className="action-button" onClick={() => navigate("/stats")}>
                <i className="fas fa-chart-line"></i>
                <span>View Stats</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;