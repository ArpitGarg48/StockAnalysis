import Watchlist from '../models/Watchlist.js';
import Stock from '../models/Stock.js';

// @desc    Get user watchlist with live stock quotes
// @route   GET /api/watchlist
export const getWatchlist = async (req, res) => {
  try {
    const watchlists = await Watchlist.find({ userId: req.user._id });
    const symbols = watchlists.map((item) => item.symbol);
    const stocks = await Stock.find({ symbol: { $in: symbols } });

    const stockMap = {};
    stocks.forEach((s) => {
      stockMap[s.symbol] = s;
    });

    const enrichedWatchlist = watchlists.map((item) => {
      const stockInfo = stockMap[item.symbol] || {
        price: 0,
        change: 0,
        changePercent: 0,
        sector: 'General',
      };
      return {
        _id: item._id,
        symbol: item.symbol,
        companyName: item.companyName,
        price: stockInfo.price,
        change: stockInfo.change,
        changePercent: stockInfo.changePercent,
        sector: stockInfo.sector,
        addedAt: item.createdAt,
      };
    });

    res.json(enrichedWatchlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add stock to watchlist
// @route   POST /api/watchlist
export const addToWatchlist = async (req, res) => {
  try {
    const { symbol, companyName } = req.body;
    if (!symbol) {
      return res.status(400).json({ message: 'Stock symbol is required' });
    }

    const exists = await Watchlist.findOne({ userId: req.user._id, symbol: symbol.toUpperCase() });
    if (exists) {
      return res.status(400).json({ message: `${symbol} is already in your watchlist` });
    }

    const item = await Watchlist.create({
      userId: req.user._id,
      symbol: symbol.toUpperCase(),
      companyName: companyName || symbol,
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove stock from watchlist
// @route   DELETE /api/watchlist/:symbol
export const removeFromWatchlist = async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    await Watchlist.findOneAndDelete({ userId: req.user._id, symbol });
    res.json({ message: `Removed ${symbol} from watchlist` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
