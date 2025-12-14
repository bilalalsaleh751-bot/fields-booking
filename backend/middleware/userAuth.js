import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Protect user routes - requires valid user token
export const protectUser = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized - no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "jwtsecret");

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("User auth error:", err);
    return res.status(401).json({ message: "Not authorized - invalid token" });
  }
};

