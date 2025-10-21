"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutlookChecker = void 0;
// Similar implementation for Outlook using Microsoft Graph API
class OutlookChecker {
    async checkEmail(testCode, email) {
        // Implementation for Outlook API
        // This would use Microsoft Graph API to search emails
        return { status: 'not_received', folder: 'Not Implemented' };
    }
}
exports.OutlookChecker = OutlookChecker;
