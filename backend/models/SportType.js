import mongoose from "mongoose";

const sportTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    icon: String, // Optional icon/emoji
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

sportTypeSchema.index({ isActive: 1, sortOrder: 1 });

const SportType = mongoose.model("SportType", sportTypeSchema);
export default SportType;

