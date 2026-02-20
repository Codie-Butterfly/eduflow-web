import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { StudentFee, Payment, PagedResponse } from '../../../core/models';

export interface StudentProfile {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender: string;
  address?: string;
  currentClass?: {
    id: number;
    name: string;
    grade: number;
    section?: string;
    academicYear: string;
  };
  enrollmentDate?: string;
  status: string;
}

export interface StudentDashboardStats {
  totalFees: number;
  totalPaid: number;
  balance: number;
  pendingFees: number;
  overdueFees: number;
}

@Injectable({
  providedIn: 'root'
})
export class StudentPortalService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/student`;

  // Mock profile
  private mockProfile: StudentProfile = {
    id: 1,
    studentId: 'STU-2024-001',
    firstName: 'John',
    lastName: 'Mulenga',
    fullName: 'John Mulenga',
    email: 'john.mulenga@student.edu',
    phone: '+260977123456',
    dateOfBirth: '2010-05-15',
    gender: 'MALE',
    address: '123 Main Street, Lusaka',
    currentClass: {
      id: 1,
      name: 'Grade 8A',
      grade: 8,
      section: 'A',
      academicYear: '2024'
    },
    enrollmentDate: '2022-01-10',
    status: 'ACTIVE'
  };

  private mockFees: StudentFee[] = [
    {
      id: 1,
      feeName: 'Term 1 Tuition',
      category: 'TUITION',
      academicYear: '2024',
      term: 'TERM_1',
      dueDate: '2024-02-15',
      amount: 8000,
      discountAmount: 0,
      netAmount: 8000,
      amountPaid: 5000,
      balance: 3000,
      status: 'PARTIAL',
      payments: [
        { id: 1, amount: 5000, paymentMethod: 'MOBILE_MONEY_MTN', transactionRef: 'MM-001', status: 'COMPLETED', paidAt: '2024-01-20' }
      ]
    },
    {
      id: 2,
      feeName: 'Transport Fee',
      category: 'TRANSPORT',
      academicYear: '2024',
      term: 'TERM_1',
      dueDate: '2024-02-01',
      amount: 2000,
      discountAmount: 0,
      netAmount: 2000,
      amountPaid: 0,
      balance: 2000,
      status: 'OVERDUE',
      payments: []
    },
    {
      id: 3,
      feeName: 'Exam Fee',
      category: 'EXAM',
      academicYear: '2024',
      term: 'TERM_1',
      dueDate: '2024-03-15',
      amount: 500,
      discountAmount: 0,
      netAmount: 500,
      amountPaid: 500,
      balance: 0,
      status: 'PAID',
      payments: [
        { id: 2, amount: 500, paymentMethod: 'CASH', transactionRef: 'CASH-002', status: 'COMPLETED', paidAt: '2024-02-10' }
      ]
    }
  ];

  private mockPayments: Payment[] = [
    {
      id: 1,
      studentFeeId: 1,
      amount: 5000,
      paymentMethod: 'MOBILE_MONEY_MTN',
      transactionRef: 'MM-123456',
      receiptNumber: 'RCP-2024-001',
      status: 'COMPLETED',
      paidBy: 'James Mulenga (Parent)',
      paidAt: '2024-01-20T10:30:00',
      createdAt: '2024-01-20T10:30:00',
      studentFee: { id: 1, feeName: 'Term 1 Tuition', studentName: 'John Mulenga', studentId: 'STU-2024-001' }
    },
    {
      id: 2,
      studentFeeId: 3,
      amount: 500,
      paymentMethod: 'CASH',
      transactionRef: 'CASH-789',
      receiptNumber: 'RCP-2024-002',
      status: 'COMPLETED',
      paidBy: 'James Mulenga (Parent)',
      paidAt: '2024-02-10T14:15:00',
      createdAt: '2024-02-10T14:15:00',
      studentFee: { id: 3, feeName: 'Exam Fee', studentName: 'John Mulenga', studentId: 'STU-2024-001' }
    }
  ];

  getProfile(): Observable<StudentProfile> {
    return this.http.get<StudentProfile>(`${this.baseUrl}/profile`).pipe(
      catchError(() => of(this.mockProfile))
    );
  }

  getDashboardStats(): Observable<StudentDashboardStats> {
    return this.http.get<StudentDashboardStats>(`${this.baseUrl}/dashboard`).pipe(
      catchError(() => of({
        totalFees: 10500,
        totalPaid: 5500,
        balance: 5000,
        pendingFees: 2,
        overdueFees: 1
      }))
    );
  }

  getMyFees(): Observable<StudentFee[]> {
    return this.http.get<StudentFee[]>(`${this.baseUrl}/fees`).pipe(
      catchError(() => of(this.mockFees))
    );
  }

  getPaymentHistory(page: number = 0, size: number = 10): Observable<PagedResponse<Payment>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PagedResponse<Payment>>(`${this.baseUrl}/payments`, { params }).pipe(
      catchError(() => of({
        content: this.mockPayments,
        totalElements: this.mockPayments.length,
        totalPages: 1,
        size,
        page,
        first: page === 0,
        last: true
      }))
    );
  }
}