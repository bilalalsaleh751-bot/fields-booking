import dotenv from "dotenv";
import connectDB from "../config/db.js";
import SportType from "../models/SportType.js";

dotenv.config();

const sportTypes = [
  { name: "Football", icon: "⚽", sortOrder: 1 },
  { name: "Basketball", icon: "🏀", sortOrder: 2 },
  { name: "Tennis", icon: "🎾", sortOrder: 3 },
  { name: "Padel", icon: "🎾", sortOrder: 4 },
  { name: "Volleyball", icon: "🏐", sortOrder: 5 },
  { name: "Swimming", icon: "🏊", sortOrder: 6 },
  { name: "Squash", icon: "🏸", sortOrder: 7 },
  { name: "Badminton", icon: "🏸", sortOrder: 8 },
];

async function seedSportTypes() {
  try {
    await connectDB();
    console.log("🔌 Connected to MongoDB");

    for (const st of sportTypes) {
      const slug = st.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      
      const existing = await SportType.findOne({ slug });
      if (existing) {
        console.log(`⏭️  Skipping ${st.name} (already exists)`);
        continue;
      }

      await SportType.create({
        ...st,
        slug,
        isActive: true,
      });
      console.log(`✅ Created ${st.name}`);
    }

    console.log("\n✅ Sport types seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding sport types:", err);
    process.exit(1);
  }
}

seedSportTypes();

