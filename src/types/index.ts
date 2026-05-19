/** Student status for ID card workflow */
export type StudentStatus =
  | 'pending'
  | 'photo_uploaded'
  | 'preview_sent'
  | 'correction_pending'
  | 'approved'
  | 'printed'
  | 'delivered'
  | 'received_by_school';

export interface ClassItem {
  id: string;
  schoolId: string;
  name: string;
  studentCount?: number;
}

export interface Student {
  id: string;
  name: string;
  uniqueCode?: string;
  rollNo: string;
  admissionNo?: string;
  mobile?: string;
  address?: string;
  className: string;
  classId: string;
  sectionName?: string;
  sectionId?: string;
  schoolId: string;
  schoolName: string;
  status: StudentStatus;
  photoUri?: string;
  previewUri?: string;
  correctionReason?: string;
  /** For delivery screen */
  deliveredAt?: string;
}

export interface DashboardStats {
  totalStudents: number;
  photoUploaded: number;
  previewPending: number;
  correctionPending: number;
  approved: number;
  printed: number;
  delivered: number;
  receivedBySchool?: number;
}

export interface SchoolProfile {
  name: string;
  contact?: string;
  email?: string;
  schoolCode?: string;
}

export interface AuthUser {
  id?: string;
  name?: string;
  mobile: string;
  role?: string;
  schoolId?: string;
  token?: string;
  school?: SchoolProfile;
}

/** Single field change on a correction request */
export interface CorrectionChange {
  field: string;
  oldValue?: string;
  newValue?: string;
}

/** Pending / resolved correction request from GET api/school/corrections */
export interface CorrectionItem {
  /** Correction document id — used for resolve/reject URLs */
  id: string;
  studentId: string;
  studentName: string;
  admissionNo?: string;
  rollNo?: string;
  requestedBy?: string;
  changes: CorrectionChange[];
  comment?: string;
  status?: string;
  createdAt?: string;
}
