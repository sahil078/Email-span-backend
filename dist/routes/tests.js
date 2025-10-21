"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Test_1 = __importDefault(require("../models/Test"));
const gmailChecker_1 = require("../services/gmailChecker");
const outlookChecker_1 = require("../services/outlookChecker");
const emailService_1 = require("../services/emailService");
const router = express_1.default.Router();
// Generate test code and create test
router.post('/create', async (req, res) => {
    try {
        const { userEmail } = req.body;
        const testCode = `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const test = new Test_1.default({
            testCode,
            userId: userEmail,
            status: 'pending',
            results: [
                { provider: 'gmail', email: 'test.gmail@yourdomain.com', status: 'pending', folder: '' },
                { provider: 'outlook', email: 'test.outlook@yourdomain.com', status: 'pending', folder: '' },
                { provider: 'yahoo', email: 'test.yahoo@yourdomain.com', status: 'pending', folder: '' },
                { provider: 'icloud', email: 'test.icloud@yourdomain.com', status: 'pending', folder: '' },
                { provider: 'custom', email: 'test.custom@yourdomain.com', status: 'pending', folder: '' },
            ],
        });
        await test.save();
        res.json({
            testCode,
            testEmails: test.results.map((r) => r.email),
            testId: test._id,
        });
    }
    catch (error) {
        console.error('Error creating test:', error);
        res.status(500).json({ message: 'Failed to create test' });
    }
});
// Check test status and results
router.get('/:testCode', async (req, res) => {
    try {
        const { testCode } = req.params;
        const test = await Test_1.default.findOne({ testCode });
        if (!test)
            return res.status(404).json({ message: 'Test not found' });
        res.json(test);
    }
    catch (error) {
        console.error('Error fetching test:', error);
        res.status(500).json({ message: 'Failed to fetch test' });
    }
});
// Process test - check all inboxes
router.post('/:testCode/process', async (req, res) => {
    try {
        const { testCode } = req.params;
        const test = await Test_1.default.findOne({ testCode });
        if (!test)
            return res.status(404).json({ message: 'Test not found' });
        const gmailChecker = new gmailChecker_1.GmailChecker();
        const outlookChecker = new outlookChecker_1.OutlookChecker();
        const emailService = new emailService_1.EmailService();
        for (const result of test.results) {
            try {
                let checkResult;
                switch (result.provider) {
                    case 'gmail':
                        checkResult = await gmailChecker.checkEmail(testCode, result.email);
                        break;
                    case 'outlook':
                        checkResult = await outlookChecker.checkEmail(testCode, result.email);
                        break;
                    default:
                        checkResult = { status: 'not_received', folder: 'Not Supported' };
                }
                result.status = checkResult.status;
                result.folder = checkResult.folder;
                if (checkResult.status !== 'not_received') {
                    // align with schema/front-end
                    result.receivedAt = new Date();
                }
            }
            catch (error) {
                console.error(`Error checking ${result.provider}:`, error);
                result.status = 'not_received';
                result.folder = 'Error';
            }
        }
        const deliveredCount = test.results.filter((r) => r.status === 'delivered').length;
        test.overallScore = (deliveredCount / test.results.length) * 100;
        test.status = 'completed';
        test.completedAt = new Date();
        await test.save();
        try {
            const reportUrl = `${process.env.FRONTEND_URL}/report/${testCode}`;
            await emailService.sendReportEmail(test.userId, testCode, reportUrl);
        }
        catch (emailError) {
            console.error('Error sending report email:', emailError);
        }
        res.json(test);
    }
    catch (error) {
        console.error('Error processing test:', error);
        res.status(500).json({ message: 'Failed to process test' });
    }
});
exports.default = router;
