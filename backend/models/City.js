import mongoose from "mongoose";

const AreaSchema = new mongoose.Schema({
  name: { type: String, required: true },
  isActive: { type: Boolean, default: true },
});

const CitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    nameAr: String, // Arabic name
    
    areas: [AreaSchema],
    
    isActive: { type: Boolean, default: true },
    
    // For ordering in dropdowns
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CitySchema.index({ isActive: 1, sortOrder: 1 });

const City = mongoose.model("City", CitySchema);
export default City;

