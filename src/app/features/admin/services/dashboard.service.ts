import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, catchError, of } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Payment, PAYMENT_METHODS } from '../../../core/models';

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  feesCollected: number;
  outstandingFees: number;
  totalFeesDue: number;
  collectionRate: number;
}

export interface RecentPayment {
  id: number;
  studentName: string;
  studentId: string;
  amount: number;
  amountPaid?: number;
  balance?: number;
  method: string;
  status: 'completed' | 'pending' | 'failed';
  date: Date;
  feeName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/admin`;

  // Mock data for fallback
  private mockStats: DashboardStats = {
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    feesCollected: 0,
    outstandingFees: 0,
    totalFeesDue: 0,
    collectionRate: 0
  };

  private mockPayments: RecentPayment[] = [];

  getDashboardStats(): Observable<DashboardStats> {
    console.log('Fetching dashboard stats...');
    return this.http.get<any>(`${this.baseUrl}/dashboard/stats`).pipe(
      map(response => {
        console.log('Dashboard stats API response:', response);
        return this.transformStats(response);
      }),
      catchError((error) => {
        console.error('Dashboard stats API error:', error);
        // Try to fetch individual counts as fallback
        return this.fetchIndividualStats();
      })
    );
  }

  private fetchIndividualStats(): Observable<DashboardStats> {
    console.log('Fetching individual stats as fallback...');
    return forkJoin({
      students: this.http.get<any>(`${this.baseUrl}/students?page=0&size=1`).pipe(
        map(res => res.totalElements || res.total || 0),
        catchError(() => of(0))
      ),
      teachers: this.http.get<any>(`${this.baseUrl}/staff/teachers?page=0&size=1`).pipe(
        map(res => res.totalElements || res.total || 0),
        catchError(() => of(0))
      ),
      classes: this.http.get<any>(`${this.baseUrl}/classes?page=0&size=1`).pipe(
        map(res => res.totalElements || res.total || 0),
        catchError(() => of(0))
      ),
      feeStats: this.http.get<any>(`${this.baseUrl}/fees/stats`).pipe(
        catchError(() => of({ collected: 0, outstanding: 0, total: 0 }))
      )
    }).pipe(
      map(results => {
        console.log('Individual stats fetched:', results);
        return {
          totalStudents: results.students,
          totalTeachers: results.teachers,
          totalClasses: results.classes,
          feesCollected: results.feeStats.collected || results.feeStats.totalCollected || 0,
          outstandingFees: results.feeStats.outstanding || results.feeStats.totalOutstanding || 0,
          totalFeesDue: results.feeStats.total || results.feeStats.totalDue || 0,
          collectionRate: results.feeStats.collectionRate || 0
        };
      }),
      catchError(() => of(this.mockStats))
    );
  }

  getRecentPayments(limit: number = 5): Observable<RecentPayment[]> {
    console.log('Fetching recent payments from both tables...');

    // Fetch from both fee assignments and payments tables
    return forkJoin({
      feeAssignments: this.http.get<any>(`${this.baseUrl}/fees/assignments?page=0&size=${limit}`).pipe(
        map(response => {
          console.log('Fee assignments API response:', response);
          return response.content || response.data || response || [];
        }),
        catchError((error) => {
          console.error('Fee assignments API error:', error);
          return of([]);
        })
      ),
      payments: this.http.get<any>(`${this.baseUrl}/payments?page=0&size=${limit}&sort=paidAt,desc`).pipe(
        map(response => {
          console.log('Payments API response:', response);
          return response.content || response.data || response || [];
        }),
        catchError((error) => {
          console.error('Payments API error:', error);
          return of([]);
        })
      )
    }).pipe(
      map(results => {
        // Transform and combine both data sources
        const fromFeeAssignments = results.feeAssignments.map((f: any) => this.transformFeeAssignment(f));
        const fromPayments = results.payments.map((p: any) => this.transformPayment(p));

        // Combine and sort by date (most recent first)
        const combined = [...fromFeeAssignments, ...fromPayments];
        combined.sort((a, b) => b.date.getTime() - a.date.getTime());

        // Return top entries
        return combined.slice(0, limit);
      }),
      catchError(() => of(this.mockPayments))
    );
  }

  private transformFeeAssignment(data: any): RecentPayment {
    const status = (data.status || 'PENDING').toLowerCase();

    return {
      id: data.id,
      studentName: data.student?.fullName || data.studentName || 'Unknown',
      studentId: data.student?.studentId || data.studentId || '',
      amount: data.netAmount || data.amount || 0,
      amountPaid: data.amountPaid || 0,
      balance: data.balance || 0,
      method: '-',
      status: status === 'paid' ? 'completed' : status === 'overdue' ? 'failed' : 'pending',
      date: new Date(data.dueDate || data.createdAt || new Date()),
      feeName: data.feeName || data.fee?.name || ''
    };
  }

  private transformStats(data: any): DashboardStats {
    return {
      totalStudents: data.totalStudents || data.studentsCount || data.students || 0,
      totalTeachers: data.totalTeachers || data.teachersCount || data.teachers || 0,
      totalClasses: data.totalClasses || data.classesCount || data.classes || 0,
      feesCollected: data.feesCollected || data.totalCollected || data.collected || 0,
      outstandingFees: data.outstandingFees || data.totalOutstanding || data.outstanding || 0,
      totalFeesDue: data.totalFeesDue || data.totalDue || 0,
      collectionRate: data.collectionRate || 0
    };
  }

  private transformPayment(data: any): RecentPayment {
    const methodLabel = this.getPaymentMethodLabel(data.paymentMethod || data.payment_method || data.method);
    const status = (data.status || 'PENDING').toLowerCase();

    return {
      id: data.id,
      studentName: data.studentFee?.studentName || data.studentName || data.student_name || 'Unknown',
      studentId: data.studentFee?.studentId || data.studentId || data.student_id || '',
      amount: data.amount || 0,
      method: methodLabel,
      status: status === 'completed' ? 'completed' : status === 'failed' ? 'failed' : 'pending',
      date: new Date(data.paidAt || data.paid_at || data.createdAt || data.created_at || new Date()),
      feeName: data.studentFee?.feeName || data.feeName || data.fee_name
    };
  }

  private getPaymentMethodLabel(method: string): string {
    const found = PAYMENT_METHODS.find(m => m.value === method);
    if (found) return found.label;

    // Fallback for display-friendly names
    switch (method) {
      case 'CASH': return 'Cash';
      case 'BANK_TRANSFER': return 'Bank Transfer';
      case 'MOBILE_MONEY_MTN': return 'MTN Mobile Money';
      case 'MOBILE_MONEY_AIRTEL': return 'Airtel Money';
      case 'MOBILE_MONEY_ZAMTEL': return 'Zamtel Money';
      case 'VISA': return 'Visa Card';
      case 'MASTERCARD': return 'Mastercard';
      case 'CHEQUE': return 'Cheque';
      default: return method || 'Unknown';
    }
  }
}