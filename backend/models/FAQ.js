import mongoose from "mongoose";

const FAQSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    
    category: {
      type: String,
      enum: ["general", "booking", "payment", "owner", "technical"],
      default: "general",
    },
    
    isActive: { type: Boolean, default: true },
    
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

FAQSchema.index({ isActive: 1, category: 1, sortOrder: 1 });

const FAQ = mongoose.model("FAQ", FAQSchema);
export default FAQ;

