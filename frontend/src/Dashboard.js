import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove token from storage
    localStorage.removeItem("user");
    navigate("/login"); // Redirect to login page
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={() => navigate("/mark-attendance")}>Mark Attendance</button>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Dashboard;
