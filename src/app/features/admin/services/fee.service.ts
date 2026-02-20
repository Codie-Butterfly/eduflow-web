import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  Fee,
  CreateFeeRequest,
  UpdateFeeRequest,
  AssignFeeRequest,
  StudentFee,
  ApplyDiscountRequest,
  WaiveFeeRequest,
  PagedResponse,
  MessageResponse
} from '../../../core/models';

@Injectable({
  providedIn: 'root'
})
export class FeeService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/admin/fees`;

  // Mock data for development/fallback
  private mockFees: Fee[] = [
    {
      id: 1, category: 'TUITION', name: 'Term 1 Tuition Fee 2024',
      amount: 5000, academicYear: '2024', term: 'TERM_1',
      description: 'Tuition fee for first term', mandatory: true, active: true,
      applicableClasses: [
        { id: 1, name: 'Grade 8A', grade: 8, academicYear: '2024' },
        { id: 2, name: 'Grade 7B', grade: 7, academicYear: '2024' }
      ]
    },
    {
      id: 2, category: 'TUITION', name: 'Term 2 Tuition Fee 2024',
      amount: 5000, academicYear: '2024', term: 'TERM_2',
      description: 'Tuition fee for second term', mandatory: true, active: true,
      applicableClasses: [
        { id: 1, name: 'Grade 8A', grade: 8, academicYear: '2024' },
        { id: 2, name: 'Grade 7B', grade: 7, academicYear: '2024' }
      ]
    },
    {
      id: 3, category: 'EXAM', name: 'Examination Fee 2024',
      amount: 500, academicYear: '2024', term: 'ANNUAL',
      description: 'Annual examination fee', mandatory: true, active: true,
      applicableClasses: [
        { id: 1, name: 'Grade 8A', grade: 8, academicYear: '2024' },
        { id: 2, name: 'Grade 7B', grade: 7, academicYear: '2024' },
        { id: 3, name: 'Grade 9A', grade: 9, academicYear: '2024' }
      ]
    },
    {
      id: 4, category: 'TRANSPORT', name: 'School Bus Fee - Term 1',
      amount: 1500, academicYear: '2024', term: 'TERM_1',
      description: 'School transport fee', mandatory: false, active: true,
      applicableClasses: []
    },
    {
      id: 5, category: 'LIBRARY', name: 'Library Fee 2024',
      amount: 200, academicYear: '2024', term: 'ANNUAL',
      description: 'Annual library membership', mandatory: true, active: true,
      applicableClasses: []
    },
    {
      id: 6, category: 'UNIFORM', name: 'Uniform Fee - New Students',
      amount: 800, academicYear: '2024',
      description: 'Complete uniform set', mandatory: false, active: true,
      applicableClasses: []
    },
    {
      id: 7, category: 'ACTIVITY', name: 'Sports & Activities Fee',
      amount: 300, academicYear: '2024', term: 'ANNUAL',
      description: 'Annual sports and extracurricular activities', mandatory: false, active: true,
      applicableClasses: []
    },
    {
      id: 8, category: 'LABORATORY', name: 'Science Lab Fee',
      amount: 400, academicYear: '2024', term: 'ANNUAL',
      description: 'Laboratory equipment and materials', mandatory: true, active: true,
      applicableClasses: [
        { id: 3, name: 'Grade 9A', grade: 9, academicYear: '2024' }
      ]
    }
  ];

  private mockStudentFees: StudentFee[] = [
    {
      id: 1, feeName: 'Term 1 Tuition Fee 2024', category: 'TUITION',
      academicYear: '2024', term: 'TERM_1', dueDate: '2024-02-15',
      amount: 5000, discountAmount: 0, netAmount: 5000, amountPaid: 5000, balance: 0,
      status: 'PAID', payments: [],
      student: { id: 1, studentId: 'STU20240001', fullName: 'John Mwanza' }
    },
    {
      id: 2, feeName: 'Term 1 Tuition Fee 2024', category: 'TUITION',
      academicYear: '2024', term: 'TERM_1', dueDate: '2024-02-15',
      amount: 5000, discountAmount: 500, discountReason: 'Sibling discount', netAmount: 4500, amountPaid: 2500, balance: 2000,
      status: 'PARTIAL', payments: [],
      student: { id: 2, studentId: 'STU20240002', fullName: 'Mary Banda' }
    },
    {
      id: 3, feeName: 'Examination Fee 2024', category: 'EXAM',
      academicYear: '2024', term: 'ANNUAL', dueDate: '2024-03-01',
      amount: 500, discountAmount: 0, netAmount: 500, amountPaid: 0, balance: 500,
      status: 'OVERDUE', payments: [],
      student: { id: 3, studentId: 'STU20240003', fullName: 'Peter Phiri' }
    },
    {
      id: 4, feeName: 'Library Fee 2024', category: 'LIBRARY',
      academicYear: '2024', term: 'ANNUAL', dueDate: '2024-02-28',
      amount: 200, discountAmount: 0, netAmount: 200, amountPaid: 0, balance: 200,
      status: 'PENDING', payments: [],
      student: { id: 4, studentId: 'STU20240004', fullName: 'Sarah Tembo' }
    }
  ];

  // Fee CRUD operations
  getFees(page: number = 0, size: number = 10, academicYear?: string): Observable<PagedResponse<Fee>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (academicYear) {
      params = params.set('academicYear', academicYear);
    }

    return this.http.get<any>(this.baseUrl, { params }).pipe(
      map(response => this.transformPagedResponse<Fee>(response)),
      catchError(() => of(this.getMockFees(page, size, academicYear)))
    );
  }

  private getMockFees(page: number, size: number, academicYear?: string): PagedResponse<Fee> {
    let filtered = [...this.mockFees];

    if (academicYear) {
      filtered = filtered.filter(f => f.academicYear === academicYear);
    }

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const content = filtered.slice(start, start + size);

    return {
      content,
      page,
      size,
      totalElements,
      totalPages,
      first: page === 0,
      last: page >= totalPages - 1
    };
  }

  getFeeById(id: number): Observable<Fee> {
    return this.http.get<Fee>(`${this.baseUrl}/${id}`).pipe(
      catchError(() => {
        const fee = this.mockFees.find(f => f.id === id);
        if (fee) return of(fee);
        throw new Error('Fee not found');
      })
    );
  }

  getFeesByAcademicYear(year: string): Observable<Fee[]> {
    return this.http.get<Fee[]>(`${this.baseUrl}/academic-year/${year}`).pipe(
      catchError(() => of(this.mockFees.filter(f => f.academicYear === year)))
    );
  }

  createFee(data: CreateFeeRequest): Observable<Fee> {
    return this.http.post<Fee>(this.baseUrl, data);
  }

  updateFee(id: number, data: UpdateFeeRequest): Observable<Fee> {
    return this.http.put<Fee>(`${this.baseUrl}/${id}`, data);
  }

  deleteFee(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.baseUrl}/${id}`);
  }

  // Fee assignment operations
  assignFees(data: AssignFeeRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/assign`, data);
  }

  getStudentFees(studentId: number): Observable<StudentFee[]> {
    return this.http.get<StudentFee[]>(`${this.baseUrl}/student/${studentId}`).pipe(
      catchError(() => of(this.mockStudentFees.filter(f => f.student?.id === studentId)))
    );
  }

  getAllStudentFees(page: number = 0, size: number = 10, status?: string): Observable<PagedResponse<StudentFee>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<any>(`${this.baseUrl}/assignments`, { params }).pipe(
      map(response => this.transformPagedResponse<StudentFee>(response)),
      catchError(() => {
        let filtered = [...this.mockStudentFees];
        if (status) {
          filtered = filtered.filter(f => f.status === status);
        }

        const totalElements = filtered.length;
        const totalPages = Math.ceil(totalElements / size);
        const start = page * size;
        const content = filtered.slice(start, start + size);

        return of({
          content,
          page,
          size,
          totalElements,
          totalPages,
          first: page === 0,
          last: page >= totalPages - 1
        });
      })
    );
  }

  applyDiscount(assignmentId: number, data: ApplyDiscountRequest): Observable<StudentFee> {
    return this.http.post<StudentFee>(`${this.baseUrl}/assignment/${assignmentId}/discount`, data);
  }

  waiveFee(assignmentId: number, data: WaiveFeeRequest): Observable<StudentFee> {
    return this.http.post<StudentFee>(`${this.baseUrl}/assignment/${assignmentId}/waive`, data);
  }

  private transformPagedResponse<T>(response: any): PagedResponse<T> {
    if (response.content !== undefined) {
      return {
        content: response.content || [],
        page: response.page ?? response.number ?? 0,
        size: response.size ?? 10,
        totalElements: response.totalElements ?? 0,
        totalPages: response.totalPages ?? 0,
        first: response.first ?? true,
        last: response.last ?? true
      };
    }

    if (Array.isArray(response)) {
      return {
        content: response,
        page: 0,
        size: response.length,
        totalElements: response.length,
        totalPages: 1,
        first: true,
        last: true
      };
    }

    if (response.data !== undefined) {
      const data = Array.isArray(response.data) ? response.data : [];
      return {
        content: data,
        page: response.page ?? response.number ?? 0,
        size: response.size ?? data.length,
        totalElements: response.totalElements ?? response.total ?? data.length,
        totalPages: response.totalPages ?? 1,
        first: response.first ?? true,
        last: response.last ?? true
      };
    }

    return {
      content: [],
      page: 0,
      size: 10,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true
    };
  }
}