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

  useEffect(() => {
    fetchStudents();
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

  const addStudent = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "http://localhost:5001/api/admin/add-student",
        { name, email, rollno },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      alert("Student added successfully");
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.error || "Error adding student");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
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
    </div>
  );
};

export default AdminDashboard;