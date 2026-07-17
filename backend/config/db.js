import mongoose from 'mongoose';
import Stock from '../models/Stock.js';

const initialStocks = [
  {
    symbol: 'AAPL',
    companyName: 'Apple Inc.',
    sector: 'Technology',
    price: 215.40,
    change: 5.10,
    changePercent: 2.43,
    volume: 5432000,
  },
  {
    symbol: 'NVDA',
    companyName: 'NVIDIA Corporation',
    sector: 'Technology',
    price: 130.50,
    change: 5.20,
    changePercent: 4.15,
    volume: 8215000,
  },
  {
    symbol: 'TSLA',
    companyName: 'Tesla Inc.',
    sector: 'Automobile',
    price: 248.30,
    change: -3.40,
    changePercent: -1.35,
    volume: 6120000,
  },
  {
    symbol: 'MSFT',
    companyName: 'Microsoft Corporation',
    sector: 'Technology',
    price: 442.80,
    change: 6.30,
    changePercent: 1.44,
    volume: 4190000,
  },
  {
    symbol: 'GOOGL',
    companyName: 'Alphabet Inc.',
    sector: 'Technology',
    price: 182.10,
    change: 2.15,
    changePercent: 1.19,
    volume: 3890000,
  },
  {
    symbol: 'AMZN',
    companyName: 'Amazon.com Inc.',
    sector: 'Consumer',
    price: 195.20,
    change: 3.80,
    changePercent: 1.98,
    volume: 4500000,
  },
  {
    symbol: 'RELIANCE.NS',
    companyName: 'Reliance Industries Ltd.',
    sector: 'Energy',
    price: 3120.00,
    change: 45.00,
    changePercent: 1.46,
    volume: 2150000,
  },
  {
    symbol: 'TCS.NS',
    companyName: 'Tata Consultancy Services',
    sector: 'Technology',
    price: 4250.00,
    change: 60.00,
    changePercent: 1.43,
    volume: 1800000,
  },
  {
    symbol: 'INFY.NS',
    companyName: 'Infosys Limited',
    sector: 'Technology',
    price: 1780.00,
    change: -12.00,
    changePercent: -0.67,
    volume: 3100000,
  },
  {
    symbol: 'TATAMOTORS.NS',
    companyName: 'Tata Motors Limited',
    sector: 'Automobile',
    price: 980.50,
    change: 18.50,
    changePercent: 1.92,
    volume: 4200000,
  },
];

// Helper to generate sample historical chart points for demo/offline resilience
const generateSampleHistoricalData = (basePrice) => {
  const points = [];
  const now = new Date();
  // Generate 30 days of data
  let price = basePrice * 0.9;
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const fluctuation = (Math.random() - 0.45) * (basePrice * 0.03);
    price = Number((price + fluctuation).toFixed(2));
    points.push({ timestamp: date, price });
  }
  return points;
};

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stocks_analysis';
    const conn = await mongoose.connect(mongoURI);
    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}`);
    console.log(`Explore database '${conn.connection.name}' in MongoDB Compass at: ${mongoURI}`);

    // Auto-seed initial stocks if database has none
    const stockCount = await Stock.countDocuments();
    if (stockCount === 0) {
      console.log('🌱 Seeding initial stock market data into MongoDB...');
      const stocksWithHistory = initialStocks.map((stock) => ({
        ...stock,
        historicalData: generateSampleHistoricalData(stock.price),
      }));
      await Stock.insertMany(stocksWithHistory);
      console.log('✅ Initial stock data seeded successfully into stocks collection!');
    }
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    console.error('Please ensure MongoDB server is running locally (or set MONGODB_URI in .env).');
  }
};

export default connectDB;
