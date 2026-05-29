import AsyncStorage from '@react-native-async-storage/async-storage';
import { endpoints } from './endpoints';
import {
  getSchoolClasses,
  getSchoolDashboard,
  getSchoolStudents,
  getSchoolPendingTemplateStudents,
  getSchoolStudentsGlobalSearch,
  getSchoolStudentDetail,
  getSchoolPreview,
  requestSchoolCorrection,
  getSchoolCorrections,
  approveSchoolPreview,
  rejectSchoolPreview,
  resolveSchoolCorrection,
  rejectSchoolCorrection,
  updateSchoolStudent,
  createSchoolStudent,
} from './mobile-api';
import { mobile_siteConfig } from './mobile-siteConfig';

const TOKEN_KEY = '@school_app_token';

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setStoredToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/** Generic API request – replace with real fetch when backend is ready */
export async function apiGet<T>(url: string): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(url, { method: 'GET', headers });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiPost<T>(url: string, body?: object): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}

// --- Mock data helpers for development (no backend) ---

import type {
  CorrectionChange,
  CorrectionItem,
  DashboardStats,
  ClassItem,
  Student,
  StudentCreatePayload,
  StudentStatus,
  StudentUpdatePayload,
} from '../types';
import {
  extractTemplateDataFields,
  getAddStudentFieldKeys,
  mergeTemplateFieldKeys,
} from '../utils/cardFields';
import { sortClassItems } from '../utils/classSort';

let mockStudents: Student[] = [];
let mockClasses: ClassItem[] = [];

export function getMockStudents(): Student[] {
  return mockStudents;
}

export function setMockStudents(students: Student[]) {
  mockStudents = students;
}

export function getMockClasses(): ClassItem[] {
  return mockClasses;
}

export function setMockClasses(classes: ClassItem[]) {
  mockClasses = classes;
}

/** Generate initial mock data if empty */
export function ensureMockData() {
  if (mockClasses.length === 0) {
    mockClasses = [
      { id: 'c1', schoolId: 's1', name: '1' },
      { id: 'c2', schoolId: 's1', name: '2' },
      { id: 'c3', schoolId: 's1', name: '3' },
    ];
  }
  if (mockStudents.length === 0) {
    const statuses: StudentStatus[] = [
      'pending',
      'photo_uploaded',
      'preview_sent',
      'correction_pending',
      'approved',
      'printed',
      'delivered',
      'received_by_school',
    ];
    mockStudents = mockClasses.flatMap((c, i) =>
      [1, 2, 3].map((n) => ({
        id: `st_${c.id}_${n}`,
        name: `Student ${c.name}-${n}`,
        rollNo: `${n}`,
        className: c.name,
        classId: c.id,
        schoolId: c.schoolId,
        schoolName: 'Demo School',
        status: statuses[(i * 3 + n) % statuses.length],
      }))
    );
  }
}

type SchoolDashboardResponse = {
  totalStudents?: number;
  photoUploaded?: number;
  previewPending?: number;
  correctionPending?: number;
  approved?: number;
  printed?: number;
  delivered?: number;
  received?: number;
};

export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    const res = (await getSchoolDashboard()) as SchoolDashboardResponse;
    return {
      totalStudents: res.totalStudents ?? 0,
      photoUploaded: res.photoUploaded ?? 0,
      previewPending: res.previewPending ?? 0,
      correctionPending: res.correctionPending ?? 0,
      approved: res.approved ?? 0,
      printed: res.printed ?? 0,
      delivered: res.delivered ?? 0,
      receivedBySchool: res.received ?? 0,
    };
  } catch {
    ensureMockData();
    const students = getMockStudents();
    const totalStudents = students.length;
    const photoUploaded = students.filter((s) => s.status === 'photo_uploaded' || ['preview_sent', 'correction_pending', 'approved', 'printed', 'delivered', 'received_by_school'].includes(s.status)).length;
    const previewPending = students.filter((s) => s.status === 'preview_sent').length;
    const correctionPending = students.filter((s) => s.status === 'correction_pending').length;
    const approved = students.filter((s) => s.status === 'approved').length;
    const printed = students.filter((s) => s.status === 'printed').length;
    const delivered = students.filter((s) => s.status === 'delivered' || s.status === 'received_by_school').length;
    return {
      totalStudents,
      photoUploaded,
      previewPending,
      correctionPending,
      approved,
      printed,
      delivered,
      receivedBySchool: students.filter((s) => s.status === 'received_by_school').length,
    };
  }
}

