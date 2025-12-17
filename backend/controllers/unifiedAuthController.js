import User from "../models/User.js";
import Owner from "../models/Owner.js";
import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ============================================================
// UNIFIED LOGIN - Single endpoint for all roles
// ============================================================
export const unifiedLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Try to find user in each collection
    // Priority: Admin > Owner > User

    // 1. Check Admin collection first
    const admin = await Admin.findOne({ email });
    if (admin) {
      if (!admin.isActive) {
        return res.status(403).json({ message: "Account is deactivated" });
      }

      const match = await bcrypt.compare(password, admin.password);
      if (!match) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      // Update last login
      admin.lastLogin = new Date();
      await admin.save();

      // Use adminId to be compatible with admin middleware
      const token = jwt.sign(
        { adminId: admin._id, id: admin._id, role: admin.role, type: "admin" },
        process.env.JWT_SECRET || "jwtsecret",
        { expiresIn: "7d" }
      );

      return res.json({
        message: "Login successful",
        token,
        role: admin.role, // "admin" or "super_admin"
        user: {
          _id: admin._id,
          fullName: admin.fullName,
          email: admin.email,
          role: admin.role,
        },
      });
    }

    // 2. Check Owner collection
    const owner = await Owner.findOne({ email });
    if (owner) {
      // Check password first
      const match = await bcrypt.compare(password, owner.password);
      if (!match) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      // Normalize status - trim whitespace and convert to lowercase for comparison
      const ownerStatus = (owner.status || "").trim().toLowerCase();

      // Check status - CRITICAL: Only allow approved or pending owners
      if (ownerStatus === "suspended") {
        return res.status(403).json({ 
          message: "Your account has been suspended. Please contact support.",
          status: "suspended"
        });
      }

      if (ownerStatus === "rejected") {
        return res.status(403).json({ 
          message: "Your account application was rejected. Please contact support.",
          status: "rejected"
        });
      }

      // Allow login for "approved" and "pending" statuses (case-insensitive)
      // "pending" owners will be redirected to pending page by frontend
      if (ownerStatus !== "approved" && ownerStatus !== "pending" && ownerStatus !== "pending_review") {
        return res.status(403).json({ 
          message: "Your account is not approved. Please contact support.",
          status: owner.status
        });
      }

      const token = jwt.sign(
        { id: owner._id, role: "owner", type: "owner" },
        process.env.JWT_SECRET || "jwtsecret",
        { expiresIn: "7d" }
      );

      return res.json({
        message: "Login successful",
        token,
        role: "owner",
        user: {
          _id: owner._id,
          fullName: owner.fullName,
          email: owner.email,
          businessName: owner.businessName,
          status: ownerStatus, // Return normalized (lowercase) status for frontend consistency
        },
      });
    }

    // 3. Check User collection
    const user = await User.findOne({ email });
    if (user) {
      if (!user.isActive) {
        return res.status(403).json({ message: "Account is deactivated" });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      const token = jwt.sign(
        { id: user._id, role: "user", type: "user" },
        process.env.JWT_SECRET || "jwtsecret",
        { expiresIn: "7d" }
      );

      return res.json({
        message: "Login successful",
        token,
        role: "user",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
      });
    }

    // No user found in any collection
    return res.status(400).json({ message: "Invalid email or password" });

  } catch (err) {
    console.error("Unified login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// GET CURRENT USER (ME) - Single source of truth for auth state
// ============================================================
export const getCurrentUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }
    
    const token = authHeader.split(" ")[1];
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "jwtsecret");
    
    // Get expected role from query param or header (sent by frontend)
    const expectedRole = (req.query.expectedRole || req.headers["x-expected-role"] || "").toLowerCase();
    
    // Determine user type from token - check both 'type' and 'role' fields
    // PRIORITY: expectedRole > token.type > token.role
    const tokenType = expectedRole || decoded.type || decoded.role;
    const userId = decoded.id || decoded.adminId;
    
    // Find user based on type - STRICT matching to prevent role confusion
    let user = null;

    // 1. Check Admin collection
    if (tokenType === "admin" || tokenType === "super_admin") {
      user = await Admin.findById(userId).select("-password");
      if (user && user.isActive) {
        return res.json({
          id: user._id,
          name: user.fullName,
          email: user.email,
          role: user.role, // Get actual role from DB
          permissions: {},
        });
      }
      // If expected role was admin but user not found, return error immediately
      if (expectedRole === "admin" || expectedRole === "super_admin") {
        return res.status(401).json({ message: "Invalid token - admin not found" });
      }
    }
    
    // 2. Check Owner collection
    if (tokenType === "owner") {
      user = await Owner.findById(userId).select("-password");
      if (user) {
        return res.json({
          id: user._id,
          name: user.fullName,
          email: user.email,
          role: "owner",
          permissions: {},
        });
      }
      // If expected role was owner but user not found, return error immediately
      if (expectedRole === "owner") {
        return res.status(401).json({ message: "Invalid token - owner not found" });
      }
    }
    
    // 3. Check User collection
    if (tokenType === "user" || !tokenType) {
      user = await User.findById(userId).select("-password");
      if (user && user.isActive) {
        return res.json({
          id: user._id,
          name: user.name,
          email: user.email,
          role: "user",
          permissions: {},
        });
      }
      // If expected role was user but not found, return error
      if (expectedRole === "user") {
        return res.status(401).json({ message: "Invalid token - user not found" });
      }
    }
    
    // 4. FALLBACK: If no expected role and type is missing/wrong, try to find by ID
    // This handles legacy tokens without type field
    if (!user && !expectedRole) {
      // Try Admin first
      user = await Admin.findById(userId).select("-password");
      if (user && user.isActive) {
        return res.json({
          id: user._id,
          name: user.fullName,
          email: user.email,
          role: user.role,
          permissions: {},
        });
      }
      
      // Try Owner second
      user = await Owner.findById(userId).select("-password");
      if (user) {
        return res.json({
          id: user._id,
          name: user.fullName,
          email: user.email,
          role: "owner",
          permissions: {},
        });
      }
      
      // Try User last
      user = await User.findById(userId).select("-password");
      if (user && user.isActive) {
        return res.json({
          id: user._id,
          name: user.name,
          email: user.email,
          role: "user",
          permissions: {},
        });
      }
    }
    
    // No valid user found
    return res.status(401).json({ message: "Invalid token - user not found" });
  } catch (err) {
    console.error("Get current user error:", err);
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// VERIFY TOKEN - Check if token is valid and return user info
// ============================================================
export const verifyToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ valid: false, message: "No token provided" });
    }
    
    const token = authHeader.split(" ")[1];
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "jwtsecret");
    
    // Find user based on type
    let user = null;
    let role = decoded.role;

    if (decoded.type === "admin") {
      user = await Admin.findById(decoded.id).select("-password");
      if (!user || !user.isActive) {
        return res.status(401).json({ valid: false, message: "Invalid token" });
      }
      role = user.role; // Get actual role from DB
    } else if (decoded.type === "owner") {
      user = await Owner.findById(decoded.id).select("-password");
      if (!user) {
        return res.status(401).json({ valid: false, message: "Invalid token" });
      }
      role = "owner";
    } else {
      user = await User.findById(decoded.id).select("-password");
      if (!user || !user.isActive) {
        return res.status(401).json({ valid: false, message: "Invalid token" });
      }
      role = "user";
    }

    res.json({
      valid: true,
      role,
      user: {
        _id: user._id,
        name: user.name || user.fullName,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Verify token error:", err);
    res.status(401).json({ valid: false, message: "Invalid token" });
  }
};

