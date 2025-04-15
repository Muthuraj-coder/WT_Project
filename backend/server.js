const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Attendance = require("./models/Attendance");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/tracktendance";
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

const departmentMap = {
  CSR: "Computer Science and Engineering (CSE)",
  ITR: "Information Technology (IT)",
  CDR: "Computer Science and Design (CSD)",
  ECR: "Electronics and Communication Engineering (ECE)",
  MTR: "Mechatronics",
  ALR: "Artificial Intelligence and Data Science",
};

// ✅ Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully!"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

// ✅ Authentication Middleware
const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized - No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized - Invalid token" });
  }
};

// ✅ Login Route (Admin & Student)
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "1h" });
      return res.status(200).json({ message: "Login successful", token, role: "admin" });
    }

    const student = await User.findOne({ email });
    if (!student || password !== student.rollno) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: student._id, name: student.name, rollno: student.rollno, role: "student" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({ message: "Login successful", token, role: "student" });

  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// ✅ Admin: Add Student
app.post("/api/admin/add-student", authenticateUser, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden - Admins only" });
  }

  try {
    const { name, email, rollno } = req.body;
    if (!name || !email || !rollno) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingStudent = await User.findOne({ rollno });
    if (existingStudent) {
      return res.status(400).json({ error: "Student already exists" });
    }

    const newStudent = new User({ name, email, rollno, password: rollno, role: "student" });
    await newStudent.save();

    res.status(201).json({ message: "Student added successfully" });
  } catch (err) {
    console.error("❌ Error adding student:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Student: Mark Attendance
app.post("/api/mark-attendance", authenticateUser, async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ error: "Forbidden - Students only" });
  }

  try {
    const { name, rollno } = req.user;
    const today = new Date().toISOString().split("T")[0];

    const existingAttendance = await Attendance.findOne({ rollno, date: today });
    if (existingAttendance) {
      return res.status(400).json({ error: "Attendance already marked for today" });
    }

    const newAttendance = new Attendance({ name, rollno, status: "Present", date: today });
    await newAttendance.save();

    res.status(201).json({ message: "Attendance marked successfully" });
  } catch (err) {
    console.error("❌ Attendance Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/stats", authenticateUser, async (req, res) => {
  try {
    console.log("📡 Fetching Stats for:", req.user);

    const selectedDate = req.query.date || new Date().toISOString().split("T")[0];

    // ✅ Fetch total students
    const totalStudents = await User.countDocuments({ role: "student" });

    // ✅ Fetch unique presentees for the selected date
    const presentees = await Attendance.distinct("rollno", {
      date: selectedDate,
      status: "Present",
    });

    const presenteesCount = presentees.length;
    const absentees = totalStudents - presenteesCount;

    // ✅ Fetch students grouped by department
    const studentsByDept = await User.aggregate([
      { $group: { _id: { $substrCP: ["$rollno", 2, 3] }, count: { $sum: 1 } } }
    ]);

    // ✅ Fetch presentees grouped by department
    const presenteesByDept = await Attendance.aggregate([
      { $match: { date: selectedDate, status: "Present" } },
      { $lookup: { from: "users", localField: "rollno", foreignField: "rollno", as: "student" } },
      { $unwind: "$student" },
      { $group: { _id: { $substrCP: ["$student.rollno", 2, 3] }, count: { $sum: 1 } } }
    ]);

    const departmentStats = {};
    studentsByDept.forEach((dept) => {
      const deptName = departmentMap[dept._id] || `Unknown (${dept._id})`;
      departmentStats[deptName] = {
        total: dept.count,
        presentees: 0,
        absentees: dept.count,
        percentage: "0.00",
      };
    });

    presenteesByDept.forEach((dept) => {
      const deptName = departmentMap[dept._id] || `Unknown (${dept._id})`;
      if (departmentStats[deptName]) {
        departmentStats[deptName].presentees = dept.count;
        departmentStats[deptName].absentees = departmentStats[deptName].total - dept.count;
        departmentStats[deptName].percentage = ((dept.count / departmentStats[deptName].total) * 100).toFixed(2);
      }
    });

    console.log("✅ Attendance Stats for Date:", selectedDate, { totalStudents, presenteesCount, absentees, departmentStats });
    res.json({ totalStudents, presentees: presenteesCount, absentees, departmentStats });

  } catch (err) {
    console.error("❌ Error fetching stats:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



app.get("/api/students-by-department", authenticateUser, async (req, res) => {
  try {
    const students = await User.find({ role: "student" });

    const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD
    const studentsWithAttendance = await Promise.all(
      students.map(async (student) => {
        const attendance = await Attendance.findOne({
          rollno: student.rollno,
          date: today,
        });

        return {
          name: student.name,
          rollno: student.rollno,
          status: attendance ? "✅ Present" : "❌ Absent",
        };
      })
    );

    const studentsByDept = {};
    studentsWithAttendance.forEach((student) => {
      const deptCode = student.rollno.substring(2, 5); // Extract department code
      const deptName = departmentMap[deptCode] || `Unknown (${deptCode})`;

      if (!studentsByDept[deptName]) studentsByDept[deptName] = [];
      studentsByDept[deptName].push(student);
    });

    console.log("📊 Students By Department with Attendance:", studentsByDept);
    res.json(studentsByDept);
  } catch (err) {
    console.error("❌ Error fetching students by department:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});




// ✅ Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
