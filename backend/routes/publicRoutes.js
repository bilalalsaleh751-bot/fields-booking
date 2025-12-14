import express from "express";
import CMSBanner from "../models/CMSBanner.js";
import FAQ from "../models/FAQ.js";
import Category from "../models/Category.js";
import City from "../models/City.js";
import HomepageContent from "../models/HomepageContent.js";
import FooterContent from "../models/FooterContent.js";
import PlatformSettings from "../models/PlatformSettings.js";

const router = express.Router();

// ============================================================
// PUBLIC CMS ENDPOINTS (No auth required)
// ============================================================

// Get complete homepage data (single request for all homepage content)
router.get("/homepage", async (req, res) => {
  try {
    const [content, banners, categories, settings] = await Promise.all([
      HomepageContent.getContent(),
      CMSBanner.find({
        isActive: true,
        $or: [
          { startDate: { $lte: new Date() }, endDate: { $gte: new Date() } },
          { startDate: null, endDate: null },
          { startDate: { $lte: new Date() }, endDate: null },
          { startDate: null, endDate: { $gte: new Date() } },
        ],
      }).sort({ sortOrder: 1 }),
      Category.find({ isActive: true }).sort({ sortOrder: 1 }).limit(8),
      PlatformSettings.getSettings(),
    ]);
    
    res.json({
      content,
      banners,
      categories,
      platformName: settings.platformName,
    });
  } catch (err) {
    console.error("Get homepage error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get footer content
router.get("/footer", async (req, res) => {
  try {
    const [content, settings] = await Promise.all([
      FooterContent.getContent(),
      PlatformSettings.getSettings(),
    ]);
    
    res.json({
      content,
      platformName: settings.platformName,
      supportEmail: settings.supportEmail,
      supportPhone: settings.supportPhone,
    });
  } catch (err) {
    console.error("Get footer error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get active banners
router.get("/banners", async (req, res) => {
  try {
    const now = new Date();
    const banners = await CMSBanner.find({
      isActive: true,
      $or: [
        { startDate: { $lte: now }, endDate: { $gte: now } },
        { startDate: null, endDate: null },
        { startDate: { $lte: now }, endDate: null },
        { startDate: null, endDate: { $gte: now } },
      ],
    }).sort({ sortOrder: 1 });
    
    res.json({ banners });
  } catch (err) {
    console.error("Get public banners error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get active FAQs
router.get("/faqs", async (req, res) => {
  try {
    const { category } = req.query;
    const query = { isActive: true };
    if (category) query.category = category;
    
    const faqs = await FAQ.find(query).sort({ category: 1, sortOrder: 1 });
    res.json({ faqs });
  } catch (err) {
    console.error("Get public FAQs error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get active categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1 });
    res.json({ categories });
  } catch (err) {
    console.error("Get public categories error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get cities with areas
router.get("/cities", async (req, res) => {
  try {
    const cities = await City.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
    res.json({ cities });
  } catch (err) {
    console.error("Get public cities error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

