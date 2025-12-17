import SportType from "../models/SportType.js";

// ============================================================
// GET ALL SPORT TYPES (Admin)
// ============================================================
export const getSportTypes = async (req, res) => {
  try {
    const sportTypes = await SportType.find().sort({ sortOrder: 1, name: 1 });
    res.json({ sportTypes });
  } catch (err) {
    console.error("Get sport types error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// CREATE SPORT TYPE
// ============================================================
export const createSportType = async (req, res) => {
  try {
    const { name, icon, sortOrder } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const sportType = await SportType.create({
      name,
      slug,
      icon: icon || "",
      sortOrder: sortOrder || 0,
      isActive: true,
    });

    res.status(201).json({ message: "Sport type created", sportType });
  } catch (err) {
    console.error("Create sport type error:", err);
    if (err.code === 11000) {
      return res.status(400).json({ message: "Sport type already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// UPDATE SPORT TYPE
// ============================================================
export const updateSportType = async (req, res) => {
  try {
    const { name, icon, isActive, sortOrder } = req.body;

    const sportType = await SportType.findById(req.params.id);
    if (!sportType) {
      return res.status(404).json({ message: "Sport type not found" });
    }

    if (name && name !== sportType.name) {
      sportType.name = name;
      sportType.slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    }
    if (icon !== undefined) sportType.icon = icon;
    if (isActive !== undefined) sportType.isActive = isActive;
    if (sortOrder !== undefined) sportType.sortOrder = sortOrder;

    await sportType.save();

    res.json({ message: "Sport type updated", sportType });
  } catch (err) {
    console.error("Update sport type error:", err);
    if (err.code === 11000) {
      return res.status(400).json({ message: "Sport type name already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// DELETE SPORT TYPE (Soft delete - set inactive)
// ============================================================
export const deleteSportType = async (req, res) => {
  try {
    const sportType = await SportType.findById(req.params.id);
    if (!sportType) {
      return res.status(404).json({ message: "Sport type not found" });
    }

    // Soft delete - set inactive instead of removing
    sportType.isActive = false;
    await sportType.save();

    res.json({ message: "Sport type deleted" });
  } catch (err) {
    console.error("Delete sport type error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

