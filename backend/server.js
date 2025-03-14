const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
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

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected Successfully!"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

// Middleware for authentication
const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized - No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized - Invalid token" });
  }
};

app.post("/api/signup", async (req, res) => {
    try {
      const { name, email, rollno, password } = req.body;
      
      if (!name || !email || !rollno || !password) {
        return res.status(400).json({ error: "All fields are required" });
      }
  
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }
  
      // Hash Password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Save User
      const newUser = new User({ name, email, rollno, password: hashedPassword });
      await newUser.save();
  
      res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
      console.error("❌ Signup Error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  

  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "All fields are required" });
      }
  
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ error: "Invalid email or password" });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Invalid email or password" });
      }
  
      // Generate JWT Token
      const token = jwt.sign(
        { userId: user._id, email: user.email, name: user.name, rollno: user.rollno },
        JWT_SECRET,
        { expiresIn: "1h" }
      );
  
      res.status(200).json({ 
        message: "Login successful", 
        token, 
        user: { name: user.name, email: user.email, rollno: user.rollno } 
      });
    } catch (err) {
      console.error("❌ Login Error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  

  app.post("/api/mark-attendance", async (req, res) => {
    try {
      const { name, rollno } = req.body;
  
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0];
  
      // Check if the student already marked attendance today
      const existingAttendance = await Attendance.findOne({ rollno, date: today });
  
      if (existingAttendance) {
        return res.status(400).json({ error: "Attendance already marked for today" });
      }
  
      // Save attendance
      const newAttendance = new Attendance({
        name,
        rollno,
        status: "Present",
        date: today
      });
  
      await newAttendance.save();
      res.status(201).json({ message: "Attendance marked successfully" });
  
    } catch (err) {
      console.error("❌ Attendance Error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  
  

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
