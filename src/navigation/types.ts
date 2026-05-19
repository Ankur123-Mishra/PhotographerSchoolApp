import type { Student } from '../types';

export type AuthStackParamList = {
  Login: undefined;
};

export type MainStackParamList = {
  Dashboard: undefined;
  ClassList: undefined;
  StudentList: { classId: string; className: string };
  StudentDetail: { studentId: string };
  Preview: { studentId: string };
  Delivery: undefined;
  Reports: undefined;
};

export type CorrectionStackParamList = {
  CorrectionPanel: undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
};

export type BottomTabsParamList = {
  Home: undefined;
  Correction: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
};