const USER_KEY = '@school_app_user';

export async function fetchClasses(): Promise<ClassItem[]> {
  try {
    const res = await getSchoolClasses() as { classes?: Array<{ _id: string; className: string; section: string }> };
    const list = res?.classes ?? [];
    const userJson = await AsyncStorage.getItem(USER_KEY);
    const user = userJson ? (JSON.parse(userJson) as { schoolId?: string }) : {};
    const schoolId = user.schoolId ?? '';
    const classes = list.map((c) => ({
      id: c._id,
      schoolId,
      name: c.section ? `${c.className} - ${c.section}` : c.className,
    }));
    return sortClassItems(classes);
  } catch {
    ensureMockData();
    return sortClassItems([...getMockClasses()]);
  }
}

type ApiStudent = {
  _id: string;
  schoolId: string;
  classId: { _id: string; className: string; section: string };
  rollNo: string;
  studentName: string;
  admissionNo?: string;
  mobile?: string;
  address?: string;
  status: string;
  [key: string]: unknown;
};

const API_STATUS_TO_APP: Record<string, StudentStatus> = {
  pending: 'pending',
  photo_uploaded: 'photo_uploaded',
  preview_sent: 'preview_sent',
  correction_pending: 'correction_pending',
  approved: 'approved',
  printed: 'printed',
  delivered: 'delivered',
  received: 'received_by_school',
  received_by_school: 'received_by_school',
};

function mapApiStatus(status: string): StudentStatus {
  return API_STATUS_TO_APP[status] ?? 'pending';
}

type ApiGlobalSearchStudent = {
  _id: string;
  schoolId: string | { _id: string; schoolName: string };
  classId:
    | string
    | { _id: string; className: string; section?: string; sectionProvided?: boolean };
  rollNo?: string;
  studentName: string;
  admissionNo?: string;
  mobile?: string;
  address?: string;
  photoNo?: string;
  photoUrl?: string;
  status?: string;
  [key: string]: unknown;
};

function mapApiStudentListItem(s: ApiGlobalSearchStudent): Student {
  const schoolIdObj = s.schoolId && typeof s.schoolId === 'object' ? s.schoolId : null;
  const classIdObj = s.classId && typeof s.classId === 'object' ? s.classId : null;
  return {
    id: s._id,
    name: s.studentName,
    admissionNo: s.admissionNo,
    mobile: s.mobile,
    address: s.address,
    photoNo: s.photoNo,
    rollNo: s.rollNo ?? '',
    className: classIdObj
      ? `${classIdObj.className}${classIdObj.section ? ` - ${classIdObj.section}` : ''}`
      : '',
    classId: classIdObj ? classIdObj._id : (s.classId as string),
    sectionName: classIdObj?.section,
    schoolId: schoolIdObj ? schoolIdObj._id : (s.schoolId as string),
    schoolName: schoolIdObj ? schoolIdObj.schoolName : '',
    status: mapApiStatus(s.status ?? 'pending'),
    photoUri: getFullPhotoUrl(s.photoUrl),
  };
}

/** School-wide student search by name, mobile, or photo number. */
export async function searchStudentsGlobal(query: string): Promise<Student[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const res = (await getSchoolStudentsGlobalSearch(q)) as { students?: ApiGlobalSearchStudent[] };
    const list = res?.students ?? [];
    return list.map(mapApiStudentListItem);
  } catch {
    ensureMockData();
    const lower = q.toLowerCase();
    return getMockStudents().filter(
      (s) =>
        s.name.toLowerCase().includes(lower) ||
        (s.mobile ?? '').includes(q) ||
        (s.photoNo ?? '').includes(q),
    );
  }
}

