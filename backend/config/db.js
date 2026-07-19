import mongoose from 'mongoose';
import Stock from '../models/Stock.js';

const initialStocks = [
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
    symbol: 'HDFCBANK.NS',
    companyName: 'HDFC Bank Limited',
    sector: 'Financial Services',
    price: 1640.00,
    change: 15.50,
    changePercent: 0.95,
    volume: 5400000,
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
    symbol: 'ICICIBANK.NS',
    companyName: 'ICICI Bank Limited',
    sector: 'Financial Services',
    price: 1180.00,
    change: 18.00,
    changePercent: 1.55,
    volume: 4100000,
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
  {
    symbol: 'SBIN.NS',
    companyName: 'State Bank of India',
    sector: 'Financial Services',
    price: 840.00,
    change: 10.20,
    changePercent: 1.23,
    volume: 6500000,
  },
  {
    symbol: 'BHARTIARTL.NS',
    companyName: 'Bharti Airtel Limited',
    sector: 'Telecommunication',
    price: 1450.00,
    change: 22.00,
    changePercent: 1.54,
    volume: 2900000,
  },
  {
    symbol: 'ITC.NS',
    companyName: 'ITC Limited',
    sector: 'Consumer Goods',
    price: 485.00,
    change: 5.50,
    changePercent: 1.15,
    volume: 5800000,
  },
  {
    symbol: 'ZOMATO.NS',
    companyName: 'Zomato Limited',
    sector: 'Consumer Services',
    price: 245.00,
    change: -4.50,
    changePercent: -1.80,
    volume: 8900000,
  },
];

const generateSampleHistoricalData = (basePrice) => {
  const points = [];
  const now = new Date();
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

    // Ensure Indian stocks are seeded/upserted into MongoDB (without wiping existing user data)
    console.log('🌱 Ensuring Indian stock market data is present in MongoDB...');
    for (const stock of initialStocks) {
      await Stock.findOneAndUpdate(
        { symbol: stock.symbol },
        {
          $setOnInsert: {
            ...stock,
            historicalData: generateSampleHistoricalData(stock.price),
          },
        },
        { upsert: true, new: true }
      );
    }
    console.log('✅ Indian stock data verified/seeded successfully into stocks collection!');
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    console.error('Please ensure MongoDB server is running locally (or set MONGODB_URI in .env).');
  }
};

export default connectDB;
