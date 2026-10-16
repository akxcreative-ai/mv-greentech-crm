"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userStore = exports.USER_STORE = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Global In-Memory User Store (Preserved across requests in Node process)
exports.USER_STORE = [
    {
        id: 'usr-admin-01',
        email: 'admin@mvgreentech.com',
        passwordPlain: 'Admin@123',
        passwordHash: bcryptjs_1.default.hashSync('Admin@123', 10),
        firstName: 'System',
        lastName: 'Administrator',
        phone: '+91 98765 00001',
        role: 'ADMINISTRATOR',
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
    },
    {
        id: 'usr-dir-02',
        email: 'director@mvgreentech.com',
        passwordPlain: 'Director@123',
        passwordHash: bcryptjs_1.default.hashSync('Director@123', 10),
        firstName: 'Rajesh',
        lastName: 'Sharma',
        phone: '+91 98765 00002',
        role: 'DIRECTOR',
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date('2026-01-05'),
        updatedAt: new Date('2026-01-05'),
    },
    {
        id: 'usr-head-03',
        email: 'saleshead@mvgreentech.com',
        passwordPlain: 'SalesHead@123',
        passwordHash: bcryptjs_1.default.hashSync('SalesHead@123', 10),
        firstName: 'Amit',
        lastName: 'Verma',
        phone: '+91 98765 00003',
        role: 'SALES_HEAD',
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date('2026-01-10'),
        updatedAt: new Date('2026-01-10'),
    },
    {
        id: 'usr-sales-04',
        email: 'sales@mvgreentech.com',
        passwordPlain: 'Sales@123',
        passwordHash: bcryptjs_1.default.hashSync('Sales@123', 10),
        firstName: 'Priya',
        lastName: 'Patel',
        phone: '+91 98765 00004',
        role: 'SALESPERSON',
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date('2026-01-15'),
        updatedAt: new Date('2026-01-15'),
    },
    {
        id: 'usr-ankit-05',
        email: 'akxcreative@gmail.com',
        passwordPlain: 'Pass@123',
        passwordHash: bcryptjs_1.default.hashSync('Pass@123', 10),
        firstName: 'Ankit',
        lastName: 'Kushwaha',
        phone: '7838444036',
        role: 'SALESPERSON',
        isActive: true,
        lastLogin: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];
exports.userStore = {
    getAll: () => [...exports.USER_STORE],
    getByEmail: (email) => {
        const norm = email.toLowerCase().trim();
        return exports.USER_STORE.find((u) => u.email.toLowerCase().trim() === norm);
    },
    getById: (id) => {
        return exports.USER_STORE.find((u) => u.id === id);
    },
    create: (data) => {
        const norm = data.email.toLowerCase().trim();
        const existing = exports.USER_STORE.find((u) => u.email.toLowerCase().trim() === norm);
        if (existing) {
            throw new Error('A user with this email already exists');
        }
        const newUser = {
            id: `usr-${Date.now()}`,
            email: norm,
            passwordPlain: data.passwordPlain,
            passwordHash: bcryptjs_1.default.hashSync(data.passwordPlain, 10),
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone || null,
            role: data.role || 'SALESPERSON',
            isActive: data.isActive !== undefined ? data.isActive : true,
            lastLogin: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        exports.USER_STORE.unshift(newUser);
        return newUser;
    },
    update: (id, updates) => {
        const user = exports.USER_STORE.find((u) => u.id === id);
        if (!user)
            return null;
        if (updates.email)
            user.email = updates.email.toLowerCase().trim();
        if (updates.firstName)
            user.firstName = updates.firstName;
        if (updates.lastName)
            user.lastName = updates.lastName;
        if (updates.phone !== undefined)
            user.phone = updates.phone;
        if (updates.role)
            user.role = updates.role;
        if (updates.isActive !== undefined)
            user.isActive = updates.isActive;
        if (updates.passwordPlain) {
            user.passwordPlain = updates.passwordPlain;
            user.passwordHash = bcryptjs_1.default.hashSync(updates.passwordPlain, 10);
        }
        user.updatedAt = new Date();
        return user;
    },
    toggleActive: (id) => {
        const user = exports.USER_STORE.find((u) => u.id === id);
        if (!user)
            return null;
        user.isActive = !user.isActive;
        user.updatedAt = new Date();
        return user;
    },
    delete: (id) => {
        const idx = exports.USER_STORE.findIndex((u) => u.id === id);
        if (idx !== -1) {
            exports.USER_STORE.splice(idx, 1);
            return true;
        }
        return false;
    },
    verifyPassword: (user, attemptPlain) => {
        if (user.passwordPlain && user.passwordPlain === attemptPlain) {
            return true;
        }
        if (user.passwordHash) {
            return bcryptjs_1.default.compareSync(attemptPlain, user.passwordHash);
        }
        return false;
    },
};
