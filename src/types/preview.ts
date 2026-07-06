/** Preview API response shape — shared by PreviewScreen and navigation params. */
export type ApiPreviewStudent = {
  _id: string;
  schoolId:
    | string
    | {
        _id: string;
        schoolName?: string;
        dimension?: { width?: unknown; height?: unknown };
        dimensionUnit?: string;
      };
  classId: string | { _id: string; className?: string; section?: string };
  class?: { _id?: string; className?: string; class_name?: string; section?: string };
  school?: {
    _id?: string;
    schoolName?: string;
    address?: string;
    dimension?: { width?: number; height?: number };
    dimensionUnit?: string;
  };
  uniqueCode?: string;
  studentName: string;
  address?: string;
  photoUrl?: string;
  colorCodePhotoUrl?: string;
  mobile?: string;
  dob?: string;
  status?: string;
  admissionNo?: string;
  extraFields?: Record<string, unknown>;
  [key: string]: unknown;
};

export type ApiTemplateElement = {
  type: 'photo' | 'text' | 'colorCode';
  id: string;
  dataField?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  content?: string;
  fontWeight?: string;
  label?: string;
  textAlign?: string;
  textVerticalAlign?: string;
};

export type ApiTemplate = {
  _id: string;
  name?: string;
  frontImage?: string;
  backImage?: string;
  elements?: ApiTemplateElement[];
  backElements?: ApiTemplateElement[];
  [key: string]: unknown;
};

export type ApiPreviewResponse = {
  preview?: { templateId?: string; [key: string]: unknown };
  student?: ApiPreviewStudent;
  template?: ApiTemplate;
};
