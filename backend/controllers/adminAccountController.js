import Admin from "../models/Admin.js";
import User from "../models/User.js";
import Owner from "../models/Owner.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ============================================================
// LIST ALL ADMINS
// ============================================================
export const listAdmins = async (req, res) => {
  try {
    const { status, role, search } = req.query;
    
    const query = {};
    
    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;
    if (role) query.role = role;
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    
    const admins = await Admin.find(query)
      .select("-password")
      .sort({ createdAt: -1 });
    
    res.json({ admins });
  } catch (err) {
    console.error("List admins error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// CREATE ADMIN (Super Admin only)
// ============================================================
export const createAdmin = async (req, res) => {
  try {
    const { fullName, email, password, role = "admin" } = req.body;
    
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }
    
    if (!["admin", "support"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    
    const exists = await Admin.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already in use" });
    }
    
    const hashed = await bcrypt.hash(password, 10);
    
    const admin = await Admin.create({
      fullName,
      email,
      password: hashed,
      role,
      isActive: true,
    });
    
    res.status(201).json({
      message: "Admin created successfully",
      admin: {
        _id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
      },
    });
  } catch (err) {
    console.error("Create admin error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// UPDATE ADMIN ROLE
// ============================================================
export const updateAdminRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!["admin", "support"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    
    const admin = await Admin.findById(req.params.id);
    
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    
    // Cannot demote super_admin
    if (admin.role === "super_admin") {
      return res.status(403).json({ message: "Cannot change super_admin role" });
    }
    
    admin.role = role;
    await admin.save();
    
    res.json({
      message: "Admin role updated",
      admin: {
        _id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
      },
    });
  } catch (err) {
    console.error("Update admin role error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// ACTIVATE/DEACTIVATE ADMIN
// ============================================================
export const toggleAdminStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const admin = await Admin.findById(req.params.id);
    
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    
    // Cannot deactivate super_admin
    if (admin.role === "super_admin" && !isActive) {
      return res.status(403).json({ message: "Cannot deactivate super_admin" });
    }
    
    admin.isActive = isActive;
    await admin.save();
    
    res.json({
      message: `Admin ${isActive ? "activated" : "deactivated"}`,
      admin: {
        _id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
      },
    });
  } catch (err) {
    console.error("Toggle admin status error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// RESET ADMIN PASSWORD
// ============================================================
export const resetAdminPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    
    const admin = await Admin.findById(req.params.id);
    
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    
    const hashed = await bcrypt.hash(newPassword, 10);
    admin.password = hashed;
    await admin.save();
    
    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset admin password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// UPDATE OWN ACCOUNT (Super Admin)
// ============================================================
export const updateOwnAccount = async (req, res) => {
  try {
    const { email, newPassword, currentPassword } = req.body;
    
    const admin = await Admin.findById(req.admin._id);
    
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    
    // Verify current password
    const match = await bcrypt.compare(currentPassword, admin.password);
    if (!match) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    
    // Update email if provided
    if (email && email !== admin.email) {
      const exists = await Admin.findOne({ email, _id: { $ne: admin._id } });
      if (exists) {
        return res.status(400).json({ message: "Email already in use" });
      }
      admin.email = email;
    }
    
    // Update password if provided
    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }
      admin.password = await bcrypt.hash(newPassword, 10);
    }
    
    await admin.save();
    
    // Generate new token with updated info
    const token = jwt.sign(
      { adminId: admin._id, id: admin._id, role: admin.role, type: "admin" },
      process.env.JWT_SECRET || "jwtsecret",
      { expiresIn: "7d" }
    );
    
    res.json({
      message: "Account updated successfully",
      token,
      admin: {
        _id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error("Update own account error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// CREATE USER ACCOUNT (From Admin Dashboard)
// ============================================================
export const createUserAccount = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password required" });
    }
    
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already registered" });
    }
    
    const hashed = await bcrypt.hash(password, 10);
    
    const user = await User.create({
      name,
      email,
      password: hashed,
      phone: phone || "",
      role: "user",
      isActive: true,
    });
    
    res.status(201).json({
      message: "User created successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// CREATE OWNER ACCOUNT (From Admin Dashboard)
// ============================================================
export const createOwnerAccount = async (req, res) => {
  try {
    const { fullName, email, password, businessName, phone, status = "pending" } = req.body;
    
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Name, email and password required" });
    }
    
    const exists = await Owner.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already registered" });
    }
    
    const hashed = await bcrypt.hash(password, 10);
    
    const owner = await Owner.create({
      fullName,
      email,
      password: hashed,
      businessName: businessName || fullName,
      phone: phone || "",
      status: ["pending", "approved", "rejected"].includes(status) ? status : "pending",
    });
    
    res.status(201).json({
      message: "Owner created successfully",
      owner: {
        _id: owner._id,
        fullName: owner.fullName,
        email: owner.email,
        businessName: owner.businessName,
        status: owner.status,
      },
    });
  } catch (err) {
    console.error("Create owner error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

