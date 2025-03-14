import React, { useState, useEffect } from "react";
import axios from "axios";

const MarkAttendance = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const handleMarkAttendance = async () => {
    if (!user) {
      alert("User not logged in!");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5001/api/mark-attendance", {
        name: user.name,
        rollno: user.rollno
      });

      alert(response.data.message);
    } catch (error) {
      alert(error.response?.data?.error || "Failed to mark attendance");
    }
  };

  return (
    <div>
      <h2>Mark Attendance</h2>
      {user ? (
        <div>
          <p>Name: {user.name}</p>
          <p>Roll No: {user.rollno}</p>
          <button onClick={handleMarkAttendance}>Mark Present</button>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default MarkAttendance;
