import express from "express";
import { unifiedLogin, verifyToken, getCurrentUser } from "../controllers/unifiedAuthController.js";

const router = express.Router();

// Unified login for all roles
router.post("/login", unifiedLogin);

// Get current user (me) - Single source of truth
router.get("/me", getCurrentUser);

// Verify token
router.get("/verify", verifyToken);

export default router;

