import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import { getAdminPermissions } from "../middleware/adminAuth.js";

// ============================================================
// ADMIN LOGIN
// ============================================================
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }
    
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    if (!admin.isActive) {
      return res.status(401).json({ message: "Account deactivated" });
    }
    
    const isMatch = await bcrypt.compare(password, admin.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Update last login
    admin.lastLogin = new Date();
    await admin.save();
    
    // Generate token
    const token = jwt.sign(
      { adminId: admin._id, role: admin.role },
      process.env.JWT_SECRET || "admin_secret_key",
      { expiresIn: "24h" }
    );
    
    res.json({
      message: "Login successful",
      token,
      admin: {
        _id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
        permissions: getAdminPermissions(admin.role),
      },
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// GET CURRENT ADMIN
// ============================================================
export const getAdminProfile = async (req, res) => {
  try {
    res.json({
      admin: {
        _id: req.admin._id,
        fullName: req.admin.fullName,
        email: req.admin.email,
        role: req.admin.role,
        permissions: getAdminPermissions(req.admin.role),
      },
    });
  } catch (err) {
    console.error("Get admin profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

