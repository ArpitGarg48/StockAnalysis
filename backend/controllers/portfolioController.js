import Portfolio from '../models/Portfolio.js';
import Transaction from '../models/Transaction.js';
import Stock from '../models/Stock.js';
import User from '../models/User.js';

// @desc    Get user holdings with live profit/loss tracking & summary stats
// @route   GET /api/portfolio
export const getPortfolio = async (req, res) => {
  try {
    const holdings = await Portfolio.find({ userId: req.user._id });
    const stocks = await Stock.find({});
    const stockMap = {};
    stocks.forEach((s) => {
      stockMap[s.symbol] = s;
    });

    let totalInvested = 0;
    let totalCurrentValue = 0;
    const sectorMap = {};

    const enrichedHoldings = holdings.map((holding) => {
      const liveStock = stockMap[holding.symbol] || {
        price: holding.averageBuyPrice,
        sector: holding.sector || 'Technology',
      };

      const currentPrice = liveStock.price;
      const investedValue = holding.shares * holding.averageBuyPrice;
      const currentValue = holding.shares * currentPrice;
      const profitLoss = currentValue - investedValue;
      const profitLossPercent = investedValue > 0 ? (profitLoss / investedValue) * 100 : 0;

      totalInvested += investedValue;
      totalCurrentValue += currentValue;

      const sectorName = holding.sector || liveStock.sector || 'General';
      sectorMap[sectorName] = (sectorMap[sectorName] || 0) + currentValue;

      return {
        _id: holding._id,
        symbol: holding.symbol,
        companyName: holding.companyName,
        sector: sectorName,
        shares: holding.shares,
        averageBuyPrice: Number(holding.averageBuyPrice.toFixed(2)),
        averageCost: Number(holding.averageBuyPrice.toFixed(2)),
        currentPrice: Number(currentPrice.toFixed(2)),
        investedValue: Number(investedValue.toFixed(2)),
        currentValue: Number(currentValue.toFixed(2)),
        totalValue: Number(currentValue.toFixed(2)),
        profitLoss: Number(profitLoss.toFixed(2)),
        profitLossPercent: Number(profitLossPercent.toFixed(2)),
      };
    });

    const totalProfitLoss = totalCurrentValue - totalInvested;
    const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

    // Calculate sector percentages for chart/progress bars
    const sectorAllocation = Object.keys(sectorMap).map((sector) => ({
      sector,
      value: Number(sectorMap[sector].toFixed(2)),
      percentage: totalCurrentValue > 0 ? Number(((sectorMap[sector] / totalCurrentValue) * 100).toFixed(1)) : 0,
    }));

    res.json({
      holdings: enrichedHoldings,
      totalInvestment: Number(totalInvested.toFixed(2)),
      currentValue: Number(totalCurrentValue.toFixed(2)),
      totalProfitLoss: Number(totalProfitLoss.toFixed(2)),
      profitLossPercent: Number(totalProfitLossPercent.toFixed(2)),
      summary: {
        totalHoldings: holdings.length,
        totalInvested: Number(totalInvested.toFixed(2)),
        totalCurrentValue: Number(totalCurrentValue.toFixed(2)),
        totalProfitLoss: Number(totalProfitLoss.toFixed(2)),
        totalProfitLossPercent: Number(totalProfitLossPercent.toFixed(2)),
        balance: Number(req.user.balance.toFixed(2)),
        sectorAllocation,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Buy stock or Add/Edit holding
// @route   POST /api/portfolio/buy
export const buyStock = async (req, res) => {
  try {
    const { symbol, companyName, sector, shares, price } = req.body;

    if (!symbol || !shares || !price || shares <= 0 || price <= 0) {
      return res.status(400).json({ message: 'Please provide valid symbol, shares quantity, and price' });
    }

    const totalAmount = Number((shares * price).toFixed(2));
    const user = await User.findById(req.user._id);

    if (user.balance < totalAmount) {
      return res.status(400).json({ message: `Insufficient cash balance (₹${user.balance.toLocaleString()}) for this purchase (₹${totalAmount.toLocaleString()})` });
    }

    // Deduct cash from balance
    user.balance -= totalAmount;
    await user.save();

    // Find existing holding or create new
    let holding = await Portfolio.findOne({ userId: req.user._id, symbol: symbol.toUpperCase() });

    if (holding) {
      // Calculate new weighted average cost
      const currentTotalCost = holding.shares * holding.averageBuyPrice;
      const newTotalShares = holding.shares + Number(shares);
      const newAvgPrice = (currentTotalCost + totalAmount) / newTotalShares;

      holding.shares = newTotalShares;
      holding.averageBuyPrice = Number(newAvgPrice.toFixed(2));
      await holding.save();
    } else {
      holding = await Portfolio.create({
        userId: req.user._id,
        symbol: symbol.toUpperCase(),
        companyName: companyName || symbol,
        sector: sector || 'Technology',
        shares: Number(shares),
        averageBuyPrice: Number(price),
      });
    }

    // Record transaction
    const transaction = await Transaction.create({
      userId: req.user._id,
      symbol: symbol.toUpperCase(),
      companyName: companyName || symbol,
      type: 'BUY',
      shares: Number(shares),
      price: Number(price),
      totalAmount,
    });

    res.status(201).json({
      message: `Successfully purchased ${shares} shares of ${symbol}`,
      holding,
      transaction,
      newBalance: user.balance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Sell stock or remove holding
// @route   POST /api/portfolio/sell
export const sellStock = async (req, res) => {
  try {
    const { symbol, shares, price } = req.body;

    if (!symbol || !shares || !price || shares <= 0 || price <= 0) {
      return res.status(400).json({ message: 'Please provide valid symbol, shares quantity, and price' });
    }

    const holding = await Portfolio.findOne({ userId: req.user._id, symbol: symbol.toUpperCase() });

    if (!holding || holding.shares < shares) {
      return res.status(400).json({ message: `You do not have enough shares (${holding ? holding.shares : 0}) of ${symbol} to sell` });
    }

    const totalAmount = Number((shares * price).toFixed(2));
    const user = await User.findById(req.user._id);

    // Add proceeds to cash balance
    user.balance += totalAmount;
    await user.save();

    if (holding.shares === Number(shares)) {
      await Portfolio.findByIdAndDelete(holding._id);
    } else {
      holding.shares -= Number(shares);
      await holding.save();
    }

    // Record transaction
    const transaction = await Transaction.create({
      userId: req.user._id,
      symbol: symbol.toUpperCase(),
      companyName: holding.companyName,
      type: 'SELL',
      shares: Number(shares),
      price: Number(price),
      totalAmount,
    });

    res.json({
      message: `Successfully sold ${shares} shares of ${symbol}`,
      transaction,
      newBalance: user.balance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user transactions
// @route   GET /api/portfolio/transactions
export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
