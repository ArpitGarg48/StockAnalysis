import express from 'express';
import { getAllStocks, getStockQuote, getStockChart } from '../controllers/stockController.js';

const router = express.Router();

router.get('/all', getAllStocks);
router.get('/quote/:symbol', getStockQuote);
router.get('/chart/:symbol', getStockChart);

export default router;
