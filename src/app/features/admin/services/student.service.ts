import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  Student,
  CreateStudentRequest,
  UpdateStudentRequest,
  EnrollStudentRequest,
  PagedResponse,
  MessageResponse
} from '../../../core/models';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/admin/students`;

  // Mock data for development/fallback
  private mockStudents: Student[] = [
    {
      id: 1, studentId: 'STU20240001', email: 'john.mwanza@example.com',
      firstName: 'John', lastName: 'Mwanza', fullName: 'John Mwanza',
      phone: '+260971234567', dateOfBirth: '2010-05-15', gender: 'MALE',
      enrollmentDate: '2024-01-15', address: '123 Main Street, Lusaka',
      bloodGroup: 'O+', medicalConditions: 'Mild asthma - uses inhaler when needed',
      status: 'ACTIVE',
      currentClass: { id: 1, name: 'Grade 8A', grade: 8, academicYear: '2024' },
      parent: { id: 1, name: 'Peter Mwanza', phone: '+260971234568', email: 'peter.mwanza@example.com' }
    },
    {
      id: 2, studentId: 'STU20240002', email: 'mary.banda@example.com',
      firstName: 'Mary', lastName: 'Banda', fullName: 'Mary Banda',
      phone: '+260972234567', dateOfBirth: '2011-03-22', gender: 'FEMALE',
      enrollmentDate: '2024-01-15', address: '456 Second Ave, Lusaka',
      bloodGroup: 'A+', medicalConditions: 'Allergic to peanuts',
      status: 'ACTIVE',
      currentClass: { id: 2, name: 'Grade 7B', grade: 7, academicYear: '2024' },
      parent: { id: 2, name: 'Grace Banda', phone: '+260972234568', email: 'grace.banda@example.com' }
    },
    {
      id: 3, studentId: 'STU20240003', email: 'peter.phiri@example.com',
      firstName: 'Peter', lastName: 'Phiri', fullName: 'Peter Phiri',
      phone: '+260973234567', dateOfBirth: '2009-08-10', gender: 'MALE',
      enrollmentDate: '2023-01-10', address: '789 Third Road, Kitwe',
      bloodGroup: 'B+',
      status: 'ACTIVE',
      currentClass: { id: 3, name: 'Grade 9A', grade: 9, academicYear: '2024' },
      parent: { id: 3, name: 'James Phiri', phone: '+260973234568' }
    },
    {
      id: 4, studentId: 'STU20240004', email: 'sarah.tembo@example.com',
      firstName: 'Sarah', lastName: 'Tembo', fullName: 'Sarah Tembo',
      phone: '+260974234567', dateOfBirth: '2010-11-05', gender: 'FEMALE',
      enrollmentDate: '2024-01-15', address: '101 Fourth Lane, Ndola',
      bloodGroup: 'AB+', medicalConditions: 'Wears corrective glasses',
      status: 'ACTIVE',
      currentClass: { id: 1, name: 'Grade 8A', grade: 8, academicYear: '2024' },
      parent: { id: 4, name: 'Ruth Tembo', phone: '+260974234568', email: 'ruth.tembo@example.com' }
    },
    {
      id: 5, studentId: 'STU20240005', email: 'james.zulu@example.com',
      firstName: 'James', lastName: 'Zulu', fullName: 'James Zulu',
      phone: '+260975234567', dateOfBirth: '2011-07-18', gender: 'MALE',
      enrollmentDate: '2024-02-01', address: '202 Fifth Street, Lusaka',
      bloodGroup: 'O-',
      status: 'INACTIVE',
      currentClass: { id: 2, name: 'Grade 7B', grade: 7, academicYear: '2024' }
    },
    {
      id: 6, studentId: 'STU20240006', email: 'linda.musonda@example.com',
      firstName: 'Linda', lastName: 'Musonda', fullName: 'Linda Musonda',
      phone: '+260976234567', dateOfBirth: '2010-02-28', gender: 'FEMALE',
      enrollmentDate: '2024-01-15', address: '303 Sixth Ave, Lusaka',
      bloodGroup: 'A-', medicalConditions: 'Lactose intolerant',
      status: 'ACTIVE',
      currentClass: { id: 1, name: 'Grade 8A', grade: 8, academicYear: '2024' },
      parent: { id: 5, name: 'David Musonda', phone: '+260976234568' }
    },
    {
      id: 7, studentId: 'STU20230007', email: 'david.ng@example.com',
      firstName: 'David', lastName: 'Ngelemu', fullName: 'David Ngelemu',
      phone: '+260977234567', dateOfBirth: '2008-12-01', gender: 'MALE',
      enrollmentDate: '2023-01-10', address: '404 Seventh Road, Livingstone',
      bloodGroup: 'B-',
      status: 'GRADUATED',
      currentClass: { id: 4, name: 'Grade 12A', grade: 12, academicYear: '2023' }
    },
    {
      id: 8, studentId: 'STU20240008', email: 'grace.mulenga@example.com',
      firstName: 'Grace', lastName: 'Mulenga', fullName: 'Grace Mulenga',
      phone: '+260978234567', dateOfBirth: '2011-09-14', gender: 'FEMALE',
      enrollmentDate: '2024-01-15', address: '505 Eighth Lane, Lusaka',
      bloodGroup: 'O+', medicalConditions: 'Allergic to bee stings - carries EpiPen',
      status: 'ACTIVE',
      currentClass: { id: 2, name: 'Grade 7B', grade: 7, academicYear: '2024' },
      parent: { id: 6, name: 'Joseph Mulenga', phone: '+260978234568', email: 'joseph.mulenga@example.com' }
    }
  ];

  getStudents(page: number = 0, size: number = 10, search?: string, status?: string): Observable<PagedResponse<Student>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search) {
      params = params.set('search', search);
    }
    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<any>(this.baseUrl, { params }).pipe(
      map(response => this.transformPagedResponse<Student>(response)),
      catchError(() => of(this.getMockStudents(page, size, search, status)))
    );
  }

  private getMockStudents(page: number, size: number, search?: string, status?: string): PagedResponse<Student> {
    let filtered = [...this.mockStudents];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(s =>
        s.fullName.toLowerCase().includes(searchLower) ||
        s.studentId.toLowerCase().includes(searchLower) ||
        s.email.toLowerCase().includes(searchLower)
      );
    }

    if (status) {
      filtered = filtered.filter(s => s.status === status);
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

  getStudentById(id: number): Observable<Student> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map(response => this.transformStudent(response)),
      catchError(() => {
        const student = this.mockStudents.find(s => s.id === id);
        if (student) return of(student);
        throw new Error('Student not found');
      })
    );
  }

  private transformStudent(data: any): Student {
    return {
      id: data.id,
      studentId: data.studentId || data.student_id,
      email: data.email,
      firstName: data.firstName || data.first_name,
      lastName: data.lastName || data.last_name,
      fullName: data.fullName || data.full_name || `${data.firstName || data.first_name} ${data.lastName || data.last_name}`,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth || data.date_of_birth,
      gender: data.gender,
      enrollmentDate: data.enrollmentDate || data.enrollment_date,
      address: data.address,
      bloodGroup: data.bloodGroup || data.blood_group,
      medicalConditions: data.medicalConditions || data.medical_conditions,
      status: data.status,
      currentClass: data.currentClass || data.current_class,
      parent: data.parent,
      createdAt: data.createdAt || data.created_at,
      updatedAt: data.updatedAt || data.updated_at
    };
  }

  getStudentByStudentId(studentId: string): Observable<Student> {
    return this.http.get<Student>(`${this.baseUrl}/student-id/${studentId}`).pipe(
      catchError(() => {
        const student = this.mockStudents.find(s => s.studentId === studentId);
        if (student) return of(student);
        throw new Error('Student not found');
      })
    );
  }

  createStudent(data: CreateStudentRequest): Observable<Student> {
    return this.http.post<Student>(this.baseUrl, data);
  }

  updateStudent(id: number, data: UpdateStudentRequest): Observable<Student> {
    return this.http.put<Student>(`${this.baseUrl}/${id}`, data);
  }

  deleteStudent(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.baseUrl}/${id}`);
  }

  getStudentsByClass(classId: number): Observable<Student[]> {
    return this.http.get<Student[]>(`${this.baseUrl}/class/${classId}`).pipe(
      catchError(() => of(this.mockStudents.filter(s => s.currentClass?.id === classId)))
    );
  }

  enrollStudent(studentId: number, data: EnrollStudentRequest): Observable<Student> {
    return this.http.post<Student>(`${this.baseUrl}/${studentId}/enroll`, data);
  }

  searchStudents(name: string, page: number = 0, size: number = 10): Observable<PagedResponse<Student>> {
    return this.getStudents(page, size, name);
  }

  getStudentsByStatus(status: string, page: number = 0, size: number = 10): Observable<PagedResponse<Student>> {
    return this.getStudents(page, size, undefined, status);
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