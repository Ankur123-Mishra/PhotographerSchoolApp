/** ID card template definition – used to render card preview by theme. */
export interface IdCardTemplate {
  id: string;
  themeColor: string;
}

/** Static templates: Navy, Green, Maroon (match photographer uploads). */
export const ID_CARD_TEMPLATES: IdCardTemplate[] = [
  { id: 'template-navy', themeColor: '#1e3a5f' },
  { id: 'template-green', themeColor: '#166534' },
  { id: 'template-maroon', themeColor: '#7f1d1d' },
];

export function getTemplateById(templateId: string): IdCardTemplate | undefined {
  return ID_CARD_TEMPLATES.find((t) => t.id === templateId);
}

/** Data shape for IdCardPreview – maps from API preview/student response. */
export interface IdCardSampleData {
  schoolName: string;
  studentName: string;
  studentId: string;
  className: string;
  address: string;
  photoUri: string | null;
}
