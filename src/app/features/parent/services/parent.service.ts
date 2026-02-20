import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Student, StudentFee, Payment, PagedResponse, CreatePaymentRequest } from '../../../core/models';

export interface ChildSummary {
  id: number;
  studentId: string;
  fullName: string;
  currentClass: string;
  grade: number;
  photoUrl?: string;
  totalFees: number;
  totalPaid: number;
  balance: number;
  pendingFees: number;
}

export interface ParentDashboardStats {
  totalChildren: number;
  totalFees: number;
  totalPaid: number;
  totalBalance: number;
  overdueCount: number;
  upcomingDueCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class ParentService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/parent`;

  // Mock data for development/fallback
  private mockChildren: ChildSummary[] = [
    {
      id: 1,
      studentId: 'STU-2024-001',
      fullName: 'John Mulenga',
      currentClass: 'Grade 8A',
      grade: 8,
      totalFees: 15000,
      totalPaid: 10000,
      balance: 5000,
      pendingFees: 2
    },
    {
      id: 2,
      studentId: 'STU-2024-002',
      fullName: 'Mary Mulenga',
      currentClass: 'Grade 5B',
      grade: 5,
      totalFees: 12000,
      totalPaid: 12000,
      balance: 0,
      pendingFees: 0
    }
  ];

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
      paidBy: 'James Mulenga',
      paidByPhone: '+260977123456',
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
      paidBy: 'James Mulenga',
      paidAt: '2024-02-10T14:15:00',
      createdAt: '2024-02-10T14:15:00',
      studentFee: { id: 3, feeName: 'Exam Fee', studentName: 'John Mulenga', studentId: 'STU-2024-001' }
    },
    {
      id: 3,
      studentFeeId: 4,
      amount: 12000,
      paymentMethod: 'BANK_TRANSFER',
      transactionRef: 'BT-456789',
      receiptNumber: 'RCP-2024-003',
      status: 'COMPLETED',
      paidBy: 'James Mulenga',
      paidAt: '2024-01-05T09:00:00',
      createdAt: '2024-01-05T09:00:00',
      studentFee: { id: 4, feeName: 'Term 1 Tuition', studentName: 'Mary Mulenga', studentId: 'STU-2024-002' }
    }
  ];

  getDashboardStats(): Observable<ParentDashboardStats> {
    return this.http.get<ParentDashboardStats>(`${this.baseUrl}/dashboard`).pipe(
      catchError(() => of({
        totalChildren: 2,
        totalFees: 27000,
        totalPaid: 22000,
        totalBalance: 5000,
        overdueCount: 1,
        upcomingDueCount: 1
      }))
    );
  }

  getChildren(): Observable<ChildSummary[]> {
    return this.http.get<ChildSummary[]>(`${this.baseUrl}/children`).pipe(
      catchError(() => of(this.mockChildren))
    );
  }

  getChildDetails(childId: number): Observable<Student> {
    return this.http.get<Student>(`${this.baseUrl}/children/${childId}`).pipe(
      catchError(() => {
        const child = this.mockChildren.find(c => c.id === childId);
        if (!child) throw new Error('Child not found');

        const student: Student = {
          id: child.id,
          studentId: child.studentId,
          firstName: child.fullName.split(' ')[0],
          lastName: child.fullName.split(' ')[1],
          fullName: child.fullName,
          dateOfBirth: '2010-05-15',
          gender: 'MALE',
          email: `${child.fullName.toLowerCase().replace(' ', '.')}@student.edu`,
          enrollmentDate: '2022-01-10',
          status: 'ACTIVE',
          currentClass: { id: 1, name: child.currentClass, grade: child.grade, academicYear: '2024' },
          parent: {
            id: 100,
            name: 'James Mulenga',
            phone: '+260977123456',
            email: 'james.mulenga@email.com'
          }
        };
        return of(student);
      })
    );
  }

  getChildFees(childId: number): Observable<StudentFee[]> {
    return this.http.get<StudentFee[]>(`${this.baseUrl}/children/${childId}/fees`).pipe(
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

  makePayment(data: CreatePaymentRequest): Observable<Payment> {
    return this.http.post<Payment>(`${this.baseUrl}/payments`, data).pipe(
      catchError(() => {
        const payment: Payment = {
          id: Date.now(),
          studentFeeId: data.studentFeeId,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          transactionRef: data.transactionRef || `TXN-${Date.now()}`,
          receiptNumber: `RCP-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
          status: 'COMPLETED',
          paidBy: data.paidBy,
          paidByPhone: data.paidByPhone,
          paidAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        return of(payment);
      })
    );
  }

  downloadReceipt(paymentId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/payments/${paymentId}/receipt`, { responseType: 'blob' });
  }
}