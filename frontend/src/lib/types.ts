export type Role = 'DIRECTOR' | 'SALES_HEAD' | 'SALESPERSON' | 'ADMINISTRATOR';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: Role;
  isActive: boolean;
  lastLogin?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type LeadStatus = 'GENERAL' | 'MARKET' | 'QUOTE_SUBMITTED' | 'WON' | 'LOST';

export interface Lead {
  id: string;
  leadNumber: string;
  loginDate: string;
  customerVisitDate?: string | null;
  firstOrderDate?: string | null;
  customerId?: string | null;
  customerName: string;
  contactPerson?: string | null;
  designation?: string | null;
  mobile?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  industry?: string | null;
  manufacturerOrTrader?: string | null;
  productsManufactured?: string | null;
  productsRequired?: string | null;
  partType?: string | null;
  requirementType?: string | null;
  annualQuantity?: string | null;
  competitors?: string | null;
  enquiryValue?: number | string | null;
  currency: string;
  accountOwnerId?: string | null;
  createdById?: string | null;
  updatedById?: string | null;
  accountOwner?: User | null;
  customer?: Customer | null;
  status: LeadStatus;
  nextAction?: string | null;
  nextFollowUpDate?: string | null;
  remarks?: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  activities?: LeadActivity[];
  followUps?: FollowUp[];
  quotations?: Quotation[];
}

export interface LeadActivity {
  id: string;
  leadId: string;
  userId: string;
  type: string;
  description: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  user?: User;
}

export interface Customer {
  id: string;
  customerCode?: string | null;
  name: string;
  industry?: string | null;
  customerType?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  gstNumber?: string | null;
  website?: string | null;
  notes?: string | null;
  accountOwnerId?: string | null;
  totalConfirmedSales?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  contacts?: Contact[];
  leads?: Lead[];
  quotations?: Quotation[];
  orders?: Order[];
}

export interface Contact {
  id: string;
  customerId: string;
  name: string;
  designation?: string | null;
  mobile?: string | null;
  email?: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ItemStatus = 'ACTIVE' | 'DISCONTINUED' | 'SUPERSEDED';

export interface Item {
  id: string;
  itemCode: string;
  description: string;
  unit?: string | null;
  standardCost?: number | string | null;
  standardPrice?: number | string | null;
  currency: string;
  ppq?: string | null;
  currentStock?: number | null;
  leadTimeDays?: number | null;
  supplierCode?: string | null;
  supplierCurrency?: string | null;
  supplierCost?: number | string | null;
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
}

export type QuotationStatus = 'DRAFT' | 'SENT' | 'NEGOTIATION' | 'APPROVED' | 'LOST' | 'EXPIRED' | 'CONVERTED';

export interface QuotationItem {
  id?: string;
  quotationId?: string;
  itemId?: string | null;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  taxRate: number;
  lineTotal: number;
  sortOrder?: number;
  item?: Item | null;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  revision: number;
  parentId?: string | null;
  customerId: string;
  leadId?: string | null;
  userId: string;
  quotationDate: string;
  validityDate: string;
  currency: string;
  subtotal: number | string;
  taxAmount: number | string;
  discountAmount: number | string;
  totalAmount: number | string;
  paymentTerms?: string | null;
  deliveryTerms?: string | null;
  notes?: string | null;
  specifications?: string | null;
  status: QuotationStatus;
  lostReason?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  lead?: Lead;
  user?: User;
  items?: QuotationItem[];
}

export type OrderStatus = 'CONFIRMED' | 'IN_PRODUCTION' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  id?: string;
  orderId?: string;
  itemId?: string | null;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
  item?: Item | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  quotationId?: string | null;
  customerId: string;
  leadId?: string | null;
  orderDate: string;
  currency: string;
  totalAmount: number | string;
  status: OrderStatus;
  paymentTerms?: string | null;
  deliveryTerms?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  lead?: Lead;
  quotation?: Quotation;
  items?: OrderItem[];
}

export type FollowUpStatus = 'PENDING' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';

export interface FollowUp {
  id: string;
  leadId?: string | null;
  customerId?: string | null;
  userId: string;
  type: string;
  scheduledDate: string;
  completedDate?: string | null;
  status: FollowUpStatus;
  notes?: string | null;
  nextAction?: string | null;
  createdAt: string;
  updatedAt: string;
  lead?: Lead;
  user?: User;
}

export interface CustomerVisit {
  id: string;
  customerId?: string | null;
  leadId?: string | null;
  userId: string;
  visitDate: string;
  purpose?: string | null;
  notes?: string | null;
  outcome?: string | null;
  nextAction?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface SalesTarget {
  id: string;
  userId: string;
  month: number;
  year: number;
  targetAmount: number | string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface Setting {
  id?: string;
  key: string;
  value: Record<string, unknown> | string | number | boolean;
  updatedAt?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DashboardStats {
  totalLeads: number;
  activeOpportunities: number;
  totalEnquiryValue: number;
  wonOrderValue: number;
  todaysFollowUps: number;
  overdueFollowUps: number;
  monthlyTarget: number;
  achievementPercentage: number;
  monthlyPerformance: Array<{
    month: string;
    enquiryValue: number;
    orderValue: number;
    target: number;
  }>;
  leadsByStatus: Array<{
    status: LeadStatus;
    count: number;
    percentage: number;
  }>;
  teamPerformance: Array<{
    userId: string;
    name: string;
    role: string;
    leadsCount: number;
    wonValue: number;
    target: number;
    achievementRate: number;
  }>;
  upcomingFollowUps: FollowUp[];
  recentActivities: LeadActivity[];
}

export interface Column<T> {
  header: string;
  accessorKey?: keyof T | string;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
}

export interface CountryMaster {
  code: string;
  name: string;
  phoneCode: string;
  currency: string;
  states?: StateMaster[];
}

export interface StateMaster {
  code: string;
  name: string;
  cities: string[];
}

export interface OtpPolicy {
  otpEnabled: boolean;
  requireOtpForLogin: boolean;
  channels: ('EMAIL' | 'SMS')[];
  expiryMinutes: number;
  cooldownSeconds: number;
  maxAttempts: number;
  hasSmtpConfigured: boolean;
  hasSmsConfigured: boolean;
}

export interface AuditLogItem {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  changes?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  } | null;
}
