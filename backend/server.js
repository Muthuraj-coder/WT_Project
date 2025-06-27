const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Attendance = require("./models/Attendance");
const Leave = require("./models/Leave");
const multer = require("multer");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploads statically (must be before any authentication middleware)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://muthurajd23cse:Muthu4855@crud.ftlqkl0.mongodb.net/TracktendanceDB?retryWrites=true&w=majority&appName=CRUD";
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

// Set up storage for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Ensure uploads directory exists
const fs = require("fs");
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

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
        // Check for attendance record
        const attendance = await Attendance.findOne({
          rollno: student.rollno,
          date: today,
        });
        if (attendance) {
          return {
            name: student.name,
            rollno: student.rollno,
            status: "✅ Present",
          };
        }
        // Check for confirmed OD leave for today
        const odLeave = await Leave.findOne({
          rollno: student.rollno,
          leaveType: "On Duty",
          status: "confirmed",
          $or: [
            { date: today },
            { $and: [ { date: { $lte: today } }, { endDate: { $gte: today } } ] }
          ]
        });
        if (odLeave) {
          return {
            name: student.name,
            rollno: student.rollno,
            status: "✅ Present (OD)",
          };
        }
        // Otherwise, absent
        return {
          name: student.name,
          rollno: student.rollno,
          status: "❌ Absent",
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

// ✅ Student: Apply for Leave/OD (with file upload)
app.post("/api/apply-leave", authenticateUser, upload.single("proof"), async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ error: "Forbidden - Students only" });
  }
  try {
    const { leaveType, reason, description, date, endDate } = req.body;
    let proofUrl = "";
    if (req.file) {
      proofUrl = `/uploads/${req.file.filename}`;
    }
    if (!leaveType || !reason || !date || (leaveType === "On Duty" && !proofUrl)) {
      return res.status(400).json({ error: "All required fields must be filled" });
    }
    const leave = new Leave({
      name: req.user.name,
      rollno: req.user.rollno,
      leaveType,
      reason,
      description,
      proof: proofUrl,
      status: "applied",
      date,
      endDate: endDate || null
    });
    await leave.save();
    res.status(201).json({ message: "Leave/OD applied successfully", leave });
  } catch (err) {
    console.error("❌ Leave Apply Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Student: Get My Leaves/OD
app.get("/api/my-leaves", authenticateUser, async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ error: "Forbidden - Students only" });
  }
  try {
    const leaves = await Leave.find({ rollno: req.user.rollno }).sort({ appliedAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Admin: Get All Leaves/OD
app.get("/api/all-leaves", authenticateUser, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden - Admins only" });
  }
  try {
    const leaves = await Leave.find().sort({ appliedAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Admin: Update Leave/OD Status
app.patch("/api/leave-status/:id", authenticateUser, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden - Admins only" });
  }
  try {
    const { status } = req.body;
    if (!status || !["pending", "confirmed", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );
    if (!leave) return res.status(404).json({ error: "Leave not found" });

    // If any leave is confirmed, mark attendance for the date(s)
    if (status === "confirmed") {
      const start = new Date(leave.date);
      const end = leave.endDate ? new Date(leave.endDate) : start;
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        // Only create if not already present
        const existing = await Attendance.findOne({ rollno: leave.rollno, date: dateStr });
        if (!existing) {
          await new Attendance({
            name: leave.name,
            rollno: leave.rollno,
            status: "Present",
            date: dateStr
          }).save();
          console.log(`Leave Approved: Marked Present for ${leave.rollno} on ${dateStr}`);
        }
      }
    }
    res.json({ message: "Leave status updated", leave });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ User Profile Route
app.get("/api/user-profile", authenticateUser, async (req, res) => {
  try {
    if (req.user.role === "student") {
      const user = await User.findOne({ rollno: req.user.rollno });
      if (!user) return res.status(404).json({ error: "User not found" });
      return res.json({ name: user.name, rollno: user.rollno, email: user.email });
    } else if (req.user.role === "admin") {
      return res.json({ name: "Admin", role: "admin" });
    } else {
      return res.status(400).json({ error: "Invalid user role" });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));