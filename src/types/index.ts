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

/** Dynamic ID card fields from API – keys may vary per school/template */
export type StudentCardFields = Record<string, string | number | boolean | null | undefined>;

/** Body for POST api/school/students (multipart/form-data) */
export interface StudentCreatePayload extends StudentUpdatePayload {
  classId: string;
  /** Local file URI for student photo — sent as form field `photo`. */
  photoUri?: string;
  /** Local file URI for house logo — sent as form field `housePhoto`. */
  housePhotoUri?: string;
}

/** Body for PUT api/school/students/:studentId */
export interface StudentUpdatePayload {
  studentName: string;
  admissionNo: string;
  rollNo: string;
  fatherName: string;
  motherName: string;
  dob: string;
  mobile: string;
  address: string;
  gender: string;
  bloodGroup: string;
  house: string;
  photoNo: string;
  extraFields: Record<string, string>;
}

export interface Student {
  id: string;
  name: string;
  /** Filled card values for display (non-empty only). */
  card?: StudentCardFields;
  /** All template field keys from API card object (includes empty placeholders). */
  cardTemplate?: StudentCardFields;
  uniqueCode?: string;
  rollNo: string;
  admissionNo?: string;
  mobile?: string;
  address?: string;
  fatherName?: string;
  motherName?: string;
  dob?: string;
  gender?: string;
  bloodGroup?: string;
  house?: string;
  photoNo?: string;
  extraFields?: Record<string, string>;
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
