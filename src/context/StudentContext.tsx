import React, { createContext, useCallback, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import type { Student, DashboardStats, ClassItem, StudentStatus } from '../types';
import {
  fetchDashboardStats,
  fetchClasses,
  fetchStudentsByClass,
  fetchPendingTemplateStudents,
  fetchStudentDetail,
  fetchPhotographerStudentDetail,
  fetchDeliveryList,
  approvePreview,
  rejectPreview,
  raiseCorrection,
  markDeliveryReceived,
} from '../Services/api';

interface StudentState {
  dashboardStats: DashboardStats | null;
  classes: ClassItem[];
  students: Student[];
  deliveryList: Student[];
  loading: boolean;
  error: string | null;
}

interface StudentContextType extends StudentState {
  refreshDashboard: () => Promise<void>;
  refreshClasses: () => Promise<void>;
  loadStudentsByClass: (classId: string) => Promise<void>;
  loadPendingStudents: () => Promise<void>;
  getStudentDetail: (id: string) => Promise<Student | null>;
  refreshDeliveryList: () => Promise<void>;
  approveStudentPreview: (studentId: string) => Promise<void>;
  rejectStudentPreview: (studentId: string, comment: string) => Promise<void>;
  raiseStudentCorrection: (studentId: string, reason: string) => Promise<void>;
  markStudentsReceived: (studentIds: string[]) => Promise<void>;
  clearStudents: () => void;
  setError: (err: string | null) => void;
}

const StudentContext = createContext<StudentContextType | null>(null);

const defaultStats: DashboardStats = {
  totalStudents: 0,
  photoUploaded: 0,
  previewPending: 0,
  correctionPending: 0,
  approved: 0,
  printed: 0,
  delivered: 0,
  receivedBySchool: 0,
};

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<StudentState>({
    dashboardStats: null,
    classes: [],
    students: [],
    deliveryList: [],
    loading: false,
    error: null,
  });

  const refreshDashboard = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const stats = await fetchDashboardStats();
      setState((s) => ({ ...s, dashboardStats: stats, loading: false }));
    } catch (e) {
      setState((s) => ({
        ...s,
        loading: false,
        error: (e as Error).message,
        dashboardStats: defaultStats,
      }));
    }
  }, []);

  const refreshClasses = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const classes = await fetchClasses();
      setState((s) => ({ ...s, classes, loading: false }));
    } catch (e) {
      setState((s) => ({
        ...s,
        loading: false,
        error: (e as Error).message,
        classes: [],
      }));
    }
  }, []);

  const loadStudentsByClass = useCallback(async (classId: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const students = await fetchStudentsByClass(classId);
      setState((s) => ({ ...s, students, loading: false }));
    } catch (e) {
      setState((s) => ({
        ...s,
        loading: false,
        error: (e as Error).message,
        students: [],
      }));
    }
  }, []);

  const loadPendingStudents = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const students = await fetchPendingTemplateStudents();
      setState((s) => ({ ...s, students, loading: false }));
    } catch (e) {
      setState((s) => ({
        ...s,
        loading: false,
        error: (e as Error).message,
        students: [],
      }));
    }
  }, []);

  const getStudentDetail = useCallback(async (id: string): Promise<Student | null> => {
    try {
      if (user?.role === 'photographer') {
        return await fetchPhotographerStudentDetail(id);
      }
      return await fetchStudentDetail(id);
    } catch {
      return null;
    }
  }, [user?.role]);

  const refreshDeliveryList = useCallback(async () => {
    try {
      const deliveryList = await fetchDeliveryList();
      setState((s) => ({ ...s, deliveryList }));
    } catch (e) {
      setState((s) => ({ ...s, deliveryList: [], error: (e as Error).message }));
    }
  }, []);

  const approveStudentPreview = useCallback(async (studentId: string) => {
    try {
      await approvePreview(studentId);
      await refreshDashboard();
    } catch (e) {
      setState((s) => ({ ...s, error: (e as Error).message }));
    }
  }, [refreshDashboard]);

  const rejectStudentPreview = useCallback(
    async (studentId: string, comment: string) => {
      try {
        await rejectPreview(studentId, comment);
        await refreshDashboard();
      } catch (e) {
        setState((s) => ({ ...s, error: (e as Error).message }));
      }
    },
    [refreshDashboard]
  );

  const raiseStudentCorrection = useCallback(
    async (studentId: string, reason: string) => {
      try {
        await raiseCorrection(studentId, reason);
        await refreshDashboard();
      } catch (e) {
        setState((s) => ({ ...s, error: (e as Error).message }));
      }
    },
    [refreshDashboard]
  );

  const markStudentsReceived = useCallback(
    async (studentIds: string[]) => {
      try {
        await markDeliveryReceived(studentIds);
        await Promise.all([refreshDeliveryList(), refreshDashboard()]);
      } catch (e) {
        setState((s) => ({ ...s, error: (e as Error).message }));
      }
    },
    [refreshDeliveryList, refreshDashboard]
  );

  const clearStudents = useCallback(() => {
    setState((s) => ({ ...s, students: [] }));
  }, []);

  const setError = useCallback((err: string | null) => {
    setState((s) => ({ ...s, error: err }));
  }, []);

  const value: StudentContextType = {
    ...state,
    refreshDashboard,
    refreshClasses,
    loadStudentsByClass,
    loadPendingStudents,
    getStudentDetail,
    refreshDeliveryList,
    approveStudentPreview,
    rejectStudentPreview,
    raiseStudentCorrection,
    markStudentsReceived,
    clearStudents,
    setError,
  };

  return (
    <StudentContext.Provider value={value}>{children}</StudentContext.Provider>
  );
}

export function useStudents() {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error('useStudents must be used within StudentProvider');
  return ctx;
}