export async function fetchStudentsByClass(classId: string): Promise<Student[]> {
  try {
    const res = (await getSchoolStudents()) as { students?: ApiStudent[] };
    const list = res?.students ?? [];
    const filtered = list.filter((s) => (s.classId && typeof s.classId === 'object' ? s.classId._id : s.classId) === classId);
    return filtered.map((s) => ({
      id: s._id,
      admissionNo:s.admissionNo,
      mobile: s.mobile,
      address: s.address,
      name: s.studentName,
      rollNo: s.rollNo ?? '',
      className: s.classId && typeof s.classId === 'object' ? `${s.classId.className}${s.classId.section ? ' - ' + s.classId.section : ''}` : '',
      classId: s.classId && typeof s.classId === 'object' ? s.classId._id : (s.classId as unknown as string),
      sectionName: s.classId && typeof s.classId === 'object' ? s.classId.section : undefined,
      sectionId: s.classId && typeof s.classId === 'object' ? s.classId._id : undefined,
      schoolId: s.schoolId,
      schoolName: '',
      status: mapApiStatus(s.status ?? 'pending'),
    }));
  } catch {
    ensureMockData();
    return getMockStudents().filter((s) => s.classId === classId);
  }
}

export async function fetchPendingTemplateStudents(): Promise<Student[]> {
  try {
    const res = (await getSchoolPendingTemplateStudents()) as { students?: ApiStudent[] };
    const list = res?.students ?? [];
    return list.map((s) => ({
      id: s._id,
      admissionNo: s.admissionNo,
      mobile: s.mobile,
      address: s.address,
      name: s.studentName,
      rollNo: s.rollNo ?? '',
      className:
        s.classId && typeof s.classId === 'object'
          ? `${s.classId.className}${s.classId.section ? ' - ' + s.classId.section : ''}`
          : '',
      classId: s.classId && typeof s.classId === 'object' ? s.classId._id : (s.classId as unknown as string),
      sectionName: s.classId && typeof s.classId === 'object' ? s.classId.section : undefined,
      sectionId: s.classId && typeof s.classId === 'object' ? s.classId._id : undefined,
      schoolId: s.schoolId,
      schoolName: '',
      status: mapApiStatus(s.status ?? 'pending'),
    }));
  } catch {
    ensureMockData();
    return getMockStudents().filter((s) => s.status === 'pending');
  }
}

type ApiStudentDetail = {
  _id: string;
  schoolId: string | { _id: string; schoolName: string };
  classId: string | { _id: string; className: string; section: string };
  rollNo?: string;
  studentName: string;
  mobile?: string;
  address?: string;
  admissionNo:string;
  card?: Record<string, unknown>;
  uniqueCode?: string;
  status?: string;
  correctionReason?: string;
  photoUrl?: string;
  [key: string]: unknown;
};

