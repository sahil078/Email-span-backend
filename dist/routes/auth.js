"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
// Simple auth - just track users by email
router.post('/identify', async (req, res) => {
    try {
        const { email } = req.body;
        // For this demo, we'll just return success
        // In production, you might want to create user records
        res.json({ success: true, user: { email } });
    }
    catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({ message: 'Authentication failed' });
    }
});
exports.default = router;
