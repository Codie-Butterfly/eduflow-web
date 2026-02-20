export type PaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'MOBILE_MONEY_MTN'
  | 'MOBILE_MONEY_AIRTEL'
  | 'MOBILE_MONEY_ZAMTEL'
  | 'VISA'
  | 'MASTERCARD'
  | 'CHEQUE';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';

export interface Payment {
  id: number;
  studentFeeId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionRef: string;
  receiptNumber: string;
  status: PaymentStatus;
  paidBy: string;
  paidByPhone?: string;
  notes?: string;
  paidAt: string;
  createdAt: string;
  studentFee?: {
    id: number;
    feeName: string;
    studentName: string;
    studentId: string;
  };
}

export interface CreatePaymentRequest {
  studentFeeId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionRef?: string;
  paidBy: string;
  paidByPhone?: string;
  notes?: string;
}

export interface PaymentReceipt {
  receiptNumber: string;
  paymentDate: string;
  studentName: string;
  studentId: string;
  feeName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionRef: string;
  paidBy: string;
  balance: number;
}

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'CASH', label: 'Cash', icon: 'payments' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: 'account_balance' },
  { value: 'MOBILE_MONEY_MTN', label: 'MTN Mobile Money', icon: 'phone_android' },
  { value: 'MOBILE_MONEY_AIRTEL', label: 'Airtel Money', icon: 'phone_android' },
  { value: 'MOBILE_MONEY_ZAMTEL', label: 'Zamtel Money', icon: 'phone_android' },
  { value: 'VISA', label: 'Visa Card', icon: 'credit_card' },
  { value: 'MASTERCARD', label: 'Mastercard', icon: 'credit_card' },
  { value: 'CHEQUE', label: 'Cheque', icon: 'description' }
];

export const PAYMENT_STATUSES: { value: PaymentStatus; label: string; color: string }[] = [
  { value: 'PENDING', label: 'Pending', color: 'warn' },
  { value: 'COMPLETED', label: 'Completed', color: 'primary' },
  { value: 'FAILED', label: 'Failed', color: 'accent' },
  { value: 'REFUNDED', label: 'Refunded', color: 'accent' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'accent' }
];