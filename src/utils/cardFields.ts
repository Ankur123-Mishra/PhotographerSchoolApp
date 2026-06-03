import type {
  Student,
  StudentCardFields,
  StudentCreatePayload,
  StudentUpdatePayload,
} from '../types';

export function formatCardLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Non-empty entries from card — same filter as StudentDetailScreen meta rows */
export function getCardFieldEntries(
  card: StudentCardFields | undefined,
): [string, string][] {
  if (!card) return [];
  return Object.entries(card)
    .filter(([, value]) => value != null && String(value).trim() !== '')
    .map(([key, value]) => [key, String(value)]);
}

export function buildCardEditForm(card: StudentCardFields | undefined): Record<string, string> {
  return Object.fromEntries(getCardFieldEntries(card));
}

const CARD_KEY_TO_PAYLOAD: Record<string, keyof Omit<StudentUpdatePayload, 'extraFields'>> = {
  name: 'studentName',
  studentname: 'studentName',
  admissionno: 'admissionNo',
  admission: 'admissionNo',
  rollno: 'rollNo',
  roll: 'rollNo',
  fathername: 'fatherName',
  father: 'fatherName',
  mothername: 'motherName',
  mother: 'motherName',
  dob: 'dob',
  dateofbirth: 'dob',
  birthdate: 'dob',
  mobile: 'mobile',
  mobileno: 'mobile',
  phone: 'mobile',
  address: 'address',
  gender: 'gender',
  bloodgroup: 'bloodGroup',
  house: 'house',
  photono: 'photoNo',
  photo: 'photoNo',
};

const EMPTY_PAYLOAD: StudentUpdatePayload = {
  studentName: '',
  admissionNo: '',
  rollNo: '',
  fatherName: '',
  motherName: '',
  dob: '',
  mobile: '',
  address: '',
  gender: '',
  bloodGroup: '',
  house: '',
  photoNo: '',
  extraFields: {},
};

const PAYLOAD_FIELD_FORM_KEYS: Record<
  keyof Omit<StudentUpdatePayload, 'extraFields' | 'classId'>,
  string
> = {
  studentName: 'studentName',
  admissionNo: 'admissionNo',
  rollNo: 'rollNo',
  fatherName: 'fatherName',
  motherName: 'motherName',
  dob: 'dob',
  mobile: 'mobile',
  address: 'address',
  gender: 'gender',
  bloodGroup: 'bloodGroup',
  house: 'house',
  photoNo: 'photoNo',
};

function cardFormCoversPayloadField(
  cardForm: Record<string, string>,
  payloadField: keyof Omit<StudentUpdatePayload, 'extraFields' | 'classId'>,
): boolean {
  return Object.keys(cardForm).some(
    (key) => CARD_KEY_TO_PAYLOAD[normalizeKey(key)] === payloadField,
  );
}

/** Existing student record → PUT body defaults (matches API schema). */
export function studentToBasePayload(student: Student): StudentUpdatePayload {
  return {
    studentName: student.name?.trim() ?? '',
    admissionNo: student.admissionNo?.trim() ?? '',
    rollNo: student.rollNo?.trim() ?? '',
    fatherName: student.fatherName?.trim() ?? '',
    motherName: student.motherName?.trim() ?? '',
    dob: student.dob?.trim() ?? '',
    mobile: student.mobile?.trim() ?? '',
    address: student.address?.trim() ?? '',
    gender: student.gender?.trim() ?? '',
    bloodGroup: student.bloodGroup?.trim() ?? '',
    house: student.house?.trim() ?? '',
    photoNo: student.photoNo?.trim() ?? '',
    extraFields: { ...(student.extraFields ?? {}) },
  };
}

/** Card + student fields for the edit form (all template keys, with values filled in). */
export function buildStudentEditForm(student: Student): Record<string, string> {
  const form = Object.fromEntries(
    getStudentFormFieldKeys(student).map((key) => [key, '']),
  );

  for (const [key, value] of getCardFieldEntries(student.cardTemplate ?? student.card)) {
    form[key] = value;
  }
  for (const [key, value] of getCardFieldEntries(student.card)) {
    if (!form[key]?.trim()) form[key] = value;
  }

  const base = studentToBasePayload(student);

  for (const [field, formKey] of Object.entries(PAYLOAD_FIELD_FORM_KEYS)) {
    const payloadField = field as keyof Omit<StudentUpdatePayload, 'extraFields'>;
    if (cardFormCoversPayloadField(form, payloadField)) continue;
    const value = base[payloadField];
    if (value && !form[formKey]) form[formKey] = value;
  }

  for (const [key, value] of Object.entries(base.extraFields)) {
    if (!(key in form)) form[key] = value;
  }

  const displayName = getStudentDisplayName(student);
  const nameKey =
    Object.keys(form).find((k) => {
      const norm = normalizeKey(k);
      return norm === 'name' || norm === 'studentname';
    }) ?? 'name';
  if (displayName) form[nameKey] = displayName;

  return form;
}

