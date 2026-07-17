import mongoose from 'mongoose';

const watchlistSchema = new mongoose.Schema(
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
    },
    companyName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

watchlistSchema.index({ userId: 1, symbol: 1 }, { unique: true });

const Watchlist = mongoose.model('Watchlist', watchlistSchema);
export default Watchlist;
