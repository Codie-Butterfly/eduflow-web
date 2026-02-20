export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'TRANSFERRED' | 'EXPELLED';

export interface Student {
  id: number;
  studentId: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  dateOfBirth?: string;
  gender: Gender;
  enrollmentDate?: string;
  address?: string;
  bloodGroup?: string;
  medicalConditions?: string;
  status: StudentStatus;
  currentClass?: ClassSummary;
  parent?: ParentSummary;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateStudentRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  gender: Gender;
  address?: string;
  bloodGroup?: string;
  medicalConditions?: string;
  parentId?: number;
  classId?: number;
}

export interface UpdateStudentRequest extends CreateStudentRequest {
  status?: StudentStatus;
}

export interface ClassSummary {
  id: number;
  name: string;
  grade: number;
  section?: string;
  academicYear: string;
}

export interface ParentSummary {
  id: number;
  name: string;
  phone?: string;
  email?: string;
}

export interface EnrollStudentRequest {
  classId: number;
}