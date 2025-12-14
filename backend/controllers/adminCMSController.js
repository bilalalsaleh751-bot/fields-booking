import CMSBanner from "../models/CMSBanner.js";
import FAQ from "../models/FAQ.js";
import Category from "../models/Category.js";
import PromoCode from "../models/PromoCode.js";
import HomepageContent from "../models/HomepageContent.js";
import FooterContent from "../models/FooterContent.js";

// ============================================================
// BANNERS
// ============================================================
export const getBanners = async (req, res) => {
  try {
    const banners = await CMSBanner.find().sort({ sortOrder: 1, createdAt: -1 });
    res.json({ banners });
  } catch (err) {
    console.error("Get banners error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const createBanner = async (req, res) => {
  try {
    const banner = await CMSBanner.create(req.body);
    res.status(201).json({ message: "Banner created", banner });
  } catch (err) {
    console.error("Create banner error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateBanner = async (req, res) => {
  try {
    const banner = await CMSBanner.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }
    res.json({ message: "Banner updated", banner });
  } catch (err) {
    console.error("Update banner error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    const banner = await CMSBanner.findByIdAndDelete(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }
    res.json({ message: "Banner deleted" });
  } catch (err) {
    console.error("Delete banner error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// FAQS
// ============================================================
export const getFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find().sort({ category: 1, sortOrder: 1 });
    res.json({ faqs });
  } catch (err) {
    console.error("Get FAQs error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const createFAQ = async (req, res) => {
  try {
    const faq = await FAQ.create(req.body);
    res.status(201).json({ message: "FAQ created", faq });
  } catch (err) {
    console.error("Create FAQ error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateFAQ = async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!faq) {
      return res.status(404).json({ message: "FAQ not found" });
    }
    res.json({ message: "FAQ updated", faq });
  } catch (err) {
    console.error("Update FAQ error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteFAQ = async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id);
    if (!faq) {
      return res.status(404).json({ message: "FAQ not found" });
    }
    res.json({ message: "FAQ deleted" });
  } catch (err) {
    console.error("Delete FAQ error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// CATEGORIES
// ============================================================
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
    res.json({ categories });
  } catch (err) {
    console.error("Get categories error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const createCategory = async (req, res) => {
  try {
    // Generate slug if not provided
    if (!req.body.slug && req.body.name) {
      req.body.slug = req.body.name.toLowerCase().replace(/\s+/g, "-");
    }
    const category = await Category.create(req.body);
    res.status(201).json({ message: "Category created", category });
  } catch (err) {
    console.error("Create category error:", err);
    if (err.code === 11000) {
      return res.status(400).json({ message: "Category name or slug already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json({ message: "Category updated", category });
  } catch (err) {
    console.error("Update category error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json({ message: "Category deleted" });
  } catch (err) {
    console.error("Delete category error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// PROMO CODES
// ============================================================
export const getPromoCodes = async (req, res) => {
  try {
    const promoCodes = await PromoCode.find().sort({ createdAt: -1 });
    res.json({ promoCodes });
  } catch (err) {
    console.error("Get promo codes error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const createPromoCode = async (req, res) => {
  try {
    const promoCode = await PromoCode.create(req.body);
    res.status(201).json({ message: "Promo code created", promoCode });
  } catch (err) {
    console.error("Create promo code error:", err);
    if (err.code === 11000) {
      return res.status(400).json({ message: "Promo code already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

export const updatePromoCode = async (req, res) => {
  try {
    const promoCode = await PromoCode.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!promoCode) {
      return res.status(404).json({ message: "Promo code not found" });
    }
    res.json({ message: "Promo code updated", promoCode });
  } catch (err) {
    console.error("Update promo code error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deletePromoCode = async (req, res) => {
  try {
    const promoCode = await PromoCode.findByIdAndDelete(req.params.id);
    if (!promoCode) {
      return res.status(404).json({ message: "Promo code not found" });
    }
    res.json({ message: "Promo code deleted" });
  } catch (err) {
    console.error("Delete promo code error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// HOMEPAGE CONTENT
// ============================================================
export const getHomepageContent = async (req, res) => {
  try {
    const content = await HomepageContent.getContent();
    res.json({ content });
  } catch (err) {
    console.error("Get homepage content error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateHomepageContent = async (req, res) => {
  try {
    const content = await HomepageContent.getContent();
    
    // Update allowed sections
    const allowedSections = ["hero", "howItWorks", "whyChooseUs", "stats", "ctaBanner", "cities", "seo"];
    
    allowedSections.forEach((section) => {
      if (req.body[section] !== undefined) {
        content[section] = req.body[section];
      }
    });
    
    await content.save();
    
    res.json({ message: "Homepage content updated", content });
  } catch (err) {
    console.error("Update homepage content error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// FOOTER CONTENT
// ============================================================
export const getFooterContent = async (req, res) => {
  try {
    const content = await FooterContent.getContent();
    res.json({ content });
  } catch (err) {
    console.error("Get footer content error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateFooterContent = async (req, res) => {
  try {
    const content = await FooterContent.getContent();
    
    // Update allowed sections
    const allowedSections = ["about", "quickLinks", "supportLinks", "socialLinks", "contact", "legal", "newsletter"];
    
    allowedSections.forEach((section) => {
      if (req.body[section] !== undefined) {
        content[section] = req.body[section];
      }
    });
    
    await content.save();
    
    res.json({ message: "Footer content updated", content });
  } catch (err) {
    console.error("Update footer content error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

