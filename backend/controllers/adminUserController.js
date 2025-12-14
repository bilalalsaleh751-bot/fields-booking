import User from "../models/User.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// ============================================================
// LIST ALL USERS
// ============================================================
export const listUsers = async (req, res) => {
  try {
    const { status, role, search, page = 1, limit = 20 } = req.query;
    
    const query = {};
    
    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;
    if (role) query.role = role;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);
    
    res.json({
      users,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("List users error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// GET USER BY ID
// ============================================================
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ user });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// UPDATE USER ROLE
// ============================================================
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!["user", "owner", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    user.role = role;
    await user.save();
    
    res.json({
      message: "User role updated",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    console.error("Update user role error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// ACTIVATE USER
// ============================================================
export const activateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    user.isActive = true;
    await user.save();
    
    res.json({
      message: "User activated",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    console.error("Activate user error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// DEACTIVATE USER
// ============================================================
export const deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    user.isActive = false;
    await user.save();
    
    res.json({
      message: "User deactivated",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    console.error("Deactivate user error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// RESET USER PASSWORD (Admin sets new password)
// ============================================================
export const resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();
    
    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// GENERATE PASSWORD RESET TOKEN
// ============================================================
export const generateResetToken = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Generate a random token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();
    
    // In a real app, this would send an email
    // For now, return the reset link
    const resetLink = `http://localhost:5176/reset-password/${resetToken}`;
    
    res.json({
      message: "Reset token generated",
      resetLink, // In production, this would be sent via email
      expiresAt: resetTokenExpiry,
    });
  } catch (err) {
    console.error("Generate reset token error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

