import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, catchError, throwError, map, switchMap } from 'rxjs';
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

  getDashboardStats(): Observable<TeacherDashboardStats> {
    return this.http.get<TeacherDashboardStats>(`${this.baseUrl}/dashboard`).pipe(
      map(response => this.transformDashboardStats(response)),
      catchError(error => {
        console.error('Failed to load dashboard stats:', error);
        return of({
          totalClasses: 0,
          totalStudents: 0,
          todayAttendance: 0,
          pendingAttendance: 0
        });
      })
    );
  }

  getMyClasses(): Observable<TeacherClass[]> {
    return this.http.get<any>(`${this.baseUrl}/classes`).pipe(
      map(response => {
        const classes = Array.isArray(response) ? response : (response.content || []);
        return classes.map((c: any) => this.transformClass(c));
      }),
      catchError(error => {
        console.error('Failed to load classes:', error);
        return of([]);
      })
    );
  }

  getClassDetails(classId: number): Observable<TeacherClass> {
    return this.http.get<any>(`${this.baseUrl}/classes/${classId}`).pipe(
      map(response => this.transformClass(response)),
      catchError(() => {
        // Fallback: fetch from list and filter
        return this.getMyClasses().pipe(
          map(classes => {
            const found = classes.find(c => c.id === classId);
            if (found) return found;
            throw new Error('Class not found');
          }),
          catchError(error => {
            console.error('Failed to load class details:', error);
            return throwError(() => new Error('Class not found'));
          })
        );
      })
    );
  }

  getClassStudents(classId: number): Observable<Student[]> {
    // Try teacher endpoint first, then fall back to admin endpoint
    return this.http.get<any>(`${this.baseUrl}/classes/${classId}/students`).pipe(
      map(response => {
        console.log('Class students response:', response);
        const students = Array.isArray(response) ? response : (response.content || response.students || []);
        return students.map((s: any) => this.transformStudent(s));
      }),
      catchError(() => {
        // Fallback to admin classes endpoint
        return this.http.get<any>(`${environment.apiUrl}/v1/admin/classes/${classId}/students`).pipe(
          map(response => {
            console.log('Admin class students response:', response);
            const students = Array.isArray(response) ? response : (response.content || response.students || []);
            return students.map((s: any) => this.transformStudent(s));
          }),
          catchError(error => {
            console.error('Failed to load class students:', error);
            return of([]);
          })
        );
      })
    );
  }

  getAttendanceForDate(classId: number, date: string): Observable<AttendanceRecord[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<any>(`${this.baseUrl}/classes/${classId}/attendance`, { params }).pipe(
      map(response => {
        console.log('Attendance response:', response);
        const records = Array.isArray(response) ? response : (response.content || response.records || []);
        if (records.length === 0) {
          // Throw error to trigger fallback to load students
          throw new Error('No attendance records');
        }
        return records.map((r: any) => this.transformAttendanceRecord(r));
      }),
      catchError(error => {
        console.error('No attendance records, will load students:', error);
        // Return throwError to trigger the fallback in the component
        return throwError(() => new Error('No attendance records'));
      })
    );
  }

  getAttendanceSummary(classId: number, month?: string): Observable<AttendanceSummary[]> {
    let params = new HttpParams();
    if (month) {
      params = params.set('month', month);
    }
    return this.http.get<any>(`${this.baseUrl}/classes/${classId}/attendance/summary`, { params }).pipe(
      map(response => {
        const summaries = Array.isArray(response) ? response : (response.content || []);
        return summaries.map((s: any) => this.transformAttendanceSummary(s));
      }),
      catchError(error => {
        console.error('Failed to load attendance summary:', error);
        return of([]);
      })
    );
  }

  markAttendance(data: MarkAttendanceRequest): Observable<AttendanceSummary> {
    return this.http.post<any>(`${this.baseUrl}/attendance`, data).pipe(
      map(response => this.transformAttendanceSummary(response)),
      catchError(error => {
        console.error('Failed to mark attendance:', error);
        return throwError(() => new Error('Failed to mark attendance'));
      })
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
      map(response => ({
        studentId: response.studentId || response.student_id || studentId,
        totalFees: response.totalFees || response.total_fees || 0,
        totalPaid: response.totalPaid || response.total_paid || 0,
        balance: response.balance || 0,
        status: response.status || 'UNKNOWN'
      })),
      catchError(error => {
        console.error('Failed to load student fee status:', error);
        return of({
          studentId,
          totalFees: 0,
          totalPaid: 0,
          balance: 0,
          status: 'UNKNOWN'
        });
      })
    );
  }

  private transformDashboardStats(data: any): TeacherDashboardStats {
    return {
      totalClasses: data.totalClasses || data.total_classes || 0,
      totalStudents: data.totalStudents || data.total_students || 0,
      todayAttendance: data.todayAttendance || data.today_attendance || 0,
      pendingAttendance: data.pendingAttendance || data.pending_attendance || 0
    };
  }

  private transformClass(data: any): TeacherClass {
    // Get subjects as comma-separated string
    const subjects = data.subjects?.map((s: any) => s.name).join(', ') || data.subject || '';

    return {
      id: data.id,
      name: data.name,
      grade: data.grade,
      section: data.section,
      academicYear: data.academicYear || data.academic_year || '',
      studentCount: data.currentEnrollment || data.current_enrollment || data.studentCount || data.student_count || 0,
      subject: subjects,
      schedule: data.schedule
    };
  }

  private transformStudent(data: any): Student {
    return {
      id: data.id,
      studentId: data.studentId || data.student_id || data.studentCode || data.student_code || '',
      firstName: data.firstName || data.first_name || '',
      lastName: data.lastName || data.last_name || '',
      fullName: data.fullName || data.full_name || `${data.firstName || data.first_name || ''} ${data.lastName || data.last_name || ''}`.trim(),
      email: data.email || '',
      gender: data.gender || 'MALE',
      status: data.status || 'ACTIVE'
    };
  }

  private transformAttendanceRecord(data: any): AttendanceRecord {
    return {
      id: data.id,
      studentId: data.studentId || data.student_id,
      studentName: data.studentName || data.student_name || '',
      studentNumber: data.studentNumber || data.student_number || data.studentCode || data.student_code || '',
      date: data.date,
      status: (data.status || 'PRESENT').toUpperCase() as any,
      remarks: data.remarks
    };
  }

  private transformAttendanceSummary(data: any): AttendanceSummary {
    return {
      classId: data.classId || data.class_id,
      className: data.className || data.class_name || '',
      date: data.date,
      totalStudents: data.totalStudents || data.total_students || 0,
      present: data.present || 0,
      absent: data.absent || 0,
      late: data.late || 0,
      excused: data.excused || 0
    };
  }
}