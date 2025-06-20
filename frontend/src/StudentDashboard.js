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
    if (!student) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setStudent(parsedUser);
          return;
        } catch (error) {
          console.error("Error parsing user from localStorage:", error);
        }
      }

      const token = localStorage.getItem("token");
      if (token) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const tokenData = JSON.parse(window.atob(base64));
          if (tokenData.name && tokenData.rollno) {
            setStudent({
              name: tokenData.name,
              rollno: tokenData.rollno
            });
            localStorage.setItem("user", JSON.stringify({
              name: tokenData.name,
              rollno: tokenData.rollno
            }));
          } else {
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
    // Only run on mount
    // eslint-disable-next-line
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

  const LeaveApplication = () => {
    const [leaveType, setLeaveType] = useState("");
    const [reason, setReason] = useState("");
    const [description, setDescription] = useState("");
    const [proof, setProof] = useState(null);
    const [message, setMessage] = useState("");
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isMulti, setIsMulti] = useState(false);
    const [date, setDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
      fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5001/api/my-leaves", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setLeaves(res.data);
      } catch (err) {
        setLeaves([]);
      } finally {
        setLoading(false);
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!leaveType || !reason || !date || (leaveType === "On Duty" && !proof)) {
        setMessage("Please fill all required fields and upload proof for On Duty.");
        return;
      }
      const formData = new FormData();
      formData.append("leaveType", leaveType);
      formData.append("reason", reason);
      formData.append("description", description);
      formData.append("date", date);
      if (isMulti && endDate) formData.append("endDate", endDate);
      if (proof) {
        formData.append("proof", proof);
      }
      try {
        await axios.post(
          "http://localhost:5001/api/apply-leave",
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "multipart/form-data"
            }
          }
        );
        setMessage("Leave/OD applied successfully!");
        setLeaveType(""); setReason(""); setDescription(""); setProof(null); setDate(""); setEndDate(""); setIsMulti(false);
        fetchLeaves();
      } catch (err) {
        setMessage(err.response?.data?.error || "Failed to apply for leave/OD");
      }
    };

    return (
      <div className="leave-application-section">
        <div className="section-header">
          <h2>Apply for Leave / On Duty</h2>
          <p className="section-description">Submit your leave or on-duty requests</p>
        </div>
        
        <div className="leave-application-container">
          <div className="leave-form-card">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="leaveType">Leave Type <span className="required">*</span></label>
                <select 
                  id="leaveType"
                  value={leaveType} 
                  onChange={e => setLeaveType(e.target.value)} 
                  required
                  className="form-control"
                >
                  <option value="">Select Type</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Casual">Casual Leave</option>
                  <option value="On Duty">On Duty</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="reason">Reason <span className="required">*</span></label>
                <input 
                  id="reason"
                  type="text"
                  value={reason} 
                  onChange={e => setReason(e.target.value)} 
                  required
                  className="form-control"
                  placeholder="Brief reason for leave"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea 
                  id="description"
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  maxLength={500}
                  className="form-control"
                  placeholder="Additional details (optional)"
                  rows="3"
                />
              </div>
              
              <div className="form-group date-selection">
                <div className="date-type-selection">
                  <label>Day Selection</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input 
                        type="radio" 
                        checked={!isMulti} 
                        onChange={() => setIsMulti(false)} 
                        name="dateType"
                      /> 
                      <span>Single Day</span>
                    </label>
                    <label className="radio-label">
                      <input 
                        type="radio" 
                        checked={isMulti} 
                        onChange={() => setIsMulti(true)} 
                        name="dateType"
                      /> 
                      <span>Multiple Days</span>
                    </label>
                  </div>
                </div>
                
                <div className="date-inputs">
                  <div className="date-field">
                    <label htmlFor="startDate">From Date <span className="required">*</span></label>
                    <input 
                      id="startDate"
                      type="date" 
                      value={date} 
                      onChange={e => setDate(e.target.value)} 
                      required
                      className="form-control"
                    />
                  </div>
                  
                  {isMulti && (
                    <div className="date-field">
                      <label htmlFor="endDate">To Date <span className="required">*</span></label>
                      <input 
                        id="endDate"
                        type="date" 
                        value={endDate} 
                        onChange={e => setEndDate(e.target.value)} 
                        required={isMulti}
                        className="form-control"
                        min={date}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="proof">
                  Proof Document (PDF, max 100KB) 
                  {leaveType === "On Duty" && <span className="required">*</span>}
                </label>
                <input
                  id="proof"
                  type="file"
                  accept="application/pdf"
                  onChange={e => setProof(e.target.files[0])}
                  required={leaveType === "On Duty"}
                  className="form-control file-input"
                />
                <p className="file-help">Upload supporting documentation</p>
              </div>
              
              <div className="form-action">
                <button type="submit" className="submit-button">
                  <i className="fas fa-paper-plane"></i>
                  Submit Application
                </button>
              </div>
            </form>
            
            {message && (
              <div className="form-message success-message">
                <i className="fas fa-check-circle"></i>
                <span>{message}</span>
              </div>
            )}
          </div>
          
          <div className="leave-history-card">
            <h3><i className="fas fa-history"></i> My Applications</h3>
            
            {loading ? (
              <div className="loading-indicator">
                <i className="fas fa-circle-notch fa-spin"></i>
                <span>Loading applications...</span>
              </div>
            ) : leaves.length === 0 ? (
              <div className="no-data-message">
                <i className="fas fa-info-circle"></i>
                <p>No leave applications found</p>
              </div>
            ) : (
              <div className="leave-table-container">
                <table className="leave-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Date(s)</th>
                      <th>Proof</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.map(leave => (
                      <tr key={leave._id}>
                        <td>
                          <span className={`leave-type ${leave.leaveType.toLowerCase()}`}>
                            {leave.leaveType}
                          </span>
                        </td>
                        <td>
                          <div className="leave-reason">
                            <p className="reason-text">{leave.reason}</p>
                            {leave.description && (
                              <span className="reason-tooltip" title={leave.description}>
                                <i className="fas fa-info-circle"></i>
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${leave.status.toLowerCase()}`}>
                            {leave.status}
                          </span>
                        </td>
                        <td>
                          {leave.endDate ? `${leave.date} to ${leave.endDate}` : leave.date}
                        </td>
                        <td>
                          {leave.proof ? (
                            <a href={`http://localhost:5001${leave.proof}`} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="proof-link">
                              <i className="fas fa-file-pdf"></i> View
                            </a>
                          ) : (
                            <span className="no-proof">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
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
          
          <LeaveApplication />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;