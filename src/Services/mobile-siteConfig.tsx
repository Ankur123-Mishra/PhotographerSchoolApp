export const mobile_siteConfig = Object.freeze({
  SHOW_INTRO: 'show_intro',
  IS_LOGIN: 'is_login',
  MOB_ACCESS_TOKEN_KEY: 'token',
  FCM_TOKEN: 'fcm_token',

  // BASE_URL: 'http://45.194.116.147/print-api/',
  // BASE_URL: 'https://slect.in/print-api/',
  // BASE_URL: 'http://72.61.240.84:5050',
  BASE_URL: 'http://72.61.240.84:5050/',

  /** Public API endpoints (no auth) */
  API_ENDPOINTS: Object.freeze({
    GENERATE_OTP: 'api/public/generate-otp',
    VERIFY_OTP: 'api/public/verify-otp',
  }),

  /** School API endpoints (Bearer token required) */
  SCHOOL_ENDPOINTS: Object.freeze({
    CLASSES: 'api/school/classes',
    DASHBOARD: 'api/school/dashboard',
    /** GET api/school/profile — school account details (Bearer). */
    PROFILE: 'api/school/profile',
    STUDENTS: 'api/school/students',
    /** GET api/school/students/global-search?search= — school-wide student search (Bearer). */
    STUDENTS_GLOBAL_SEARCH: 'api/school/students/global-search',
    CORRECTIONS: 'api/school/corrections',
    PREVIEW: 'api/school/preview',
    /** PUT api/school/preview/:studentId/approve - mark delivered as received */
    PREVIEW_APPROVE: (studentId: string) => `api/school/preview/${studentId}/approve`,
    /** PUT api/school/deliveries/confirm-student - confirm student received. Body: { studentId } */
    CONFIRM_STUDENT: 'api/school/deliveries/confirm-student',
    /** POST api/school/photos/upload — student photo upload (Bearer). */
    PHOTOS_UPLOAD: 'api/school/photos/upload',
  }),

  /** Photographer API endpoints (Bearer token required) */
  PHOTOGRAPHER_ENDPOINTS: Object.freeze({
    ME: 'api/photographer/me',
    DASHBOARD: 'api/photographer/dashboard',
    ASSIGNED_SCHOOLS: 'api/photographer/schools/assigned',
    CLASSES: 'api/photographer/classes',
    STUDENTS: 'api/photographer/students',
    /** GET api/photographer/students/:studentId — student detail (Bearer). */
    STUDENT_DETAIL: (studentId: string) => `api/photographer/students/${studentId}`,
    /** GET api/photographer/preview/:studentId — ID card preview (Bearer). */
    PREVIEW: (studentId: string) => `api/photographer/preview/${studentId}`,
    TEMPLATES_STATUS: 'api/photographer/templates/status',
    PHOTOS_UPLOAD: 'api/photographer/photos/upload',
  }),
});
