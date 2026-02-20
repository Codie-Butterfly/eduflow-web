export interface Subject {
  id: number;
  name: string;
  code: string;
  description?: string;
  department?: string;
  credits?: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSubjectRequest {
  name: string;
  code: string;
  description?: string;
  department?: string;
  credits?: number;
}

export interface UpdateSubjectRequest extends CreateSubjectRequest {
  active?: boolean;
}