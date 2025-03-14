const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/ // Email pattern validation
  },
  rollno: { 
    type: String, 
    required: true, 
    unique: true, 
    match: /^[0-9]{2}[A-Z]{3}[0-9]{3}$/ // Example: "23CSR139"
  },
  password: { type: String, required: true }
});

const User = mongoose.model("User", userSchema);
module.exports = User;