export function getStudentEditFieldEntries(student: Student): [string, string][] {
  return Object.entries(buildStudentEditForm(student)).filter(([, value]) => value.trim() !== '');
}

/** Display name — same logic as StudentDetailScreen header. */
export function getStudentDisplayName(student: Student): string {
  return (
    (typeof student.card?.name === 'string' && student.card.name.trim()) ||
    student.name?.trim() ||
    ''
  );
}

const SKIP_TEMPLATE_KEYS = new Set(['photo', 'photourl', 'colorcode', 'colorcodephoto']);

/** Text field keys from ID card template elements (preview API). */
export function extractTemplateDataFields(
  elements: Array<{ type?: string; dataField?: string }> | undefined,
): string[] {
  if (!elements?.length) return [];
  const seen = new Set<string>();
  const fields: string[] = [];
  for (const el of elements) {
    if (el.type === 'photo' || el.type === 'colorCode') continue;
    const df = el.dataField?.trim();
    if (!df) continue;
    const norm = normalizeKey(df);
    if (seen.has(norm)) continue;
    seen.add(norm);
    fields.push(df);
  }
  return fields;
}

/** Merge multiple template key sources; name-like field is always first. */
export function mergeTemplateFieldKeys(...sources: (string[] | undefined)[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  let nameKey: string | undefined;

  for (const source of sources) {
    if (!source?.length) continue;
    for (const key of source) {
      const norm = normalizeKey(key);
      if (SKIP_TEMPLATE_KEYS.has(norm)) continue;
      if (norm === 'name' || norm === 'studentname') {
        if (!nameKey) nameKey = key;
        continue;
      }
      if (seen.has(norm)) continue;
      seen.add(norm);
      ordered.push(key);
    }
  }

  return nameKey ? [nameKey, ...ordered] : ordered.length ? ['name', ...ordered] : [];
}

/** Template keys for forms — prefers cardTemplate, then card, then defaults. */
export function getStudentFormFieldKeys(student: Student): string[] {
  const template = student.cardTemplate ?? student.card;
  return getAddStudentFieldKeys(template);
}

/** Form entries for add/edit — all template keys with current values. */
export function getStudentFormFieldEntries(student: Student): [string, string][] {
  const keys = getStudentFormFieldKeys(student);
  const form = buildStudentEditForm(student);
  return keys.map((key) => [key, form[key] ?? '']);
}

/** Default form keys when class has no card template sample yet. */
export const DEFAULT_ADD_STUDENT_FIELD_KEYS = [
  'name',
  'admissionNo',
  'rollNo',
  'fatherName',
  'motherName',
  'dob',
  'mobile',
  'address',
  'gender',
  'bloodGroup',
  'house',
  'photoNo',
];

/** Field keys for add-student form — mirrors ID card template keys (name first). */
export function getAddStudentFieldKeys(card: StudentCardFields | undefined): string[] {
  if (!card || Object.keys(card).length === 0) {
    return [...DEFAULT_ADD_STUDENT_FIELD_KEYS];
  }
  const keys = Object.keys(card).filter((k) => {
    const norm = normalizeKey(k);
    return norm !== 'name' && norm !== 'studentname' && !SKIP_TEMPLATE_KEYS.has(norm);
  });
  const nameKey =
    Object.keys(card).find((k) => {
      const norm = normalizeKey(k);
      return norm === 'name' || norm === 'studentname';
    }) ?? 'name';
  return [nameKey, ...keys];
}

export function buildEmptyAddStudentForm(fieldKeys: string[]): Record<string, string> {
  return Object.fromEntries(fieldKeys.map((key) => [key, '']));
}

/** Map add form to POST api/school/students body */
export function cardFormToCreatePayload(
  cardForm: Record<string, string>,
  classId: string,
): StudentCreatePayload {
  return { ...cardFormToUpdatePayload(cardForm), classId };
}

/** Map edited form fields to PUT api/school/students/:id body */
export function cardFormToUpdatePayload(
  cardForm: Record<string, string>,
  base: StudentUpdatePayload = EMPTY_PAYLOAD,
): StudentUpdatePayload {
  const payload: StudentUpdatePayload = {
    ...base,
    extraFields: { ...base.extraFields },
  };

  for (const [key, raw] of Object.entries(cardForm)) {
    const value = raw.trim();
    const norm = normalizeKey(key);
    const mapped = CARD_KEY_TO_PAYLOAD[norm];

    if (mapped) {
      payload[mapped] = value;
    } else {
      payload.extraFields[key] = value;
    }
  }

  return payload;
}
