import type { ApiPreviewResponse } from '../types/preview';

export type AuthStackParamList = {
  Login: undefined;
};

export type SharedBrowseParamList = {
  ClassList: { autoFocusSearch?: boolean; schoolId?: string; schoolName?: string } | undefined;
  StudentList: {
    classId?: string;
    className?: string;
    schoolId?: string;
    schoolName?: string;
    listMode?: 'class' | 'pending';
    title?: string;
  };
  StudentDetail: { studentId: string; previewData?: ApiPreviewResponse };
  Preview: { studentId: string; previewData?: ApiPreviewResponse };
};

export type MainStackParamList = {
  Dashboard: undefined;
} & SharedBrowseParamList & {
  Delivery: undefined;
  Reports: undefined;
};

export type CorrectionStackParamList = {
  CorrectionPanel: undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
};

export type PhotographerStackParamList = {
  PhotographerDashboard: undefined;
  PhotographerSchools: undefined;
} & Pick<SharedBrowseParamList, 'ClassList' | 'StudentList' | 'StudentDetail' | 'Preview'>;

export type BottomTabsParamList = {
  Home: undefined;
  Correction: undefined;
  Profile: undefined;
};

export type PhotographerBottomTabsParamList = {
  Dashboard: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
};
