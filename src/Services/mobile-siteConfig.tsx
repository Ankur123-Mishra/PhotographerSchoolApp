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
    CORRECTIONS: 'api/school/corrections',
    PREVIEW: 'api/school/preview',
    /** PUT api/school/preview/:studentId/approve - mark delivered as received */
    PREVIEW_APPROVE: (studentId: string) => `api/school/preview/${studentId}/approve`,
    /** PUT api/school/deliveries/confirm-student - confirm student received. Body: { studentId } */
    CONFIRM_STUDENT: 'api/school/deliveries/confirm-student',
  }),

  /** Photographer API endpoints (Bearer token required) */
  PHOTOGRAPHER_ENDPOINTS: Object.freeze({
    DASHBOARD: 'api/photographer/dashboard',
    ASSIGNED_SCHOOLS: 'api/photographer/schools/assigned',
    CLASSES: 'api/photographer/classes',
    STUDENTS: 'api/photographer/students',
    TEMPLATES_STATUS: 'api/photographer/templates/status',
    PHOTOS_UPLOAD: 'api/school/photos/upload',
  }),
});
