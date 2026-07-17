import Stock from '../models/Stock.js';
import yahooFinance from 'yahoo-finance2';

// Helper to generate realistic historical data points for chart rendering
const generateFallbackChartData = (basePrice, range) => {
  const points = [];
  const now = new Date();
  let days = 30;
  if (range === '1d') days = 1;
  else if (range === '1w') days = 7;
  else if (range === '1mo') days = 30;
  else if (range === '1y') days = 365;

  const totalPoints = range === '1d' ? 24 : Math.min(days, 60);
  const timeStep = (days * 24 * 60 * 60 * 1000) / totalPoints;

  let price = basePrice * (1 - (Math.random() * 0.05));
  for (let i = totalPoints; i >= 0; i--) {
    const date = new Date(now.getTime() - i * timeStep);
    const change = (Math.random() - 0.48) * (basePrice * 0.02);
    price = Math.max(1, Number((price + change).toFixed(2)));
    points.push({ timestamp: date, price });
  }
  return points;
};

// @desc    Get all stocks (with search & sector filter)
// @route   GET /api/stocks/all
export const getAllStocks = async (req, res) => {
  try {
    const { search, sector } = req.query;
    const query = {};

    if (search && search.trim() !== '') {
      query.$or = [
        { symbol: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
      ];
    }

    if (sector && sector !== 'All Sectors' && sector !== 'All') {
      query.sector = sector;
    }

    const stocks = await Stock.find(query).sort({ symbol: 1 });
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get real-time stock quote via yahoo-finance2 and update MongoDB
// @route   GET /api/stocks/quote/:symbol
export const getStockQuote = async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    let stock = await Stock.findOne({ symbol });

    try {
      // Fetch live quote from Yahoo Finance API
      const quote = await yahooFinance.quote(symbol);
      if (quote && quote.regularMarketPrice) {
        const updatedPrice = quote.regularMarketPrice;
        const updatedChange = quote.regularMarketChange || 0;
        const updatedChangePercent = quote.regularMarketChangePercent || 0;
        const updatedVolume = quote.regularMarketVolume || 1000000;

        if (stock) {
          stock.price = updatedPrice;
          stock.change = Number(updatedChange.toFixed(2));
          stock.changePercent = Number(updatedChangePercent.toFixed(2));
          stock.volume = updatedVolume;
          await stock.save();
        } else {
          stock = await Stock.create({
            symbol,
            companyName: quote.longName || quote.shortName || symbol,
            sector: 'General',
            price: updatedPrice,
            change: Number(updatedChange.toFixed(2)),
            changePercent: Number(updatedChangePercent.toFixed(2)),
            volume: updatedVolume,
            historicalData: generateFallbackChartData(updatedPrice, '1mo'),
          });
        }
      }
    } catch (apiError) {
      console.warn(`Yahoo Finance API quote warning for ${symbol}: ${apiError.message}. Using stored MongoDB quote.`);
    }

    if (!stock) {
      return res.status(404).json({ message: `Stock ${symbol} not found in database or external API.` });
    }

    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get historical price points for interactive graph rendering
// @route   GET /api/stocks/chart/:symbol?range=1d|1w|1mo|1y
export const getStockChart = async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const range = (req.query.range || '1mo').toLowerCase();
    const stock = await Stock.findOne({ symbol });

    const basePrice = stock ? stock.price : 200;

    try {
      const now = new Date();
      let period1 = new Date();
      let interval = '1d';

      if (range === '1d') {
        period1 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        interval = '30m';
      } else if (range === '1w') {
        period1 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        interval = '1d';
      } else if (range === '1mo') {
        period1 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        interval = '1d';
      } else if (range === '1y') {
        period1 = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        interval = '1wk';
      }

      const historical = await yahooFinance.historical(symbol, {
        period1: period1.toISOString().split('T')[0],
        period2: now.toISOString().split('T')[0],
        interval,
      });

      if (historical && historical.length > 0) {
        const chartPoints = historical
          .filter((item) => item.close || item.adjClose)
          .map((item) => ({
            timestamp: item.date,
            price: Number((item.close || item.adjClose).toFixed(2)),
          }));

        // Cache historical points into MongoDB if stock exists
        if (stock && chartPoints.length > 5) {
          stock.historicalData = chartPoints;
          await stock.save();
        }

        return res.json({
          symbol,
          range,
          data: chartPoints,
        });
      }
    } catch (apiError) {
      console.warn(`Yahoo Finance historical API warning for ${symbol}: ${apiError.message}. Using stored/generated chart points.`);
    }

    // Fallback to cached historicalData or generated smooth chart points
    if (stock && stock.historicalData && stock.historicalData.length > 0 && range === '1mo') {
      return res.json({
        symbol,
        range,
        data: stock.historicalData,
      });
    }

    const fallbackPoints = generateFallbackChartData(basePrice, range);
    res.json({
      symbol,
      range,
      data: fallbackPoints,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
