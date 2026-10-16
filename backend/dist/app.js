"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const errorHandler_1 = require("./middleware/errorHandler");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const customer_routes_1 = __importDefault(require("./routes/customer.routes"));
const lead_routes_1 = __importDefault(require("./routes/lead.routes"));
const followUp_routes_1 = __importDefault(require("./routes/followUp.routes"));
const visit_routes_1 = __importDefault(require("./routes/visit.routes"));
const item_routes_1 = __importDefault(require("./routes/item.routes"));
const quotation_routes_1 = __importDefault(require("./routes/quotation.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const target_routes_1 = __importDefault(require("./routes/target.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const setting_routes_1 = __importDefault(require("./routes/setting.routes"));
const location_routes_1 = __importDefault(require("./routes/location.routes"));
const auditLog_routes_1 = __importDefault(require("./routes/auditLog.routes"));
const app = (0, express_1.default)();
// Security
app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or same-origin)
        if (!origin)
            return callback(null, true);
        const allowed = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'];
        if (process.env.NODE_ENV !== 'production' || allowed.includes(origin) || allowed.includes('*')) {
            return callback(null, true);
        }
        return callback(null, true); // Permissive for demo & easy company handover
    },
    credentials: true,
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({ windowMs: 15 * 60 * 1000, max: 500 });
app.use(limiter);
const authLimiter = (0, express_rate_limit_1.default)({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, error: 'Too many attempts. Try again later.' } });
// Parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, compression_1.default)());
// Logging
if (process.env.NODE_ENV !== 'test') {
    app.use((0, morgan_1.default)('short'));
}
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ success: true, message: 'MV GREENTECH CRM API is running', timestamp: new Date().toISOString() });
});
// Routes (Mounted at both /api/v1 and /v1 for complete client compatibility)
const registerRoutes = (prefix) => {
    app.use(`${prefix}/auth`, authLimiter, auth_routes_1.default);
    app.use(`${prefix}/users`, user_routes_1.default);
    app.use(`${prefix}/customers`, customer_routes_1.default);
    app.use(`${prefix}/leads`, lead_routes_1.default);
    app.use(`${prefix}/follow-ups`, followUp_routes_1.default);
    app.use(`${prefix}/visits`, visit_routes_1.default);
    app.use(`${prefix}/items`, item_routes_1.default);
    app.use(`${prefix}/quotations`, quotation_routes_1.default);
    app.use(`${prefix}/orders`, order_routes_1.default);
    app.use(`${prefix}/targets`, target_routes_1.default);
    app.use(`${prefix}/dashboard`, dashboard_routes_1.default);
    app.use(`${prefix}/notifications`, notification_routes_1.default);
    app.use(`${prefix}/settings`, setting_routes_1.default);
    app.use(`${prefix}/locations`, location_routes_1.default);
    app.use(`${prefix}/audit-logs`, auditLog_routes_1.default);
};
registerRoutes('/api/v1');
registerRoutes('/v1');
// Error handler
app.use(errorHandler_1.errorHandler);
exports.default = app;
