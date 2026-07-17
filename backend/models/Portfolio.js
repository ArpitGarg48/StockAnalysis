import mongoose from 'mongoose';

const portfolioSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    sector: {
      type: String,
      default: 'Technology',
    },
    shares: {
      type: Number,
      required: true,
      min: 0,
    },
    averageBuyPrice: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user only has one portfolio entry per symbol
portfolioSchema.index({ userId: 1, symbol: 1 }, { unique: true });

const Portfolio = mongoose.model('Portfolio', portfolioSchema);
export default Portfolio;