function sanitizeMobileValue(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const tokens = trimmed
    .split(/[\n,;/|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (!tokens.length) return undefined;

  const firstValid = tokens.find((item) => item.replace(/\D/g, '').length >= 10) ?? tokens[0];
  return firstValid || undefined;
}

function pickMobileFromRecord(rec: Record<string, unknown>): string | undefined {
  const directKeys = [
    'mobile',
    'mobileNo',
    'mobileNO',
    'mobileNumber',
    'phone',
    'phoneNumber',
    'contact',
    'contactNumber',
    'whatsapp',
    'whatsappNo',
    'whatsappNumber',
    'parentMobile',
    'fatherMobile',
    'motherMobile',
    'guardianMobile',
  ];

  for (const key of directKeys) {
    const mobile = sanitizeMobileValue(rec[key]);
    if (mobile) return mobile;
  }

  return undefined;
}

function pickMobileFromExtraFields(value: unknown): string | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;

  const extra = value as Record<string, unknown>;
  const direct = pickMobileFromRecord(extra);
  if (direct) return direct;

  const normalizeKey = (input: string) => input.toLowerCase().replace(/[^a-z0-9]/g, '');
  const preferredKeys = new Set([
    'mobile',
    'mobileno',
    'mobilenumber',
    'phone',
    'phonenumber',
    'contact',
    'contactnumber',
    'whatsapp',
    'whatsappno',
    'whatsappnumber',
    'parentmobile',
    'fathermobile',
    'mothermobile',
    'guardianmobile',
  ]);
  const preferredTokens = ['mobile', 'phone', 'contact', 'whatsapp'];
  const relationTokens = ['father', 'mother', 'parent', 'guardian'];

  for (const [key, rawValue] of Object.entries(extra)) {
    const normalizedKey = normalizeKey(key);
    const isDirectPreferred = preferredKeys.has(normalizedKey);
    const hasPhoneToken = preferredTokens.some((token) => normalizedKey.includes(token));
    const hasRelationToken = relationTokens.some((token) => normalizedKey.includes(token));
    if (!isDirectPreferred && !(hasPhoneToken || hasRelationToken)) continue;

    const mobile = sanitizeMobileValue(rawValue);
    if (mobile) return mobile;
  }

  // Final fallback: if any extra field value looks like a phone, use first match.
  for (const rawValue of Object.values(extra)) {
    const mobile = sanitizeMobileValue(rawValue);
    if (mobile) return mobile;
  }

  return undefined;
}

function getPreferredStudentMobile(student: ApiStudentDetail): string | undefined {
  const rec = student as Record<string, unknown>;
  const direct = pickMobileFromRecord(rec);
  if (direct) return direct;

  const extraCandidates = [
    rec.extraFields,
    rec.extra_fields,
    rec.extraField,
    rec.extra_field,
    rec.customFields,
    rec.custom_fields,
    rec.templateFields,
    rec.template_fields,
  ];

  for (const candidate of extraCandidates) {
    const mobile = pickMobileFromExtraFields(candidate);
    if (mobile) return mobile;
  }

  return undefined;
}

function normalizeCardFields(value: unknown): Student['card'] | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const entries = Object.entries(value as Record<string, unknown>).filter(
    ([, v]) => v !== null && v !== undefined && String(v).trim() !== '',
  );
  if (!entries.length) return undefined;
  return Object.fromEntries(entries.map(([k, v]) => [k, typeof v === 'boolean' ? v : String(v)]));
}

/** Full card template from API — keeps empty keys so forms match template fields. */
function normalizeCardTemplate(value: unknown): Student['cardTemplate'] | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const entries = Object.entries(value as Record<string, unknown>).filter(([key]) => {
    const norm = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    return norm !== 'photo' && norm !== 'photourl' && norm !== 'colorcode';
  });
  if (!entries.length) return undefined;
  return Object.fromEntries(
    entries.map(([k, v]) => [
      k,
      v == null || v === undefined ? '' : typeof v === 'boolean' ? String(v) : String(v),
    ]),
  );
}

type ApiPreviewTemplate = {
  elements?: Array<{ type?: string; dataField?: string }>;
  backElements?: Array<{ type?: string; dataField?: string }>;
};

