import { Router } from 'express';
import { getShortestPath, getRecommendations, getCommunity } from '../controllers/algorithmController.js';

const router = Router();

// Mounted at /api
router.get('/navigation/shortest-path', getShortestPath);
router.get('/students/:rollNo/recommendations', getRecommendations);
router.get('/students/:rollNo/community', getCommunity);

export default router;
