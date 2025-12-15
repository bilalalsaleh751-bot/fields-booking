import express from "express";
import { unifiedLogin, verifyToken } from "../controllers/unifiedAuthController.js";

const router = express.Router();

// Unified login for all roles
router.post("/login", unifiedLogin);

// Verify token
router.get("/verify", verifyToken);

export default router;