function getFullPhotoUrl(photoUrl: string | undefined): string | undefined {
  if (!photoUrl || !photoUrl.trim()) return undefined;
  const base = mobile_siteConfig.BASE_URL.replace(/\/$/, '');
  const path = photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`;
  return `${base}${path}`;
}

export async function fetchStudentDetail(id: string): Promise<Student | null> {
  // console.log("fetchStudentDetail id", id);
  try {
    const res = (await getSchoolStudentDetail(id)) as {
      student?: ApiStudentDetail;
      card?: Record<string, unknown>;
    };
    const s = res?.student;
    if (!s) return null;
    const cardRaw = res?.card ?? s.card;
    const card = normalizeCardFields(cardRaw);
    const cardTemplate = normalizeCardTemplate(cardRaw);
    const schoolIdObj = s.schoolId && typeof s.schoolId === 'object' ? s.schoolId : null;
    const classIdObj = s.classId && typeof s.classId === 'object' ? s.classId : null;
    return {
      id: s._id,
      name: s.studentName,
      card: card,
      cardTemplate: cardTemplate,
      uniqueCode: s.uniqueCode,
      mobile: getPreferredStudentMobile(s),
      admissionNo:s.admissionNo,
      address: s.address,
      rollNo: s.rollNo ?? '',
      className: classIdObj ? `${classIdObj.className}${classIdObj.section ? ' - ' + classIdObj.section : ''}` : '',
      classId: classIdObj ? classIdObj._id : (s.classId as string),
      sectionName: classIdObj?.section,
      sectionId: classIdObj?._id,
      schoolId: schoolIdObj ? schoolIdObj._id : (s.schoolId as string),
      schoolName: schoolIdObj ? schoolIdObj.schoolName : '',
      status: mapApiStatus(s.status ?? 'pending'),
      correctionReason: s.correctionReason,
      photoUri: getFullPhotoUrl(s.photoUrl),
    };
  } catch {
    ensureMockData();
    return getMockStudents().find((s) => s.id === id) ?? null;
  }
}

export async function approvePreview(studentId: string): Promise<void> {
  try {
    await approveSchoolPreview(studentId);
  } catch {
    const list = getMockStudents();
    const idx = list.findIndex((s) => s.id === studentId);
    if (idx >= 0) list[idx].status = 'approved';
    setMockStudents([...list]);
    throw new Error('Failed to approve preview');
  }
}

export async function rejectPreview(studentId: string, comment: string): Promise<void> {
  try {
    await rejectSchoolPreview(studentId, comment);
  } catch {
    const list = getMockStudents();
    const idx = list.findIndex((s) => s.id === studentId);
    if (idx >= 0) {
      list[idx].status = 'correction_pending';
      list[idx].correctionReason = comment;
    }
    setMockStudents([...list]);
    throw new Error('Failed to reject preview');
  }
}

/** Resolve add-student form keys from class template (preview elements or student card template). */
export async function resolveAddStudentFieldKeys(
  students: Student[],
): Promise<string[]> {
  const sampleId = students[0]?.id;
  if (sampleId) {
    try {
      const preview = (await getSchoolPreview(sampleId)) as {
        template?: ApiPreviewTemplate;
      };
      const fromElements = mergeTemplateFieldKeys(
        extractTemplateDataFields(preview?.template?.elements),
        extractTemplateDataFields(preview?.template?.backElements),
      );
      if (fromElements.length > 0) return fromElements;
    } catch {
      /* try detail card template */
    }

    try {
      const detail = await fetchStudentDetail(sampleId);
      if (detail?.cardTemplate) return getAddStudentFieldKeys(detail.cardTemplate);
      if (detail?.card) return getAddStudentFieldKeys(detail.card);
    } catch {
      /* use defaults */
    }
  }

  const withTemplate = students.find(
    (s) => s.cardTemplate && Object.keys(s.cardTemplate).length > 0,
  );
  if (withTemplate?.cardTemplate) return getAddStudentFieldKeys(withTemplate.cardTemplate);

  const withCard = students.find((s) => s.card && Object.keys(s.card).length > 0);
  if (withCard?.card) return getAddStudentFieldKeys(withCard.card);

  return getAddStudentFieldKeys(undefined);
}

/** Create student – POST api/school/students */
export async function createStudent(payload: StudentCreatePayload): Promise<void> {
  try {
    const res = await createSchoolStudent(payload);
    const data = res && typeof res === 'object' && 'data' in res ? (res as { data: unknown }).data : res;
    console.log('[createStudent] API response:', JSON.stringify(data ?? res, null, 2));
  } catch (e) {
    console.log('[createStudent] API error:', e);
    const axiosErr = e as { response?: { data?: { message?: string } } };
    const msg = axiosErr.response?.data?.message;
    throw new Error(typeof msg === 'string' ? msg : 'Failed to add student');
  }
}

/** Update student – PUT api/school/students/:studentId */
export async function updateStudent(
  studentId: string,
  payload: StudentUpdatePayload,
): Promise<void> {
  try {
    const res = await updateSchoolStudent(studentId, payload);
    const data = res && typeof res === 'object' && 'data' in res ? (res as { data: unknown }).data : res;
    console.log('[updateStudent] API response:', JSON.stringify(data ?? res, null, 2));
  } catch (e) {
    console.log('[updateStudent] API error:', e);
    throw e instanceof Error ? e : new Error('Failed to update student');
  }
}

export async function raiseCorrection(studentId: string, reason: string): Promise<void> {
  try {
    await requestSchoolCorrection(studentId, reason);
  } catch (e) {
    const list = getMockStudents();
    const idx = list.findIndex((s) => s.id === studentId);
    if (idx >= 0) {
      list[idx].status = 'correction_pending';
      list[idx].correctionReason = reason;
    }
    setMockStudents([...list]);
    throw e instanceof Error ? e : new Error('Failed to submit correction request');
  }
}

type ApiCorrection = {
  _id: string;
  studentId?:
    | string
    | {
        _id: string;
        admissionNo?: string;
        admission_no?: string;
        rollNo?: string;
        roll_no?: string;
        studentName?: string;
        student_name?: string;
      };
  comment?: string;
  status?: string;
  requestedBy?: string;
  requester?: string;
  source?: string;
  studentName?: string;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

function pickFirstNonEmptyString(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

function extractRequestedBy(c: ApiCorrection): string | undefined {
  const rec = c as Record<string, unknown>;
  const direct = pickFirstNonEmptyString(rec, [
    'requestedBy',
    'requested_by',
    'requestedFrom',
    'requested_from',
    'requester',
    'correctionBy',
    'correction_by',
    'raisedBy',
    'raised_by',
    'submittedBy',
    'submitted_by',
    'source',
    'role',
    'requestType',
    'request_type',
    'userType',
    'user_type',
    'createdByType',
    'created_by_type',
    'initiator',
    'requestedUserType',
    'requested_user_type',
  ]);
  if (direct) return direct;

  for (const nestKey of ['meta', 'metadata', 'details', 'extra', '_doc']) {
    const nest = rec[nestKey];
    if (nest && typeof nest === 'object' && !Array.isArray(nest)) {
      const nested = pickFirstNonEmptyString(nest as Record<string, unknown>, [
        'requestedBy',
        'requested_by',
        'requester',
        'source',
        'role',
        'type',
        'userType',
        'user_type',
      ]);
      if (nested) return nested;
    }
  }

  const userLike = rec.createdBy ?? rec.created_by ?? rec.requestedByUser ?? rec.requested_by_user ?? rec.user ?? rec.userId ?? rec.user_id;
  if (userLike && typeof userLike === 'object' && !Array.isArray(userLike)) {
    const u = userLike as Record<string, unknown>;
    const fromUser =
      pickFirstNonEmptyString(u, ['role', 'type', 'userType', 'user_type', 'name', 'fullName', 'full_name']) ??
      (typeof u.mobile === 'string' ? u.mobile : undefined);
    if (fromUser) return fromUser;
  }

  return undefined;
}

function mergeOldNewRecords(
  oldRec: Record<string, unknown>,
  newRec: Record<string, unknown>,
): CorrectionChange[] {
  const keys = new Set([...Object.keys(oldRec), ...Object.keys(newRec)]);
  const out: CorrectionChange[] = [];
  keys.forEach((field) => {
    if (field.startsWith('_')) return;
    const ov = oldRec[field];
    const nv = newRec[field];
    if (ov === undefined && nv === undefined) return;
    out.push({
      field,
      oldValue: ov !== undefined && ov !== null ? String(ov) : undefined,
      newValue: nv !== undefined && nv !== null ? String(nv) : undefined,
    });
  });
  return out;
}

function tryChangesFromOldNewPairs(c: Record<string, unknown>): CorrectionChange[] | null {
  const pairs: [string, string][] = [
    ['oldValues', 'newValues'],
    ['old_values', 'new_values'],
    ['previousValues', 'requestedValues'],
    ['previous_values', 'requested_values'],
    ['currentValues', 'requestedValues'],
    ['before', 'after'],
    ['from', 'to'],
    ['existing', 'proposed'],
  ];
  for (const [ok, nk] of pairs) {
    const o = c[ok];
    const n = c[nk];
    if (
      o &&
      n &&
      typeof o === 'object' &&
      typeof n === 'object' &&
      !Array.isArray(o) &&
      !Array.isArray(n)
    ) {
      const merged = mergeOldNewRecords(o as Record<string, unknown>, n as Record<string, unknown>);
      if (merged.length > 0) return merged;
    }
  }
  return null;
}

/** Parse one blob that might be array | flat map | map of { old, new } entries */
function normalizeCorrectionChanges(raw: unknown): CorrectionChange[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return (raw as Record<string, unknown>[])
      .map((x) => {
        const field = String(
          x.field ?? x.key ?? x.fieldName ?? x.field_name ?? x.path ?? x.property ?? x.name ?? '',
        );
        const oldValue =
          x.oldValue ?? x.old ?? x.previous ?? x.from ?? x.current ?? x.before;
        const newValue =
          x.newValue ?? x.new ?? x.updated ?? x.to ?? x.proposed ?? x.after ?? x.value;
        return {
          field,
          oldValue: oldValue != null ? String(oldValue) : undefined,
          newValue: newValue != null ? String(newValue) : undefined,
        };
      })
      .filter((ch) => ch.field.length > 0 || ch.newValue != null || ch.oldValue != null);
  }
  if (typeof raw === 'object') {
    return Object.entries(raw as Record<string, unknown>)
      .map(([field, val]) => {
        if (val != null && typeof val === 'object' && !Array.isArray(val)) {
          const o = val as Record<string, unknown>;
          const oldV =
            o.oldValue ?? o.old ?? o.previous ?? o.from ?? o.current ?? o.before ?? o.existing;
          const newV =
            o.newValue ?? o.new ?? o.updated ?? o.to ?? o.proposed ?? o.after ?? o.requested ?? o.value;
          if (oldV !== undefined || newV !== undefined) {
            return {
              field,
              oldValue: oldV != null ? String(oldV) : undefined,
              newValue: newV != null ? String(newV) : undefined,
            };
          }
        }
        return {
          field,
          newValue:
            val != null && typeof val !== 'object'
              ? String(val)
              : Array.isArray(val)
                ? val.map(String).join(', ')
                : undefined,
        };
      })
      .filter((ch) => ch.field.length > 0 || ch.newValue != null || ch.oldValue != null);
  }
  return [];
}

const CHANGE_BLOB_KEYS = [
  'changes',
  'requested_changes',
  'requestedChanges',
  'requested_changes_map',
  'field_changes',
  'fieldChanges',
  'updates',
  'modifications',
  'fields',
  'payload',
  'correctionData',
  'correction_data',
  'diff',
  'delta',
  'requested_fields',
  'requestedFields',
  'body',
];

function extractChangesFromCorrection(c: ApiCorrection): CorrectionChange[] {
  const rec = c as Record<string, unknown>;

  const fromPairs = tryChangesFromOldNewPairs(rec);
  if (fromPairs && fromPairs.length > 0) return fromPairs;

  for (const key of CHANGE_BLOB_KEYS) {
    const normalized = normalizeCorrectionChanges(rec[key]);
    if (normalized.length > 0) return normalized;
  }

  return [];
}

function unwrapCorrectionsPayload(res: unknown): ApiCorrection[] {
  if (res == null) return [];
  if (Array.isArray(res)) return res as ApiCorrection[];

  if (typeof res !== 'object') return [];
  const r = res as Record<string, unknown>;

  if (Array.isArray(r.corrections)) return r.corrections as ApiCorrection[];
  if (Array.isArray(r.data) && r.data?.length && typeof (r.data as unknown[])[0] === 'object')
    return r.data as ApiCorrection[];

  const inner = r.data;
  if (inner && typeof inner === 'object') {
    const d = inner as Record<string, unknown>;
    if (Array.isArray(d.corrections)) return d.corrections as ApiCorrection[];
    if (Array.isArray(d.results)) return d.results as ApiCorrection[];
    if (Array.isArray(d.items)) return d.items as ApiCorrection[];
  }

  if (Array.isArray(r.results)) return r.results as ApiCorrection[];
  if (Array.isArray(r.items)) return r.items as ApiCorrection[];

  return [];
}

function mapApiCorrectionToItem(c: ApiCorrection): CorrectionItem {
  const sid = c.studentId && typeof c.studentId === 'object' ? c.studentId : null;
  const studentId = sid?._id ?? (typeof c.studentId === 'string' ? c.studentId : '');
  const admissionNo = sid?.admissionNo ?? sid?.admission_no;
  const rollNo = sid?.rollNo ?? sid?.roll_no;
  const studentNm =
    sid?.studentName ?? sid?.student_name ?? (typeof c.studentName === 'string' ? c.studentName : '');

  const changes = extractChangesFromCorrection(c);

  const createdAt =
    typeof c.createdAt === 'string'
      ? c.createdAt
      : typeof c.updatedAt === 'string'
        ? c.updatedAt
        : typeof c.created_at === 'string'
          ? c.created_at
          : typeof c.updated_at === 'string'
            ? c.updated_at
            : undefined;

  return {
    id: String(c._id),
    studentId,
    studentName: studentNm,
    admissionNo,
    rollNo,
    requestedBy: extractRequestedBy(c),
    changes,
    comment: typeof c.comment === 'string' ? c.comment : undefined,
    status: typeof c.status === 'string' ? c.status : undefined,
    createdAt,
  };
}

/** Pending correction queue — GET api/school/corrections (via mobile-api BASE_URL + Bearer token). */
export async function fetchCorrectionList(): Promise<CorrectionItem[]> {
  try {
    const res = await getSchoolCorrections();
    const list = unwrapCorrectionsPayload(res).map(mapApiCorrectionToItem);
    return list.filter((item) => {
      const st = item.status?.toLowerCase();
      return !st || st === 'pending';
    });
  } catch {
    ensureMockData();
    return getMockStudents()
      .filter((s) => s.status === 'correction_pending')
      .map((s, idx) => ({
        id: `mock_corr_${s.id}_${idx}`,
        studentId: s.id,
        studentName: s.name,
        admissionNo: s.admissionNo,
        rollNo: s.rollNo,
        requestedBy: 'Parent',
        changes: [{ field: 'studentName', newValue: `${s.name} (edited)` }],
        comment: s.correctionReason,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }));
  }
}

export async function resolveCorrection(correctionId: string, note?: string): Promise<void> {
  await resolveSchoolCorrection(correctionId, note);
}

export async function rejectCorrection(correctionId: string, note?: string): Promise<void> {
  await rejectSchoolCorrection(correctionId, note);
}

export async function fetchDeliveryList(): Promise<Student[]> {
  ensureMockData();
  return getMockStudents().filter((s) => s.status === 'delivered' || s.status === 'printed');
}

export async function markDeliveryReceived(studentIds: string[]): Promise<void> {
  const list = getMockStudents();
  studentIds.forEach((id) => {
    const idx = list.findIndex((s) => s.id === id);
    if (idx >= 0) list[idx].status = 'received_by_school';
  });
  setMockStudents([...list]);
}

export async function downloadReport(type: 'students' | 'approved' | 'delivery'): Promise<string> {
  // In real app: return blob URL or file path
  return `Report ${type} downloaded (mock)`;
}
