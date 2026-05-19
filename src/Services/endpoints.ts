const BASE = 'https://api.example.com'; // Replace with real API base URL

export const endpoints = {
  auth: {
    sendOtp: `${BASE}/auth/send-otp`,
    verifyOtp: `${BASE}/auth/verify-otp`,
    logout: `${BASE}/auth/logout`,
  },
  dashboard: {
    stats: `${BASE}/school/dashboard`,
  },
  classes: {
    list: `${BASE}/school/classes`,
  },
  students: {
    list: (classId: string) => `${BASE}/school/classes/${classId}/students`,
    detail: (id: string) => `${BASE}/school/students/${id}`,
  },
  preview: {
    approve: (id: string) => `${BASE}/school/students/${id}/approve`,
    reject: (id: string) => `${BASE}/school/students/${id}/reject`,
  },
  correction: {
    list: `${BASE}/school/corrections`,
    raise: (id: string) => `${BASE}/school/students/${id}/correction`,
  },
  delivery: {
    list: `${BASE}/school/delivery`,
    markReceived: `${BASE}/school/delivery/received`,
  },
  reports: {
    studentList: `${BASE}/school/reports/students`,
    approvedList: `${BASE}/school/reports/approved`,
    deliveryReport: `${BASE}/school/reports/delivery`,
  },
  profile: {
    school: `${BASE}/school/profile`,
  },
};
