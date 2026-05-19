import type { SchoolProfile } from '../types';

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function str(v: unknown): string | undefined {
  if (typeof v === 'string' && v.trim()) return v.trim();
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return undefined;
}

/** Unwrap common API shapes: `{ school }`, `{ data: school }`, `{ data: { school } }`, or school fields on root. */
export function parseSchoolProfileResponse(res: unknown): SchoolProfile | null {
  const root = asRecord(res);
  if (!root) return null;

  let doc: Record<string, unknown> | null = null;

  const nestedSchool = asRecord(root.school);
  if (nestedSchool) doc = nestedSchool;

  if (!doc) {
    const data = asRecord(root.data);
    if (data) {
      const inner = asRecord(data.school);
      doc = inner ?? (data.schoolName != null || data.name != null || data._id != null ? data : null);
    }
  }

  if (!doc && (root.schoolName != null || root.name != null || root._id != null)) {
    doc = root;
  }

  if (!doc) return null;

  const name =
    str(doc.schoolName) ??
    str(doc.name) ??
    str(doc.school_name) ??
    str(doc.title);
  if (!name) return null;

  return {
    name,
    contact: str(doc.contact) ?? str(doc.mobile) ?? str(doc.phone) ?? str(doc.phoneNumber),
    email: str(doc.email),
    schoolCode: str(doc.schoolCode) ?? str(doc.code) ?? str(doc.school_code),
  };
}
