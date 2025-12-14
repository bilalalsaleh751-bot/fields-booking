import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    nameAr: String, // Arabic name
    
    slug: { type: String, required: true, unique: true },
    
    icon: String, // Emoji or icon class
    imageUrl: String,
    
    description: String,
    
    isActive: { type: Boolean, default: true },
    
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CategorySchema.index({ isActive: 1, sortOrder: 1 });

const Category = mongoose.model("Category", CategorySchema);
export default Category;

