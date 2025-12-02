// backend/controllers/fieldController.js
import Field from "../models/Field.js";

/**
 * GET /api/fields/search
 *
 * Query params المدعومة:
 *  - sport
 *  - city
 *  - min (min pricePerHour)
 *  - max (max pricePerHour)
 *  - minRating
 *  - isIndoor ("true" | "false")
 *  - surfaceType
 *  - amenities ( "Parking,Lights" أو amenities=Parking&amenities=Lights )
 *  - owner (partial match on owner.name)
 *  - sortBy ("relevance" | "price_low" | "price_high" | "rating")
 *  - date, time (مستقبلاً للـ availability – هلق بس pass-through)
 */
export const searchFields = async (req, res) => {
  try {
    const {
      sport,
      city,
      min,
      max,
      minRating,
      isIndoor,
      surfaceType,
      amenities,
      owner,
      sortBy,
      date, // not used yet
      time, // not used yet
    } = req.query;

    const query = {};

    // sport / city
    if (sport) query.sport = sport;
    if (city) query.city = city;

    // pricePerHour range
    if (min || max) {
      query.pricePerHour = {};
      if (min) query.pricePerHour.$gte = Number(min);
      if (max) query.pricePerHour.$lte = Number(max);
    }

    // rating
    if (minRating) {
      const r = Number(minRating);
      if (!isNaN(r) && r > 0) {
        query.averageRating = { $gte: r };
      }
    }

    // indoor / outdoor
    if (isIndoor === "true") query.isIndoor = true;
    if (isIndoor === "false") query.isIndoor = false;

    // surface type
    if (surfaceType) query.surfaceType = surfaceType;

    // owner (partial match, case-insensitive)
    if (owner && owner.trim() !== "") {
      query["owner.name"] = { $regex: owner.trim(), $options: "i" };
    }

    // amenities (array or comma-separated)
    let amenitiesArr = [];
    if (amenities) {
      if (Array.isArray(amenities)) {
        amenitiesArr = amenities
          .flatMap((a) => String(a).split(","))
          .map((a) => a.trim())
          .filter(Boolean);
      } else {
        amenitiesArr = String(amenities)
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean);
      }

      if (amenitiesArr.length > 0) {
        // require all selected amenities to be present
        query.amenities = { $all: amenitiesArr };
      }
    }

    // sorting
    let sortOption = {};
    switch (sortBy) {
      case "price_low":
        sortOption = { pricePerHour: 1 };
        break;
      case "price_high":
        sortOption = { pricePerHour: -1 };
        break;
      case "rating":
        sortOption = { averageRating: -1, reviewCount: -1 };
        break;
      case "relevance":
      default:
        // "relevance" = أعلى rating + أكثر reviews
        sortOption = { averageRating: -1, reviewCount: -1 };
        break;
    }

    const fields = await Field.find(query).sort(sortOption).lean();

    // ما منقص ولا حقل من الـ PDR – lean() بيرجع كل الداتا كما هي
    res.json({
      results: fields.length,
      fields,
    });
  } catch (err) {
    console.error("Error searching fields:", err);
    res.status(500).json({
      message: "Server error while searching fields",
    });
  }
};

/**
 * GET /api/fields/:id
 * يرجّع كل الـ PDR field كامل (name, images, owner, openingHours, إلخ...)
 */
export const getFieldById = async (req, res) => {
  try {
    const field = await Field.findById(req.params.id).lean();
    if (!field) {
      return res.status(404).json({ message: "Field not found" });
    }
    res.json(field);
  } catch (err) {
    console.error("Error fetching field:", err);
    res.status(500).json({ message: "Server error while fetching field" });
  }
};

/**
 * POST /api/fields/:id/reviews
 * body: { rating, comment, user }
 * يضيف review جديد ويحدّث:
 *  - reviews[]
 *  - reviewCount
 *  - averageRating
 */
export const addFieldReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, user } = req.body;

    const numericRating = Number(rating);

    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be a number between 1 and 5" });
    }

    const field = await Field.findById(id);
    if (!field) {
      return res.status(404).json({ message: "Field not found" });
    }

    const review = {
      rating: numericRating,
      comment: comment || "",
      user: user || "Anonymous",
      createdAt: new Date(),
    };

    if (!Array.isArray(field.reviews)) {
      field.reviews = [];
    }

    field.reviews.push(review);
    field.reviewCount = field.reviews.length;

    // تحديث averageRating
    const total = field.reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    field.averageRating = total / field.reviews.length;

    await field.save();

    res.status(201).json({
      message: "Review added successfully",
      fieldId: field._id,
      averageRating: field.averageRating,
      reviewCount: field.reviewCount,
    });
  } catch (err) {
    console.error("Error adding review:", err);
    res.status(500).json({ message: "Server error while adding review" });
  }
};

