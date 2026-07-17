import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    sector: {
      type: String,
      required: true,
      default: 'Technology',
    },
    price: {
      type: Number,
      required: true,
    },
    change: {
      type: Number,
      default: 0,
    },
    changePercent: {
      type: Number,
      default: 0,
    },
    volume: {
      type: Number,
      default: 1000000,
    },
    historicalData: [
      {
        timestamp: { type: Date, required: true },
        price: { type: Number, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Stock = mongoose.model('Stock', stockSchema);
export default Stock;
