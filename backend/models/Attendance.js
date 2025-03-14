const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollno: { type: String, required: true },
  status: { type: String, default: "Absent" },
  date: { type: String, required: true } // Store only YYYY-MM-DD
});

const Attendance = mongoose.model("Attendance", attendanceSchema);
module.exports = Attendance;
