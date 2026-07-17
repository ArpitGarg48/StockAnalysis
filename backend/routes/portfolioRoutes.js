import express from 'express';
import { getPortfolio, buyStock, sellStock, getTransactions } from '../controllers/portfolioController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getPortfolio);
router.post('/buy', buyStock);
router.post('/sell', sellStock);
router.get('/transactions', getTransactions);

export default router;