/**
 * GET /api/fields/:id/reviews
 * يرجّع reviews[] كما هي (مع count و avg لو حابب تستخدمهم)
 */
export const getFieldReviews = async (req, res) => {
  try {
    const field = await Field.findById(req.params.id).lean();
    if (!field) {
      return res.status(404).json({ message: "Field not found" });
    }

    res.json({
      fieldId: field._id,
      averageRating: field.averageRating || 0,
      reviewCount: field.reviewCount || 0,
      reviews: field.reviews || [],
    });
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ message: "Server error while fetching reviews" });
  }
};

/**
 * POST /api/fields/seed
 * يضيف شوية ملاعب PDR جاهزين (ما بيمسح القديمين)
 * للاستعمال بس بالتست / التطوير.
 */
export const seedFields = async (req, res) => {
  try {
    const sampleFields = [
      {
        name: "Beirut Arena - Indoor Football",
        sport: "Football",
        city: "Beirut",
        area: "Downtown",
        address: "Downtown, Beirut, Lebanon",
        description: "High quality indoor football court with turf and LED lights.",
        mainImage: "/images/fields/beirut-arena-main.jpg",
        images: [
          "/images/fields/beirut-arena-1.jpg",
          "/images/fields/beirut-arena-2.jpg",
        ],
        pricePerHour: 80,
        currency: "USD",
        isIndoor: true,
        surfaceType: "Turf",
        maxPlayers: 14,
        amenities: ["Parking", "Lights", "Showers", "Lockers", "AC"],
        rules: ["No smoking", "No food on the field"],
        openingHours: { open: "08:00", close: "23:00" },
        owner: {
          name: "Beirut Arena Management",
          phone: "+961 70 000 111",
          email: "info@beirutarena.com",
        },
        location: { lat: 33.8938, lng: 35.5018 },
        averageRating: 4.7,
        reviewCount: 2,
        reviews: [
          {
            rating: 5,
            comment: "Amazing pitch and lights!",
            user: "Ali",
            createdAt: new Date(),
          },
          {
            rating: 4.5,
            comment: "Great staff and clean showers.",
            user: "Sara",
            createdAt: new Date(),
          },
        ],
      },
      {
        name: "Saida Seaside Court",
        sport: "Basketball",
        city: "Sidon",
        area: "Corniche",
        address: "Corniche Saida, Lebanon",
        description: "Outdoor basketball court with sea view.",
        mainImage: "/images/fields/saida-court-main.jpg",
        images: [],
        pricePerHour: 40,
        currency: "USD",
        isIndoor: false,
        surfaceType: "Hardwood",
        maxPlayers: 10,
        amenities: ["Lights", "Parking"],
        rules: ["No glass bottles", "Respect neighborhood"],
        openingHours: { open: "09:00", close: "22:00" },
        owner: {
          name: "Saida Sports Club",
          phone: "+961 71 222 333",
          email: "contact@saidasports.com",
        },
        location: { lat: 33.5599, lng: 35.3756 },
        averageRating: 4.3,
        reviewCount: 1,
        reviews: [
          {
            rating: 4.3,
            comment: "Nice court with a great view!",
            user: "Bilal",
            createdAt: new Date(),
          },
        ],
      },
      {
        name: "Jounieh Padel Center",
        sport: "Padel",
        city: "Jounieh",
        area: "Main Road",
        address: "Jounieh Highway, Lebanon",
        description: "Modern padel courts with pro equipment.",
        mainImage: "/images/fields/jounieh-padel-main.jpg",
        images: [],
        pricePerHour: 60,
        currency: "USD",
        isIndoor: false,
        surfaceType: "Turf",
        maxPlayers: 4,
        amenities: ["Parking", "Lights", "Lockers"],
        rules: ["Padel shoes only"],
        openingHours: { open: "07:00", close: "00:00" },
        owner: {
          name: "Jounieh Padel Club",
          phone: "+961 76 555 444",
          email: "padel@jouniehclub.com",
        },
        location: { lat: 33.9801, lng: 35.6154 },
        averageRating: 0,
        reviewCount: 0,
        reviews: [],
      },
    ];

    const created = await Field.insertMany(sampleFields);

    res.status(201).json({
      message: "Fields seeded successfully",
      count: created.length,
    });
  } catch (err) {
    console.error("Error seeding fields:", err);
    res.status(500).json({ message: "Server error while seeding fields" });
  }
};

// (اختياري) لو بدك تستخدمهم بمكان تاني:
export const getFields = async (req, res) => {
  try {
    const fields = await Field.find().lean();
    res.json(fields);
  } catch (err) {
    console.error("Error fetching fields:", err);
    res.status(500).json({ message: "Server error while fetching fields" });
  }
};

// ممكن لو حابب تضيف create/update/delete لاحقاً بنفس الـ pattern.
