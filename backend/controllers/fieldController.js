// backend/controllers/fieldController.js
import Field from "../models/Field.js";

/**
 * GET /api/fields/search
 * Query: sport, city, min, max
 * (مستخدمة في صفحة Discover)
 */
export const searchFields = async (req, res) => {
  try {
    const { sport, city, min, max } = req.query;

    const query = {};

    // 🟢 حل مشكلة "Field not found" في Discover:
    // نعمل تطابق غير حساس لحالة الأحرف (case-insensitive)
    if (sport) query.sport = new RegExp(`^${sport}$`, "i");
    if (city) query.city = new RegExp(`^${city}$`, "i");

    if (min || max) {
      query.pricePerHour = {};
      if (min) query.pricePerHour.$gte = Number(min);
      if (max) query.pricePerHour.$lte = Number(max);
    }

    const fields = await Field.find(query).sort({ pricePerHour: 1 });

    res.json({ fields });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/fields/:id
 * تفاصيل ملعب واحد (مستخدمة في FieldDetails.jsx)
 */
export const getFieldById = async (req, res) => {
  try {
    const field = await Field.findById(req.params.id);

    if (!field) {
      return res.status(404).json({ message: "Field not found" });
    }

    res.json({ field });
  } catch (err) {
    console.error("Get field error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/fields/:id/reviews
 * إضافة تقييم جديد للملعب
 */
export const addFieldReview = async (req, res) => {
  try {
    const { userName, rating, comment } = req.body;

    const field = await Field.findById(req.params.id);
    if (!field) {
      return res.status(404).json({ message: "Field not found" });
    }

    const newReview = {
      userName,
      rating: Number(rating),
      comment,
    };

    field.reviews.push(newReview);

    // تحديث المتوسط والعدد
    field.reviewCount = field.reviews.length;
    field.averageRating =
      field.reviews.reduce((sum, r) => sum + r.rating, 0) /
      field.reviews.length;

    await field.save();

    res.status(201).json({
      message: "Review added",
      reviews: field.reviews,
      averageRating: field.averageRating,
      reviewCount: field.reviewCount,
    });
  } catch (err) {
    console.error("Add review error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/fields/:id/reviews
 */
export const getFieldReviews = async (req, res) => {
  try {
    const field = await Field.findById(req.params.id).select("reviews");
    if (!field) {
      return res.status(404).json({ message: "Field not found" });
    }

    res.json({ reviews: field.reviews });
  } catch (err) {
    console.error("Get reviews error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/fields/seed
 * Seed data مبدئية (PDR-style)
 */
export const seedFields = async (req, res) => {
  try {
    await Field.deleteMany({});

    const docs = await Field.insertMany([
      {
        name: "Beirut Arena Stadium",
        sport: "Football",
        city: "Beirut",
        address: "Main Highway, Beirut",
        description: "High quality 7-a-side football pitch with night lights.",
        mainImage:
          "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=1200&q=80",
        images: [
          "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?auto=format&fit=crop&w=1200&q=80",
        ],
        pricePerHour: 25,
        isIndoor: false,
        surfaceType: "Turf",
        maxPlayers: 14,
        amenities: ["Parking", "Showers", "Lights", "Lockers"],
        rules: ["Arrive 10 minutes before", "No smoking on the pitch"],
        openingHours: { open: "08:00", close: "23:00" },
        owner: {
          name: "Beirut Sports Center",
          phone: "+961 70 111 111",
          email: "info@beirutsports.com",
        },
        location: { lat: 33.8886, lng: 35.4955 },
      },
      {
        name: "Sidon Elite Court",
        sport: "Football",
        city: "Sidon",
        address: "Seaside Road, Sidon",
        description: "Perfect for 5v5 matches near the sea.",
        mainImage:
          "https://images.unsplash.com/photo-1518081461904-ce9b17f1be5a?auto=format&fit=crop&w=1200&q=80",
        pricePerHour: 18,
        isIndoor: false,
        surfaceType: "Turf",
        amenities: ["Parking", "Lights"],
        rules: ["No glass bottles", "Respect neighbors"],
        openingHours: { open: "09:00", close: "22:00" },
        owner: {
          name: "Sidon Sports",
          phone: "+961 70 222 222",
          email: "info@sidonsports.com",
        },
        location: { lat: 33.5575, lng: 35.3715 },
      },
      {
        name: "Jounieh Mega Court",
        sport: "Basketball",
        city: "Jounieh",
        address: "Downtown Jounieh",
        description: "Professional basketball court with hardwood surface.",
        mainImage:
          "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1200&q=80",
        pricePerHour: 22,
        isIndoor: true,
        surfaceType: "Hardwood",
        amenities: ["Parking", "Showers", "AC"],
        rules: ["Indoor shoes only", "No food on court"],
        openingHours: { open: "10:00", close: "22:00" },
        owner: {
          name: "Jounieh Courts",
          phone: "+961 70 333 333",
          email: "info@jouniehcourts.com",
        },
        location: { lat: 33.9808, lng: 35.6174 },
      },
    ]);

    res.json({ message: "Fields seeded", count: docs.length });
  } catch (err) {
    console.error("Seed error:", err);
    res.status(500).json({ message: "Seed error" });
  }
};
