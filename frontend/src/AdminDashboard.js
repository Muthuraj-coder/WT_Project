import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./adminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [studentsByDepartment, setStudentsByDepartment] = useState({});
  const [selectedDept, setSelectedDept] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rollno, setRollno] = useState("");
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [selectedLeaveDept, setSelectedLeaveDept] = useState("");

  // Department mapping (should match backend)
  const departmentMap = {
    CSR: "Computer Science and Engineering (CSE)",
    ITR: "Information Technology (IT)",
    CDR: "Computer Science and Design (CSD)",
    ECR: "Electronics and Communication Engineering (ECE)",
    MTR: "Mechatronics",
    ALR: "Artificial Intelligence and Data Science",
  };

  useEffect(() => {
    fetchStudents();
    fetchLeaves();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get("http://localhost:5001/api/students-by-department", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      console.log("✅ Students API Response:", response.data);
      setStudentsByDepartment(response.data || {});
    } catch (err) {
      console.error("❌ Error fetching students:", err);
    }
  };

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5001/api/all-leaves", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setLeaves(res.data);
    } catch (err) {
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  const addStudent = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "http://localhost:5001/api/admin/add-student",
        { name, email, rollno },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      
      // Reset form fields
      setName("");
      setEmail("");
      setRollno("");
      
      // Show success message
      showMessage("Student added successfully", "success");
      
      // Refresh student list
      fetchStudents();
    } catch (err) {
      showMessage(err.response?.data?.error || "Error adding student", "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(
        `http://localhost:5001/api/leave-status/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      showMessage("Status updated successfully", "success");
      fetchLeaves();
    } catch (err) {
      showMessage("Failed to update status", "error");
    }
  };

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => navigate("/stats")}>
            <i className="fas fa-chart-bar"></i> View Stats
          </button>
          <button className="btn btn-logout" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </header>

      <div className="admin-content">
        <div className="card add-student-card">
          <div className="card-header">
            <h2>Add New Student</h2>
          </div>
          <div className="card-body">
            <form onSubmit={addStudent} className="add-student-form">
              <div className="form-group">
                <label htmlFor="name">Student Name</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Enter full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="rollno">Roll Number</label>
                <input
                  id="rollno"
                  type="text"
                  placeholder="Enter roll number"
                  value={rollno}
                  onChange={(e) => setRollno(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">
                <i className="fas fa-plus-circle"></i> Add Student
              </button>
            </form>
          </div>
        </div>

        <div className="card students-card">
          <div className="card-header">
            <h2>Student Records</h2>
            <div className="filter-section">
              <label htmlFor="dept-filter">Filter by Department:</label>
              <select
                id="dept-filter"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="">All Departments</option>
                {Object.keys(studentsByDepartment).map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="card-body">
            {Object.keys(studentsByDepartment).length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-users-slash"></i>
                <p>No students found</p>
              </div>
            ) : (
              <div className="departments-container">
                {Object.entries(studentsByDepartment)
                  .filter(([dept]) => selectedDept === "" || selectedDept === dept)
                  .map(([dept, students]) => (
                    <div key={dept} className="department-section">
                      <div className="department-header">
                        <h3>{dept}</h3>
                        <span className="student-count">{students.length} students</span>
                      </div>
                      <div className="students-list">
                        {students.map((student) => (
                          <div key={student.rollno} className="student-item">
                            <div className="student-info">
                              <span className="student-name">{student.name}</span>
                              <span className="student-roll">{student.rollno}</span>
                            </div>
                            <span className={`status-badge ${student.status.toLowerCase()}`}>
                              {student.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Leave/On Duty Requests Section */}
      <div className="leave-requests-section">
        <div className="card leave-requests-card">
          <div className="card-header">
            <h2>Leave / On Duty Requests</h2>
            <div className="filter-section" style={{ marginTop: 10 }}>
              <label htmlFor="leave-dept-filter">Filter by Department:</label>
              <select
                id="leave-dept-filter"
                value={selectedLeaveDept}
                onChange={e => setSelectedLeaveDept(e.target.value)}
              >
                <option value="">All Departments</option>
                {Object.keys(studentsByDepartment).map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="card-body">
            {message && <div className={`status-message ${messageType}`}>{message}</div>}
            
            {loading ? (
              <div className="loading-state">
                <i className="fas fa-spinner fa-pulse"></i>
                <p>Loading requests...</p>
              </div>
            ) : leaves.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-calendar-times"></i>
                <p>No leave requests found</p>
              </div>
            ) : (
              <div className="leaves-table-container">
                <table className="leaves-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Roll No</th>
                      <th>Type</th>
                      <th>Reason</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Proof</th>
                      <th>Applied At</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves
                      .filter((leave) => {
                        if (!selectedLeaveDept) return true;
                        const deptCode = leave.rollno?.substring(2, 5);
                        const deptName = departmentMap[deptCode] || `Unknown (${deptCode})`;
                        return deptName === selectedLeaveDept;
                      })
                      .map((leave) => (
                        <tr key={leave._id}>
                          <td>{leave.name}</td>
                          <td>{leave.rollno}</td>
                          <td>
                            <span className={`leave-type-badge ${leave.leaveType.toLowerCase()}`}>
                              {leave.leaveType}
                            </span>
                          </td>
                          <td>{leave.reason}</td>
                          <td className="description-cell" title={leave.description}>
                            {leave.description}
                          </td>
                          <td>
                            <span className={`status-badge ${leave.status.toLowerCase()}`}>
                              {leave.status}
                            </span>
                          </td>
                          <td>
                            {leave.proof ? (
                              <a 
                                href={`http://localhost:5001${leave.proof}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="proof-link"
                              >
                                <i className="fas fa-file-alt"></i> View
                              </a>
                            ) : (
                              <span className="no-proof">Not Available</span>
                            )}
                          </td>
                          <td>
                            <span className="date-time">
                              {new Date(leave.appliedAt).toLocaleString()}
                            </span>
                          </td>
                          <td>
                            <select 
                              className="status-select"
                              value={leave.status} 
                              onChange={(e) => updateStatus(leave._id, e.target.value)}
                            >
                              <option value="applied">Applied</option>
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="rejected">Rejected</option>
                            </select>
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
    </div>
  );
};

export default AdminDashboard;