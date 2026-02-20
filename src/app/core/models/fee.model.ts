import { ClassSummary } from './student.model';

export type FeeCategory = 'TUITION' | 'TRANSPORT' | 'BOARDING' | 'EXAM' |
  'ACTIVITY' | 'LIBRARY' | 'LABORATORY' | 'UNIFORM' | 'BOOKS' | 'OTHER';

export type FeeTerm = 'TERM_1' | 'TERM_2' | 'TERM_3' | 'ANNUAL';

export type FeeAssignmentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'WAIVED';

export interface Fee {
  id: number;
  category: FeeCategory;
  name: string;
  amount: number;
  academicYear: string;
  term?: FeeTerm;
  description?: string;
  mandatory: boolean;
  active: boolean;
  applicableClasses: ClassSummary[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFeeRequest {
  category: FeeCategory;
  name: string;
  amount: number;
  academicYear: string;
  term?: FeeTerm;
  description?: string;
  mandatory: boolean;
  applicableClassIds?: number[];
}

export interface UpdateFeeRequest extends CreateFeeRequest {
  active?: boolean;
}

export interface AssignFeeRequest {
  feeId: number;
  studentIds?: number[];
  classIds?: number[];
  dueDate: string;
  discountAmount?: number;
  discountReason?: string;
}

export interface StudentFee {
  id: number;
  feeName: string;
  category: FeeCategory;
  academicYear: string;
  term?: FeeTerm;
  dueDate: string;
  amount: number;
  discountAmount: number;
  discountReason?: string;
  netAmount: number;
  amountPaid: number;
  balance: number;
  status: FeeAssignmentStatus;
  payments: PaymentSummary[];
  student?: StudentInfo;
  fee?: FeeInfo;
}

export interface PaymentSummary {
  id: number;
  amount: number;
  paymentMethod: string;
  transactionRef: string;
  status: string;
  paidAt?: string;
}

export interface StudentInfo {
  id: number;
  studentId: string;
  fullName: string;
}

export interface FeeInfo {
  id: number;
  name: string;
  category: FeeCategory;
}

export interface ApplyDiscountRequest {
  discountAmount: number;
  discountReason: string;
}

export interface WaiveFeeRequest {
  reason: string;
}

export const FEE_CATEGORIES: { value: FeeCategory; label: string }[] = [
  { value: 'TUITION', label: 'Tuition' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'BOARDING', label: 'Boarding' },
  { value: 'EXAM', label: 'Examination' },
  { value: 'ACTIVITY', label: 'Activity' },
  { value: 'LIBRARY', label: 'Library' },
  { value: 'LABORATORY', label: 'Laboratory' },
  { value: 'UNIFORM', label: 'Uniform' },
  { value: 'BOOKS', label: 'Books' },
  { value: 'OTHER', label: 'Other' }
];

export const FEE_TERMS: { value: FeeTerm; label: string }[] = [
  { value: 'TERM_1', label: 'Term 1' },
  { value: 'TERM_2', label: 'Term 2' },
  { value: 'TERM_3', label: 'Term 3' },
  { value: 'ANNUAL', label: 'Annual' }
];