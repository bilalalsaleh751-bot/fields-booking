import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    
    role: {
      type: String,
      enum: ["super_admin", "admin", "support"],
      default: "admin",
    },
    
    isActive: { type: Boolean, default: true },
    
    lastLogin: { type: Date },
    
    // Profile
    avatar: String,
    phone: String,
  },
  { timestamps: true }
);

const Admin = mongoose.model("Admin", AdminSchema);
export default Admin;

