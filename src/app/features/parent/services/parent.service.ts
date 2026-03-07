import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, catchError, map, switchMap, forkJoin } from 'rxjs';
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
  unreadNotifications: number;
}

@Injectable({
  providedIn: 'root'
})
export class ParentService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/parent`;

  getDashboardStats(): Observable<ParentDashboardStats> {
    return this.http.get<any>(`${this.baseUrl}/dashboard`).pipe(
      map(response => {
        console.log('Dashboard API response:', response);
        return this.transformDashboardStats(response);
      }),
      catchError((error) => {
        console.error('Dashboard API error:', error);
        return of({
          totalChildren: 2,
          totalFees: 27000,
          totalPaid: 22000,
          totalBalance: 5000,
          overdueCount: 1,
          upcomingDueCount: 0,
          unreadNotifications: 0
        });
      })
    );
  }

  private transformDashboardStats(data: any): ParentDashboardStats {
    // Handle nested response (e.g., { data: {...} })
    const stats = data.data || data;

    return {
      totalChildren: stats.totalChildren ?? stats.total_children ?? stats.childCount ?? stats.child_count ?? 0,
      totalFees: stats.totalFeesDue ?? stats.total_fees_due ?? stats.totalFees ?? stats.total_fees ?? 0,
      totalPaid: stats.totalFeesPaid ?? stats.total_fees_paid ?? stats.totalPaid ?? stats.total_paid ?? 0,
      totalBalance: stats.outstandingBalance ?? stats.outstanding_balance ?? stats.totalBalance ?? stats.total_balance ?? stats.balance ?? 0,
      overdueCount: stats.overdueCount ?? stats.overdue_count ?? 0,
      upcomingDueCount: stats.upcomingDueCount ?? stats.upcoming_due_count ?? 0,
      unreadNotifications: stats.unreadNotifications ?? stats.unread_notifications ?? 0
    };
  }

  getChildren(): Observable<ChildSummary[]> {
    return this.http.get<any>(`${this.baseUrl}/children`).pipe(
      map(response => {
        console.log('Children API response:', response);
        // Handle different response formats
        const children = Array.isArray(response) ? response : (response.content || response.children || response.data || []);
        console.log('Extracted children array:', children);
        const transformed = children.map((child: any) => this.transformChild(child));
        console.log('Transformed children:', transformed);
        return transformed;
      }),
      catchError((error) => {
        console.error('Children API error:', error);
        return of([]);  // Return empty array instead of mock data
      })
    );
  }

  /**
   * Get children with fee summaries
   * Fetches children list then enriches with fee data if not already present
   */
  getChildrenWithFees(): Observable<ChildSummary[]> {
    return this.getChildren().pipe(
      switchMap(children => {
        if (children.length === 0) {
          return of([]);
        }

        // Check if children already have fee data from the API
        const childrenNeedFees = children.filter(child =>
          child.totalFees === 0 && child.totalPaid === 0 && child.balance === 0
        );

        // If all children already have fee data, return them directly
        if (childrenNeedFees.length === 0) {
          console.log('Children already have fee data, skipping additional API calls');
          return of(children);
        }

        console.log(`Fetching fees for ${childrenNeedFees.length} children without fee data`);

        // Fetch fees only for children that don't have fee data
        const feeRequests = children.map(child => {
          // Skip if child already has fee data
          if (child.totalFees > 0 || child.totalPaid > 0 || child.balance > 0) {
            return of(child);
          }
          return this.getChildFees(child.id).pipe(
            map(fees => this.enrichChildWithFees(child, fees)),
            catchError(() => of(child)) // Return child without fee data on error
          );
        });
        return forkJoin(feeRequests);
      })
    );
  }

  private enrichChildWithFees(child: ChildSummary, fees: StudentFee[]): ChildSummary {
    const totalFees = fees.reduce((sum, fee) => sum + (fee.netAmount || fee.amount || 0), 0);
    const totalPaid = fees.reduce((sum, fee) => sum + (fee.amountPaid || 0), 0);
    const balance = fees.reduce((sum, fee) => sum + (fee.balance || 0), 0);
    const pendingFees = fees.filter(fee => fee.status !== 'PAID').length;

    return {
      ...child,
      totalFees,
      totalPaid,
      balance,
      pendingFees
    };
  }

  private transformChild(data: any): ChildSummary {
    // Get class info - might be nested object
    const classInfo = data.currentClass || data.current_class || {};
    const className = typeof classInfo === 'string' ? classInfo : (classInfo.name || classInfo.className || '');
    const grade = typeof classInfo === 'object' ? (classInfo.grade || classInfo.gradeLevel || 0) : 0;

    // Extract fee data - check feeSummary object first (from updated backend), then fallback to flat fields
    const feeSummary = data.feeSummary || data.fee_summary || {};
    const totalFees = feeSummary.totalFees ?? feeSummary.total_fees ?? data.totalFees ?? data.total_fees ?? 0;
    const totalPaid = feeSummary.totalPaid ?? feeSummary.total_paid ?? data.totalPaid ?? data.total_paid ?? 0;
    const balance = feeSummary.balance ?? data.balance ?? data.outstandingBalance ?? 0;
    const pendingFees = feeSummary.pendingFees ?? feeSummary.pending_fees ?? data.pendingFees ?? data.pending_fees ?? 0;

    console.log('Transforming child:', data.fullName || data.firstName, 'Fee data:', { totalFees, totalPaid, balance, pendingFees }, 'feeSummary:', feeSummary);

    return {
      id: data.id || 0,
      studentId: data.studentId || data.student_id || '',
      fullName: data.fullName || data.full_name || `${data.firstName || data.first_name || ''} ${data.lastName || data.last_name || ''}`.trim(),
      currentClass: className,
      grade: grade,
      photoUrl: data.photoUrl || data.photo_url || data.photo,
      // Use fee data from response if available, otherwise will be enriched separately
      totalFees,
      totalPaid,
      balance,
      pendingFees
    };
  }

  getChildDetails(childId: number): Observable<Student> {
    return this.http.get<any>(`${this.baseUrl}/children/${childId}`).pipe(
      map(response => {
        console.log('Child details API response:', response);
        return this.transformStudentDetails(response);
      }),
      catchError((error) => {
        console.error('Child details API error:', error);
        throw error;  // Re-throw to let the component handle the error
      })
    );
  }

  private transformStudentDetails(data: any): Student {
    const firstName = data.firstName || data.first_name || '';
    const lastName = data.lastName || data.last_name || '';
    const fullName = data.fullName || data.full_name || `${firstName} ${lastName}`.trim();

    return {
      id: data.id || 0,
      studentId: data.studentId || data.student_id || '',
      email: data.email || '',
      firstName,
      lastName,
      fullName,
      phone: data.phone || data.phoneNumber || data.phone_number,
      dateOfBirth: data.dateOfBirth || data.date_of_birth,
      gender: data.gender || 'OTHER',
      enrollmentDate: data.enrollmentDate || data.enrollment_date,
      address: data.address,
      bloodGroup: data.bloodGroup || data.blood_group,
      medicalConditions: data.medicalConditions || data.medical_conditions,
      status: data.status || 'ACTIVE',
      currentClass: data.currentClass || data.current_class,
      parent: data.parent,
      createdAt: data.createdAt || data.created_at,
      updatedAt: data.updatedAt || data.updated_at
    };
  }

  getChildFees(childId: number): Observable<StudentFee[]> {
    return this.http.get<any>(`${this.baseUrl}/children/${childId}/fees`).pipe(
      map(response => {
        console.log('Child fees API response:', response);
        // Handle different response formats
        const fees = Array.isArray(response) ? response : (response.content || response.fees || response.data || []);
        return fees.map((fee: any) => this.transformFee(fee));
      }),
      catchError((error) => {
        console.error('Child fees API error:', error);
        return of([]);  // Return empty array instead of mock data
      })
    );
  }

  private transformFee(data: any): StudentFee {
    // Handle nested fee type/fee structure from backend
    const feeType = data.feeType || data.fee_type || data.fee || {};
    const feeName = data.feeName || data.fee_name || data.name ||
                    feeType.name || feeType.feeName || feeType.fee_name || 'Unknown Fee';

    console.log('Transforming fee:', data, 'Extracted feeName:', feeName);

    return {
      id: data.id || 0,
      feeName,
      category: data.category || data.feeCategory || feeType.category || '',
      academicYear: data.academicYear || data.academic_year || '',
      term: data.term || '',
      dueDate: data.dueDate || data.due_date || '',
      amount: data.amount || feeType.amount || 0,
      discountAmount: data.discountAmount || data.discount_amount || data.discount || 0,
      netAmount: data.netAmount || data.net_amount || data.amount || 0,
      amountPaid: data.amountPaid || data.amount_paid || data.paidAmount || data.paid_amount || 0,
      balance: data.balance || data.remainingBalance || data.remaining_balance || 0,
      status: data.status || 'PENDING',
      payments: data.payments || []
    };
  }

  getPaymentHistory(page: number = 0, size: number = 10): Observable<PagedResponse<Payment>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PagedResponse<Payment>>(`${this.baseUrl}/payments`, { params }).pipe(
      catchError((error) => {
        console.error('Payment history API error:', error);
        return of({
          content: [],
          totalElements: 0,
          totalPages: 0,
          size,
          page,
          first: true,
          last: true
        });
      })
    );
  }

  makePayment(data: CreatePaymentRequest): Observable<Payment> {
    console.log('Making payment request:', data);
    return this.http.post<Payment>(`${this.baseUrl}/payments`, data).pipe(
      map(response => {
        console.log('Payment response:', response);
        return response;
      }),
      catchError((error) => {
        console.error('Payment API error:', error);
        throw error;  // Re-throw to let component handle it
      })
    );
  }

  downloadReceipt(paymentId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/payments/${paymentId}/receipt`, { responseType: 'blob' });
  }
}