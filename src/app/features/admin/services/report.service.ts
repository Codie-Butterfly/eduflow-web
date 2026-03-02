import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, catchError, of } from 'rxjs';

import { environment } from '../../../../environments/environment';

export interface StudentReportSummary {
  totalStudents: number;
  activeStudents: number;
  maleStudents: number;
  femaleStudents: number;
  newEnrollments: number;
}

export interface StudentsByClass {
  classId: number;
  className: string;
  grade: number;
  section: string;
  totalStudents: number;
  maleCount: number;
  femaleCount: number;
}

export interface StudentsByGrade {
  grade: number;
  totalStudents: number;
  maleCount: number;
  femaleCount: number;
  classCount: number;
}

export interface EnrollmentTrend {
  month: string;
  year: number;
  count: number;
}

export interface StudentReportData {
  summary: StudentReportSummary;
  byClass: StudentsByClass[];
  byGrade: StudentsByGrade[];
  enrollmentTrends: EnrollmentTrend[];
}

// Fee Collection Report
export interface FeeCollectionSummary {
  totalFeesDue: number;
  totalCollected: number;
  totalOutstanding: number;
  collectionRate: number;
  totalStudentsWithFees: number;
  fullyPaidCount: number;
  partialPaidCount: number;
  unpaidCount: number;
}

export interface CollectionByMonth {
  month: string;
  year: number;
  collected: number;
  outstanding: number;
}

export interface CollectionByClass {
  classId: number;
  className: string;
  grade: number;
  totalDue: number;
  totalCollected: number;
  outstanding: number;
  studentCount: number;
  collectionRate: number;
}

export interface CollectionByCategory {
  category: string;
  totalDue: number;
  totalCollected: number;
  outstanding: number;
  collectionRate: number;
}

export interface FeeCollectionReportData {
  summary: FeeCollectionSummary;
  byMonth: CollectionByMonth[];
  byClass: CollectionByClass[];
  byCategory: CollectionByCategory[];
}

// Payment History Report
export interface PaymentRecord {
  id: number;
  studentId: number;
  studentName: string;
  studentCode: string;
  className: string;
  feeName: string;
  amount: number;
  paymentMethod: string;
  transactionRef: string;
  paidAt: Date;
  status: string;
}

export interface PaymentsByMethod {
  method: string;
  count: number;
  totalAmount: number;
}

export interface PaymentHistoryReportData {
  payments: PaymentRecord[];
  byMethod: PaymentsByMethod[];
  totalPayments: number;
  totalAmount: number;
}

// Overdue Fees Report
export interface OverdueFeeRecord {
  studentId: number;
  studentName: string;
  studentCode: string;
  className: string;
  feeName: string;
  category: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
  dueDate: Date;
  daysOverdue: number;
}

export interface OverdueFeesReportData {
  records: OverdueFeeRecord[];
  totalOverdueAmount: number;
  totalStudentsOverdue: number;
  averageDaysOverdue: number;
}

// Pending Payments Report
export interface PendingPaymentRecord {
  studentId: number;
  studentName: string;
  studentCode: string;
  className: string;
  totalFees: number;
  totalPaid: number;
  balance: number;
  feeCount: number;
  oldestDueDate: Date;
  status: 'PENDING' | 'PARTIAL' | 'OVERDUE';
}

