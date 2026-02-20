import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Student } from '../../../core/models';

export interface TeacherClass {
  id: number;
  name: string;
  grade: number;
  section?: string;
  academicYear: string;
  studentCount: number;
  subject?: string;
  schedule?: string;
}

export interface TeacherDashboardStats {
  totalClasses: number;
  totalStudents: number;
  todayAttendance: number;
  pendingAttendance: number;
}

export interface AttendanceRecord {
  id: number;
  studentId: number;
  studentName: string;
  studentNumber: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks?: string;
}

export interface AttendanceSummary {
  classId: number;
  className: string;
  date: string;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
}

export interface MarkAttendanceRequest {
  classId: number;
  date: string;
  records: { studentId: number; status: string; remarks?: string }[];
}

@Injectable({
  providedIn: 'root'
})
export class TeacherService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/teacher`;

  // Mock data
  private mockClasses: TeacherClass[] = [
    { id: 1, name: 'Grade 8A', grade: 8, section: 'A', academicYear: '2024', studentCount: 35, subject: 'Mathematics', schedule: 'Mon, Wed, Fri - 8:00 AM' },
    { id: 2, name: 'Grade 9B', grade: 9, section: 'B', academicYear: '2024', studentCount: 32, subject: 'Mathematics', schedule: 'Tue, Thu - 10:00 AM' },
    { id: 3, name: 'Grade 7A', grade: 7, section: 'A', academicYear: '2024', studentCount: 38, subject: 'Science', schedule: 'Mon, Wed - 2:00 PM' }
  ];

  private mockStudents: Student[] = [
    { id: 1, studentId: 'STU-2024-001', firstName: 'John', lastName: 'Mulenga', fullName: 'John Mulenga', email: 'john@student.edu', gender: 'MALE', status: 'ACTIVE' },
    { id: 2, studentId: 'STU-2024-002', firstName: 'Mary', lastName: 'Banda', fullName: 'Mary Banda', email: 'mary@student.edu', gender: 'FEMALE', status: 'ACTIVE' },
    { id: 3, studentId: 'STU-2024-003', firstName: 'Peter', lastName: 'Zulu', fullName: 'Peter Zulu', email: 'peter@student.edu', gender: 'MALE', status: 'ACTIVE' },
    { id: 4, studentId: 'STU-2024-004', firstName: 'Grace', lastName: 'Phiri', fullName: 'Grace Phiri', email: 'grace@student.edu', gender: 'FEMALE', status: 'ACTIVE' },
    { id: 5, studentId: 'STU-2024-005', firstName: 'David', lastName: 'Tembo', fullName: 'David Tembo', email: 'david@student.edu', gender: 'MALE', status: 'ACTIVE' }
  ];

  getDashboardStats(): Observable<TeacherDashboardStats> {
    return this.http.get<TeacherDashboardStats>(`${this.baseUrl}/dashboard`).pipe(
      catchError(() => of({
        totalClasses: 3,
        totalStudents: 105,
        todayAttendance: 2,
        pendingAttendance: 1
      }))
    );
  }

  getMyClasses(): Observable<TeacherClass[]> {
    return this.http.get<TeacherClass[]>(`${this.baseUrl}/classes`).pipe(
      catchError(() => of(this.mockClasses))
    );
  }

  getClassDetails(classId: number): Observable<TeacherClass> {
    return this.http.get<TeacherClass>(`${this.baseUrl}/classes/${classId}`).pipe(
      catchError(() => {
        const cls = this.mockClasses.find(c => c.id === classId);
        if (cls) return of(cls);
        throw new Error('Class not found');
      })
    );
  }

  getClassStudents(classId: number): Observable<Student[]> {
    return this.http.get<Student[]>(`${this.baseUrl}/classes/${classId}/students`).pipe(
      catchError(() => of(this.mockStudents))
    );
  }

  getAttendanceForDate(classId: number, date: string): Observable<AttendanceRecord[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<AttendanceRecord[]>(`${this.baseUrl}/classes/${classId}/attendance`, { params }).pipe(
      catchError(() => {
        const records: AttendanceRecord[] = this.mockStudents.map((s, index) => ({
          id: index + 1,
          studentId: s.id,
          studentName: s.fullName,
          studentNumber: s.studentId,
          date,
          status: index === 1 ? 'ABSENT' : index === 3 ? 'LATE' : 'PRESENT' as any,
          remarks: index === 1 ? 'Sick' : undefined
        }));
        return of(records);
      })
    );
  }

  getAttendanceSummary(classId: number, month?: string): Observable<AttendanceSummary[]> {
    let params = new HttpParams();
    if (month) {
      params = params.set('month', month);
    }
    return this.http.get<AttendanceSummary[]>(`${this.baseUrl}/classes/${classId}/attendance/summary`, { params }).pipe(
      catchError(() => of([
        { classId, className: 'Grade 8A', date: '2024-02-19', totalStudents: 35, present: 32, absent: 2, late: 1, excused: 0 },
        { classId, className: 'Grade 8A', date: '2024-02-18', totalStudents: 35, present: 33, absent: 1, late: 1, excused: 0 },
        { classId, className: 'Grade 8A', date: '2024-02-17', totalStudents: 35, present: 30, absent: 3, late: 2, excused: 0 }
      ]))
    );
  }

  markAttendance(data: MarkAttendanceRequest): Observable<AttendanceSummary> {
    return this.http.post<AttendanceSummary>(`${this.baseUrl}/attendance`, data).pipe(
      catchError(() => of({
        classId: data.classId,
        className: 'Grade 8A',
        date: data.date,
        totalStudents: data.records.length,
        present: data.records.filter(r => r.status === 'PRESENT').length,
        absent: data.records.filter(r => r.status === 'ABSENT').length,
        late: data.records.filter(r => r.status === 'LATE').length,
        excused: data.records.filter(r => r.status === 'EXCUSED').length
      }))
    );
  }

  getStudentFeeStatus(studentId: number): Observable<{
    studentId: number;
    totalFees: number;
    totalPaid: number;
    balance: number;
    status: string;
  }> {
    return this.http.get<any>(`${this.baseUrl}/students/${studentId}/fee-status`).pipe(
      catchError(() => of({
        studentId,
        totalFees: 15000,
        totalPaid: 10000,
        balance: 5000,
        status: 'PARTIAL'
      }))
    );
  }
}