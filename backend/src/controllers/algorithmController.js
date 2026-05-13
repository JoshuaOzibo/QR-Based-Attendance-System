import { AlgorithmService } from '../services/algorithmService.js';

export const getShortestPath = (req, res) => {
    try {
        const result = AlgorithmService.getShortestPath(req.query.start, req.query.end);
        res.json({ status: "success", ...result });
    } catch (error) {
        res.status(400).json({ status: "error", message: error.message });
    }
};

export const getRecommendations = async (req, res) => {
    try {
        const result = await AlgorithmService.getRecommendations(req.params.rollNo, req.query.type);
        res.json({ status: "success", data: result });
    } catch (error) {
        res.status(400).json({ status: "error", message: error.message });
    }
};

export const getCommunity = async (req, res) => {
    try {
        const result = await AlgorithmService.exploreStudentCommunity(req.params.rollNo, req.query.depth, req.query.algorithm || 'bfs');
        res.json({ status: "success", data: result });
    } catch (error) {
        res.status(400).json({ status: "error", message: error.message });
    }
};