export interface PendingPaymentsReportData {
  records: PendingPaymentRecord[];
  totalPendingAmount: number;
  totalStudents: number;
  pendingCount: number;
  partialCount: number;
  overdueCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/admin`;

  getStudentReport(academicYear?: string): Observable<StudentReportData> {
    const params: any = {};
    if (academicYear) {
      params.academicYear = academicYear;
    }

    // Try to fetch from dedicated report endpoint first
    return this.http.get<StudentReportData>(`${this.baseUrl}/reports/students`, { params }).pipe(
      catchError(() => {
        // Fallback: Build report from student data
        return this.buildStudentReportFromData(academicYear);
      })
    );
  }

  private buildStudentReportFromData(academicYear?: string): Observable<StudentReportData> {
    const params: any = { page: 0, size: 1000 };
    if (academicYear) {
      params.academicYear = academicYear;
    }

    return forkJoin({
      students: this.http.get<any>(`${this.baseUrl}/students`, { params }).pipe(
        map(res => res.content || res.data || []),
        catchError(() => of([]))
      ),
      classes: this.http.get<any>(`${this.baseUrl}/classes`, { params: { page: 0, size: 100 } }).pipe(
        map(res => res.content || res.data || []),
        catchError(() => of([]))
      )
    }).pipe(
      map(({ students, classes }) => this.processStudentData(students, classes))
    );
  }

  private processStudentData(students: any[], classes: any[]): StudentReportData {
    // Build summary
    const summary: StudentReportSummary = {
      totalStudents: students.length,
      activeStudents: students.filter(s => s.status === 'ACTIVE' || !s.status).length,
      maleStudents: students.filter(s => s.gender === 'MALE').length,
      femaleStudents: students.filter(s => s.gender === 'FEMALE').length,
      newEnrollments: students.filter(s => {
        if (!s.enrollmentDate && !s.createdAt) return false;
        const enrollDate = new Date(s.enrollmentDate || s.createdAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return enrollDate >= thirtyDaysAgo;
      }).length
    };

    // Build by class
    const classMap = new Map<number, StudentsByClass>();
    classes.forEach(cls => {
      classMap.set(cls.id, {
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        section: cls.section || '',
        totalStudents: 0,
        maleCount: 0,
        femaleCount: 0
      });
    });

    students.forEach(student => {
      const classId = student.classId || student.currentClass?.id;
      if (classId && classMap.has(classId)) {
        const classData = classMap.get(classId)!;
        classData.totalStudents++;
        if (student.gender === 'MALE') {
          classData.maleCount++;
        } else if (student.gender === 'FEMALE') {
          classData.femaleCount++;
        }
      }
    });

    const byClass = Array.from(classMap.values())
      .filter(c => c.totalStudents > 0)
      .sort((a, b) => a.grade - b.grade || a.className.localeCompare(b.className));

    // Build by grade
    const gradeMap = new Map<number, StudentsByGrade>();
    byClass.forEach(cls => {
      if (!gradeMap.has(cls.grade)) {
        gradeMap.set(cls.grade, {
          grade: cls.grade,
          totalStudents: 0,
          maleCount: 0,
          femaleCount: 0,
          classCount: 0
        });
      }
      const gradeData = gradeMap.get(cls.grade)!;
      gradeData.totalStudents += cls.totalStudents;
      gradeData.maleCount += cls.maleCount;
      gradeData.femaleCount += cls.femaleCount;
      gradeData.classCount++;
    });

    const byGrade = Array.from(gradeMap.values()).sort((a, b) => a.grade - b.grade);

    // Build enrollment trends (last 6 months)
    const enrollmentTrends: EnrollmentTrend[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const count = students.filter(s => {
        const enrollDate = new Date(s.enrollmentDate || s.createdAt);
        return enrollDate >= monthStart && enrollDate <= monthEnd;
      }).length;

      enrollmentTrends.push({
        month: date.toLocaleString('default', { month: 'short' }),
        year: date.getFullYear(),
        count
      });
    }

    return { summary, byClass, byGrade, enrollmentTrends };
  }

  exportStudentReport(academicYear?: string): Observable<Blob> {
    const params: any = { format: 'csv' };
    if (academicYear) {
      params.academicYear = academicYear;
    }

    return this.http.get(`${this.baseUrl}/reports/students/export`, {
      params,
      responseType: 'blob'
    });
  }

  // Fee Collection Report
  getFeeCollectionReport(academicYear?: string): Observable<FeeCollectionReportData> {
    return this.http.get<any>(`${this.baseUrl}/fees/assignments`, { params: { page: 0, size: 1000 } }).pipe(
      map(response => {
        const assignments = response.content || response.data || [];
        return this.processFeeCollectionData(assignments);
      }),
      catchError(() => of({
        summary: { totalFeesDue: 0, totalCollected: 0, totalOutstanding: 0, collectionRate: 0, totalStudentsWithFees: 0, fullyPaidCount: 0, partialPaidCount: 0, unpaidCount: 0 },
        byMonth: [],
        byClass: [],
        byCategory: []
      }))
    );
  }

  private processFeeCollectionData(assignments: any[]): FeeCollectionReportData {
    let totalDue = 0;
    let totalCollected = 0;
    let fullyPaid = 0;
    let partialPaid = 0;
    let unpaid = 0;
    const studentSet = new Set<number>();

    const classMap = new Map<string, CollectionByClass>();
    const categoryMap = new Map<string, CollectionByCategory>();
    const monthMap = new Map<string, CollectionByMonth>();

    assignments.forEach(a => {
      const due = a.netAmount || a.amount || 0;
      const paid = a.amountPaid || 0;
      const balance = a.balance || (due - paid);

      totalDue += due;
      totalCollected += paid;

      if (a.student?.id) studentSet.add(a.student.id);

      if (balance <= 0) fullyPaid++;
      else if (paid > 0) partialPaid++;
      else unpaid++;

      // By class
      const className = a.student?.className || 'Unknown';
      if (!classMap.has(className)) {
        classMap.set(className, {
          classId: 0,
          className,
          grade: 0,
          totalDue: 0,
          totalCollected: 0,
          outstanding: 0,
          studentCount: 0,
          collectionRate: 0
        });
      }
      const classData = classMap.get(className)!;
      classData.totalDue += due;
      classData.totalCollected += paid;
      classData.outstanding += balance;
      classData.studentCount++;

      // By category
      const category = a.category || 'OTHER';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          category,
          totalDue: 0,
          totalCollected: 0,
          outstanding: 0,
          collectionRate: 0
        });
      }
      const catData = categoryMap.get(category)!;
      catData.totalDue += due;
      catData.totalCollected += paid;
      catData.outstanding += balance;

      // By month (using due date or created date)
      const dateStr = a.dueDate || a.createdAt;
      if (dateStr) {
        const date = new Date(dateStr);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, {
            month: date.toLocaleString('default', { month: 'short' }),
            year: date.getFullYear(),
            collected: 0,
            outstanding: 0
          });
        }
        const monthData = monthMap.get(monthKey)!;
        monthData.collected += paid;
        monthData.outstanding += balance;
      }
    });

    // Calculate collection rates
    classMap.forEach(c => {
      c.collectionRate = c.totalDue > 0 ? (c.totalCollected / c.totalDue) * 100 : 0;
    });
    categoryMap.forEach(c => {
      c.collectionRate = c.totalDue > 0 ? (c.totalCollected / c.totalDue) * 100 : 0;
    });

    return {
      summary: {
        totalFeesDue: totalDue,
        totalCollected,
        totalOutstanding: totalDue - totalCollected,
        collectionRate: totalDue > 0 ? (totalCollected / totalDue) * 100 : 0,
        totalStudentsWithFees: studentSet.size,
        fullyPaidCount: fullyPaid,
        partialPaidCount: partialPaid,
        unpaidCount: unpaid
      },
      byMonth: Array.from(monthMap.values()).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return new Date(`${a.month} 1, ${a.year}`).getMonth() - new Date(`${b.month} 1, ${b.year}`).getMonth();
      }),
      byClass: Array.from(classMap.values()).sort((a, b) => b.outstanding - a.outstanding),
      byCategory: Array.from(categoryMap.values()).sort((a, b) => b.totalDue - a.totalDue)
    };
  }

  // Payment History Report
  getPaymentHistoryReport(startDate?: string, endDate?: string): Observable<PaymentHistoryReportData> {
    return forkJoin({
      assignments: this.http.get<any>(`${this.baseUrl}/fees/assignments`, { params: { page: 0, size: 1000 } }).pipe(
        map(res => res.content || res.data || []),
        catchError(() => of([]))
      ),
      payments: this.http.get<any>(`${this.baseUrl}/payments`, { params: { page: 0, size: 1000 } }).pipe(
        map(res => res.content || res.data || []),
        catchError(() => of([]))
      )
    }).pipe(
      map(({ assignments, payments }) => this.processPaymentHistoryData(assignments, payments, startDate, endDate))
    );
  }

  private processPaymentHistoryData(assignments: any[], payments: any[], startDate?: string, endDate?: string): PaymentHistoryReportData {
    const paymentRecords: PaymentRecord[] = [];
    const methodMap = new Map<string, PaymentsByMethod>();

    // Extract payments from fee assignments
    assignments.forEach(a => {
      if (a.payments && a.payments.length > 0) {
        a.payments.forEach((p: any) => {
          const paidAt = new Date(p.paidAt || p.createdAt);

          if (startDate && paidAt < new Date(startDate)) return;
          if (endDate && paidAt > new Date(endDate)) return;

          const method = p.paymentMethod || 'UNKNOWN';

          paymentRecords.push({
            id: p.id,
            studentId: a.student?.id || 0,
            studentName: a.student?.fullName || 'Unknown',
            studentCode: a.student?.studentId || '',
            className: a.student?.className || '',
            feeName: a.feeName || '',
            amount: p.amount || 0,
            paymentMethod: method,
            transactionRef: p.transactionRef || '',
            paidAt,
            status: p.status || 'COMPLETED'
          });

          if (!methodMap.has(method)) {
            methodMap.set(method, { method, count: 0, totalAmount: 0 });
          }
          const methodData = methodMap.get(method)!;
          methodData.count++;
          methodData.totalAmount += p.amount || 0;
        });
      }
    });

    // Sort by date descending
    paymentRecords.sort((a, b) => b.paidAt.getTime() - a.paidAt.getTime());

    return {
      payments: paymentRecords,
      byMethod: Array.from(methodMap.values()).sort((a, b) => b.totalAmount - a.totalAmount),
      totalPayments: paymentRecords.length,
      totalAmount: paymentRecords.reduce((sum, p) => sum + p.amount, 0)
    };
  }

  // Overdue Fees Report
  getOverdueFeesReport(): Observable<OverdueFeesReportData> {
    return this.http.get<any>(`${this.baseUrl}/fees/assignments`, { params: { page: 0, size: 1000 } }).pipe(
      map(response => {
        const assignments = response.content || response.data || [];
        return this.processOverdueData(assignments);
      }),
      catchError(() => of({
        records: [],
        totalOverdueAmount: 0,
        totalStudentsOverdue: 0,
        averageDaysOverdue: 0
      }))
    );
  }

  private processOverdueData(assignments: any[]): OverdueFeesReportData {
    const today = new Date();
    const records: OverdueFeeRecord[] = [];
    const studentSet = new Set<number>();
    let totalDaysOverdue = 0;

    assignments.forEach(a => {
      const balance = a.balance || 0;
      const dueDate = a.dueDate ? new Date(a.dueDate) : null;

      if (balance > 0 && dueDate && dueDate < today) {
        const daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        records.push({
          studentId: a.student?.id || 0,
          studentName: a.student?.fullName || 'Unknown',
          studentCode: a.student?.studentId || '',
          className: a.student?.className || '',
          feeName: a.feeName || '',
          category: a.category || '',
          amountDue: a.netAmount || a.amount || 0,
          amountPaid: a.amountPaid || 0,
          balance,
          dueDate,
          daysOverdue
        });

        if (a.student?.id) studentSet.add(a.student.id);
        totalDaysOverdue += daysOverdue;
      }
    });

    records.sort((a, b) => b.daysOverdue - a.daysOverdue);

    return {
      records,
      totalOverdueAmount: records.reduce((sum, r) => sum + r.balance, 0),
      totalStudentsOverdue: studentSet.size,
      averageDaysOverdue: records.length > 0 ? Math.round(totalDaysOverdue / records.length) : 0
    };
  }

  // Pending Payments Report
  getPendingPaymentsReport(): Observable<PendingPaymentsReportData> {
    return this.http.get<any>(`${this.baseUrl}/fees/assignments`, { params: { page: 0, size: 1000 } }).pipe(
      map(response => {
        const assignments = response.content || response.data || [];
        return this.processPendingPaymentsData(assignments);
      }),
      catchError(() => of({
        records: [],
        totalPendingAmount: 0,
        totalStudents: 0,
        pendingCount: 0,
        partialCount: 0,
        overdueCount: 0
      }))
    );
  }

  private processPendingPaymentsData(assignments: any[]): PendingPaymentsReportData {
    const today = new Date();
    const studentMap = new Map<number, PendingPaymentRecord>();

    assignments.forEach(a => {
      const balance = a.balance || 0;
      if (balance <= 0) return;

      const studentId = a.student?.id;
      if (!studentId) return;

      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          studentId,
          studentName: a.student?.fullName || 'Unknown',
          studentCode: a.student?.studentId || '',
          className: a.student?.className || '',
          totalFees: 0,
          totalPaid: 0,
          balance: 0,
          feeCount: 0,
          oldestDueDate: new Date(),
          status: 'PENDING'
        });
      }

      const record = studentMap.get(studentId)!;
      record.totalFees += a.netAmount || a.amount || 0;
      record.totalPaid += a.amountPaid || 0;
      record.balance += balance;
      record.feeCount++;

      const dueDate = a.dueDate ? new Date(a.dueDate) : null;
      if (dueDate && dueDate < record.oldestDueDate) {
        record.oldestDueDate = dueDate;
      }
    });

    let pendingCount = 0;
    let partialCount = 0;
    let overdueCount = 0;

    studentMap.forEach(record => {
      if (record.oldestDueDate < today) {
        record.status = 'OVERDUE';
        overdueCount++;
      } else if (record.totalPaid > 0) {
        record.status = 'PARTIAL';
        partialCount++;
      } else {
        record.status = 'PENDING';
        pendingCount++;
      }
    });

    const records = Array.from(studentMap.values()).sort((a, b) => b.balance - a.balance);

    return {
      records,
      totalPendingAmount: records.reduce((sum, r) => sum + r.balance, 0),
      totalStudents: records.length,
      pendingCount,
      partialCount,
      overdueCount
    };
  }
}