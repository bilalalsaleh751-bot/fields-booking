// backend/controllers/ownerController.js
import Owner from "../models/Owner.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ===============================
// STEP 1 - Register Basic Info
// ===============================
export const registerStep1 = async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    const exists = await Owner.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const owner = await Owner.create({
      fullName,
      email,
      phone,
      password: hashed,
      status: "incomplete",
    });

    return res.json({
      message: "Step 1 completed",
      ownerId: owner._id,
    });
  } catch (err) {
    console.error("Register Step 1 Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// STEP 2 - Business Details
// ===============================
export const registerStep2 = async (req, res) => {
  try {
    const ownerId = req.params.id;

    const updated = await Owner.findByIdAndUpdate(
      ownerId,
      {
        businessName: req.body.businessName,
        address: req.body.address,
        sportsType: req.body.sportsType,
        commercialRecord: req.body.commercialRecord,
      },
      { new: true }
    );

    return res.json({
      message: "Step 2 completed",
      owner: updated,
    });
  } catch (err) {
    console.error("Register Step 2 Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// STEP 3 - Upload Documents
// ===============================
export const registerStep3 = async (req, res) => {
  try {
    const ownerId = req.params.id;

    const idCard = req.files["idCard"]?.[0]?.path || "";
    const businessProof = req.files["businessProof"]?.[0]?.path || "";

    const updated = await Owner.findByIdAndUpdate(
      ownerId,
      {
        idCardUrl: idCard,
        businessProofUrl: businessProof,
        status: "pending_review",
      },
      { new: true }
    );

    return res.json({
      message: "Documents uploaded",
      owner: updated,
    });
  } catch (err) {
    console.error("Register Step 3 Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// LOGIN
// ===============================
export const ownerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const owner = await Owner.findOne({ email });
    if (!owner) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, owner.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const cleanStatus = (owner.status || "").trim();

    // STATUS HANDLING — Same as PDR
    if (cleanStatus === "pending_review") {
      return res.json({ status: "pending" });
    }

    if (cleanStatus === "rejected") {
      return res.json({ status: "rejected" });
    }

    if (cleanStatus !== "approved") {
      return res.json({ status: "not_approved" });
    }

    // APPROVED → return token + owner info
    const token = jwt.sign({ id: owner._id }, process.env.JWT_SECRET || "jwtsecret", {
      expiresIn: "7d",
    });

    return res.json({
      status: "approved",
      token,
      owner: {
        _id: owner._id,              // 🔥 أهم سطر — dashboard يحتاجه
        fullName: owner.fullName,
        email: owner.email,
        phone: owner.phone,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
