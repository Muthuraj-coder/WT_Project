const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollno: { type: String, required: true },
  leaveType: { type: String, required: true }, // e.g., 'Sick', 'Casual', 'On Duty'
  reason: { type: String, required: true },
  description: { type: String },
  proof: { type: String }, // file path or URL
  status: {
    type: String,
    enum: ["applied", "pending", "confirmed", "rejected"],
    default: "applied"
  },
  appliedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  date: { type: String, required: true }, // Start date (YYYY-MM-DD)
  endDate: { type: String }, // Optional end date for multi-day
});

const Leave = mongoose.model("Leave", leaveSchema);
module.exports = Leave; 