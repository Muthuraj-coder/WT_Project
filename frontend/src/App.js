import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import AdminDashboard from "./AdminDashboard";
import StudentDashboard from "./StudentDashboard";
import Stats from "./Stats";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;
