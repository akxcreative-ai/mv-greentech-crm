import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

export interface StoredUser {
  id: string;
  email: string;
  passwordPlain?: string;
  passwordHash?: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Global In-Memory User Store (Preserved across requests in Node process)
export const USER_STORE: StoredUser[] = [
  {
    id: 'usr-admin-01',
    email: 'admin@mvgreentech.com',
    passwordPlain: 'Admin@123',
    passwordHash: bcrypt.hashSync('Admin@123', 10),
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
    passwordHash: bcrypt.hashSync('Director@123', 10),
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
    passwordHash: bcrypt.hashSync('SalesHead@123', 10),
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
    passwordHash: bcrypt.hashSync('Sales@123', 10),
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
    passwordHash: bcrypt.hashSync('Pass@123', 10),
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

export const userStore = {
  getAll: () => [...USER_STORE],

  getByEmail: (email: string) => {
    const norm = email.toLowerCase().trim();
    return USER_STORE.find((u) => u.email.toLowerCase().trim() === norm);
  },

  getById: (id: string) => {
    return USER_STORE.find((u) => u.id === id);
  },

  create: (data: {
    email: string;
    passwordPlain: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    role: Role;
    isActive?: boolean;
  }) => {
    const norm = data.email.toLowerCase().trim();
    const existing = USER_STORE.find((u) => u.email.toLowerCase().trim() === norm);
    if (existing) {
      throw new Error('A user with this email already exists');
    }

    const newUser: StoredUser = {
      id: `usr-${Date.now()}`,
      email: norm,
      passwordPlain: data.passwordPlain,
      passwordHash: bcrypt.hashSync(data.passwordPlain, 10),
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
      role: data.role || 'SALESPERSON',
      isActive: data.isActive !== undefined ? data.isActive : true,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    USER_STORE.unshift(newUser);
    return newUser;
  },

  update: (id: string, updates: Partial<StoredUser>) => {
    const user = USER_STORE.find((u) => u.id === id);
    if (!user) return null;

    if (updates.email) user.email = updates.email.toLowerCase().trim();
    if (updates.firstName) user.firstName = updates.firstName;
    if (updates.lastName) user.lastName = updates.lastName;
    if (updates.phone !== undefined) user.phone = updates.phone;
    if (updates.role) user.role = updates.role;
    if (updates.isActive !== undefined) user.isActive = updates.isActive;
    if (updates.passwordPlain) {
      user.passwordPlain = updates.passwordPlain;
      user.passwordHash = bcrypt.hashSync(updates.passwordPlain, 10);
    }
    user.updatedAt = new Date();
    return user;
  },

  toggleActive: (id: string) => {
    const user = USER_STORE.find((u) => u.id === id);
    if (!user) return null;
    user.isActive = !user.isActive;
    user.updatedAt = new Date();
    return user;
  },

  verifyPassword: (user: StoredUser, attemptPlain: string) => {
    if (user.passwordPlain && user.passwordPlain === attemptPlain) {
      return true;
    }
    if (user.passwordHash) {
      return bcrypt.compareSync(attemptPlain, user.passwordHash);
    }
    return false;
  },
};
