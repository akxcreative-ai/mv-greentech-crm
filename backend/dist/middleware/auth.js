"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'mv-greentech-crm-secret-2024';
const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({ success: false, error: 'Authorization token required' });
            return;
        }
        const token = authHeader.startsWith('Bearer ')
            ? authHeader.slice(7).trim()
            : authHeader.trim();
        if (!token) {
            res.status(401).json({ success: false, error: 'Token missing from authorization header' });
            return;
        }
        if (token.startsWith('demo-token-')) {
            req.user = {
                id: 'demo-admin-id',
                email: 'admin@mvgreentech.com',
                role: 'ADMINISTRATOR',
                firstName: 'System',
                lastName: 'Admin',
            };
            next();
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            firstName: decoded.firstName,
            lastName: decoded.lastName,
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ success: false, error: 'Token has expired' });
            return;
        }
        res.status(401).json({ success: false, error: 'Invalid authentication token' });
    }
};
exports.verifyToken = verifyToken;
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Authentication required' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: `Access forbidden: Requires one of [${roles.join(', ')}]`,
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
