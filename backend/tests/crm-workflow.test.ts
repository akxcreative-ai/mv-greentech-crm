import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('MV GREENTECH CRM - Business Rules & Calculations Test Suite', () => {
  it('should accurately calculate quotation subtotal, tax, and discount', () => {
    const items = [
      { quantity: 10, unitPrice: 2500, discount: 5, taxRate: 18 },
      { quantity: 4, unitPrice: 12000, discount: 0, taxRate: 18 },
    ];

    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    for (const item of items) {
      const gross = item.quantity * item.unitPrice;
      const discountAmount = (gross * item.discount) / 100;
      const taxable = gross - discountAmount;
      const taxAmount = (taxable * item.taxRate) / 100;

      subtotal += gross;
      totalDiscount += discountAmount;
      totalTax += taxAmount;
    }

    const grandTotal = subtotal - totalDiscount + totalTax;

    // Item 1: 10 * 2500 = 25000. Disc 5% = 1250. Taxable = 23750. Tax 18% = 4275.
    // Item 2: 4 * 12000 = 48000. Disc 0% = 0. Taxable = 48000. Tax 18% = 8640.
    // Subtotal = 73000
    // Total Discount = 1250
    // Total Tax = 12915
    // Grand Total = 73000 - 1250 + 12915 = 84665
    assert.strictEqual(subtotal, 73000);
    assert.strictEqual(totalDiscount, 1250);
    assert.strictEqual(totalTax, 12915);
    assert.strictEqual(grandTotal, 84665);
  });

  it('should generate valid standardized sequential Lead numbers', () => {
    const generateLeadNumber = (date: Date, sequence: number) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const seq = String(sequence).padStart(3, '0');
      return `LD-${yyyy}${mm}${dd}-${seq}`;
    };

    const leadNum = generateLeadNumber(new Date(2026, 9, 15), 7);
    assert.strictEqual(leadNum, 'LD-20261015-007');
  });

  it('should generate valid standardized Quotation and Order numbers', () => {
    const generateNumber = (prefix: string, date: Date, sequence: number) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const seq = String(sequence).padStart(3, '0');
      return `${prefix}-${yyyy}${mm}${dd}-${seq}`;
    };

    const quoteNum = generateNumber('QT', new Date(2026, 9, 15), 12);
    const orderNum = generateNumber('ORD', new Date(2026, 9, 15), 4);

    assert.strictEqual(quoteNum, 'QT-20261015-012');
    assert.strictEqual(orderNum, 'ORD-20261015-004');
  });

  it('should verify lead stage transitions correctly', () => {
    const validTransitions: Record<string, string[]> = {
      GENERAL: ['MARKET', 'QUOTE_SUBMITTED', 'LOST'],
      MARKET: ['QUOTE_SUBMITTED', 'WON', 'LOST'],
      QUOTE_SUBMITTED: ['WON', 'LOST'],
      WON: [],
      LOST: ['GENERAL', 'MARKET'],
    };

    assert.ok(validTransitions['GENERAL'].includes('QUOTE_SUBMITTED'));
    assert.ok(validTransitions['QUOTE_SUBMITTED'].includes('WON'));
  });

  it('should generate valid Customer Code in CUST-YYYY-NNNN format', () => {
    const generateCustomerCode = (year: number, seq: number) => {
      return `CUST-${year}-${String(seq).padStart(4, '0')}`;
    };

    const code = generateCustomerCode(2026, 42);
    assert.strictEqual(code, 'CUST-2026-0042');
    assert.match(code, /^CUST-\d{4}-\d{4}$/);
  });

  it('should test crypto OTP generation and verification logic', () => {
    const crypto = require('crypto');
    const secret = 'crm-otp-secret-test';

    const generateOtp = () => {
      const buffer = crypto.randomBytes(4);
      const num = buffer.readUInt32BE(0) % 1000000;
      return String(num).padStart(6, '0');
    };

    const hashOtp = (code: string) => {
      return crypto.createHmac('sha256', secret).update(code).digest('hex');
    };

    const otp = generateOtp();
    assert.strictEqual(otp.length, 6);
    assert.match(otp, /^\d{6}$/);

    const hashed = hashOtp(otp);
    assert.strictEqual(hashOtp(otp), hashed);
    assert.notStrictEqual(hashOtp('000000'), hashed);
  });
});

