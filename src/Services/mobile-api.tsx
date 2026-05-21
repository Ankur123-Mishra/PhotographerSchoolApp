// import AsyncStorage from '@react-native-async-storage/async-storage';
import { mobile_siteConfig } from './mobile-siteConfig';
import { getDataFromAsyncStorage } from './CommonFunction';
import axios from 'axios';

export async function postData(data, urlPath) {
  return new Promise((resolve, reject) => {
    axios
      .post(`${mobile_siteConfig.BASE_URL}${urlPath}`, data, {
        headers: {
          Accept: '*/*',
          'Content-Type': 'application/json',
        },
      })
      .then(response => {
        if (response.data) {
          resolve(response.data);
        } else {
          resolve(response);
        }
      })
      .catch(error => {
        // if (error.response) {
        //   // Server responded with a status outside 2xx
        //   console.error('Response Error:', {
        //     status: error.response.status,
        //     data: error.response.data,
        //     headers: error.response.headers,
        //   });}
        console.log(`=== ERROR === ${urlPath}`, error);
        reject(error);
      });
  });
}

export async function postDataWithToken(data, urlPath) {
  try {
    const token = await getDataFromAsyncStorage(
      mobile_siteConfig.MOB_ACCESS_TOKEN_KEY,
    );
    console.log('=== postDataWithToken === ', token);
    const url = `${mobile_siteConfig.BASE_URL}${urlPath}`;
    console.log('=== POST', url);
    const response = await axios.post(url, data, {
      headers: {
        Accept: '*/*',
        'Content-Type': 'application/json',
        Origin: 'localhost',
        Authorization: `Bearer ${token}`,
      },
    });
    // console.log("sadfghj0", JSON.stringify(response.data))

    return response.data; // Return the data from the response
  } catch (error) {
    console.log(`=== ERROR === ${mobile_siteConfig.BASE_URL + urlPath}`, error);
    throw error;
  }
}

export async function deleteDataWithToken(urlPath) {
  try {
    const token = await getDataFromAsyncStorage(
      mobile_siteConfig.MOB_ACCESS_TOKEN_KEY,
    );

    const url = `${mobile_siteConfig.BASE_URL}${urlPath}`;
    console.log('=== delete', url);

    const response = await axios.delete(url, {
      headers: {
        Accept: '*/*',
        'Content-Type': 'application/json',
        Origin: 'localhost',
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.log(`=== ERROR === ${mobile_siteConfig.BASE_URL + urlPath}`, error);
    throw error;
  }
}

export async function getDataWithToken(data, urlPath) {
  console.log(
    '=== getDataWithToken URL ===',
    mobile_siteConfig.BASE_URL + urlPath,
  );
  try {
    const token = await getDataFromAsyncStorage(
      mobile_siteConfig.MOB_ACCESS_TOKEN_KEY,
    );
    console.log('token:::::::::7123', token);

    const response = await axios.get(mobile_siteConfig.BASE_URL + urlPath, {
      headers: {
        'Content-Type': 'application/json',
        Origin: 'localhost',
        Authorization: `Bearer ${token}`,
      },
    });

    return response;
  } catch (error) {
    console.error('Failed to fetch data', error);
    throw error; // Optionally re-throw the error to handle it at a higher level
  }
}

export async function PutDataWithToken(data, urlPath) {
  try {
    console.log(
      '=== PutDataWithToken URL ===',
      mobile_siteConfig.BASE_URL + urlPath,
    );

    const token = await getDataFromAsyncStorage(
      mobile_siteConfig.MOB_ACCESS_TOKEN_KEY,
    );

    const headers = {
      Accept: '*/*',
      Authorization: `Bearer ${token}`,
    };

    const hasBody = data !== undefined && data !== null;
    if (hasBody) {
      if (data instanceof FormData) {
        headers['Content-Type'] = 'multipart/form-data';
      } else {
        headers['Content-Type'] = 'application/json';
      }
    }

    const response = await axios.put(
      mobile_siteConfig.BASE_URL + urlPath,
      hasBody ? data : undefined,
      { headers },
    );

    console.log('=== vv RESPONSE ===', response.data);
    return response.data;
  } catch (error) {
    const axiosErr = error as { response?: { status?: number; data?: unknown } };
    console.error('=== ERROR ===', error);
    if (axiosErr.response?.data) {
      console.error('=== ERROR BODY ===', axiosErr.response.data);
    }
    throw error;
  }
}

export async function PatchDataWithToken(data, urlPath) {
  try {
    console.log(
      '=== PatchDataWithToken URL ===',
      mobile_siteConfig.BASE_URL + urlPath,
    );
    console.log('=== PatchDataWithToken REQUEST ===', data);

    const token = await getDataFromAsyncStorage(
      mobile_siteConfig.MOB_ACCESS_TOKEN_KEY,
    );

    // Prepare headers
    const headers = {
      Accept: '*/*',
      Authorization: `Bearer ${token}`,
    };

    // Conditionally set Content-Type for FormData
    if (data instanceof FormData) {
      headers['Content-Type'] = 'multipart/form-data';
    }

    const response = await axios.patch(
      mobile_siteConfig.BASE_URL + urlPath,
      data,
      { headers },
    );

    console.log('=== PatchDataWithToken RESPONSE ===', response.data);
    return response.data;
  } catch (error) {
    console.error('=== PatchDataWithToken ERROR ===', error);
    throw error;
  }
}

export const deleteDataWithTokenNew = async (data, url) => {
  try {
    const token = await getDataFromAsyncStorage(
      mobile_siteConfig.MOB_ACCESS_TOKEN_KEY,
    );
    const response = await axios.delete(mobile_siteConfig.BASE_URL + url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      data,
    });
    return response;
  } catch (error) {
    // ... error handling
  }
};



/** Generate OTP – POST api/public/generate-otp (no token). Body: { mobile, role: 'photographer' } */
export async function generateOtp(mobile: string) {
  const data = { mobile: mobile.replace(/\D/g, ''), role: 'school' };
  console.log('=== generateOtp === ', data);
  return postData(data, mobile_siteConfig.API_ENDPOINTS.GENERATE_OTP);
}

/** Verify OTP / Login – POST api/public/verify-otp (no token). Body: { mobile, otp, role: 'school' }. Returns { message, token, user }. */
export async function verifyOtp(mobile: string, otp: string) {
  const data = {
    mobile: mobile.replace(/\D/g, ''),
    otp,
    role: 'school',
  };
  return postData(data, mobile_siteConfig.API_ENDPOINTS.VERIFY_OTP);
}

/** School classes – GET api/school/classes with Bearer token. Returns { classes: [{ _id, className, section }] }. */
export async function getSchoolClasses() {
  const response = await getDataWithToken(null, mobile_siteConfig.SCHOOL_ENDPOINTS.CLASSES);
  const data = response?.data ?? response;
  return data;
}

/** School dashboard – GET api/school/dashboard with Bearer token. Returns { totalStudents, photoUploaded, previewPending, correctionPending, approved, printed, delivered, received }. */
export async function getSchoolDashboard() {
  const response = await getDataWithToken(null, mobile_siteConfig.SCHOOL_ENDPOINTS.DASHBOARD);
  const data = response?.data ?? response;
  return data;
}

/** School profile – GET api/school/profile with Bearer token. Shape may be `{ school }`, `{ data: { school } }`, or school fields at root. */
export async function getSchoolProfile() {
  const response = await getDataWithToken(null, mobile_siteConfig.SCHOOL_ENDPOINTS.PROFILE);
  const data = response?.data ?? response;
  return data;
}

/** School students – GET api/school/students with Bearer token. Returns { students: [{ _id, schoolId, classId: { _id, className, section }, rollNo, studentName, status, ... }] }. */
export async function getSchoolStudents() {
  const response = await getDataWithToken(null, mobile_siteConfig.SCHOOL_ENDPOINTS.STUDENTS);
  const data = response?.data ?? response;
  return data;
}

/** School-wide student search – GET api/school/students/global-search?search= with Bearer token. */
export async function getSchoolStudentsGlobalSearch(search: string) {
  const q = encodeURIComponent(search.trim());
  const path = `${mobile_siteConfig.SCHOOL_ENDPOINTS.STUDENTS_GLOBAL_SEARCH}?search=${q}`;
  const response = await getDataWithToken(null, path);
  const data = response?.data ?? response;
  return data;
}

/** School student detail – GET api/school/students/:studentId with Bearer token. Returns { student: { _id, schoolId: { _id, schoolName }, classId: { _id, className, section }, rollNo, studentName, status, ... } }. */
export async function getSchoolStudentDetail(studentId: string) {
  const path = `${mobile_siteConfig.SCHOOL_ENDPOINTS.STUDENTS}/${studentId}`;
  const response = await getDataWithToken(null, path);
  const data = response?.data ?? response;
  return data;
}

function appendImageFile(formData: FormData, fieldName: string, uri: string) {
  const filename = uri.split('/').pop() || 'photo.jpg';
  const mime = filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
  formData.append(fieldName, {
    uri,
    type: mime,
    name: filename,
  } as unknown as Blob);
}

/** POST multipart/form-data with Bearer token (React Native FormData). */
export async function postFormDataWithToken(formData: FormData, urlPath: string) {
  const token = await getDataFromAsyncStorage(
    mobile_siteConfig.MOB_ACCESS_TOKEN_KEY,
  );
  const url = `${mobile_siteConfig.BASE_URL}${urlPath}`;
  console.log('=== postFormDataWithToken ===', url);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: '*/*',
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    let errMessage = text || `Request failed (${response.status})`;
    try {
      const json = JSON.parse(text);
      if (json.message) errMessage = json.message;
    } catch (_) {}
    const err = new Error(errMessage) as Error & { response?: { data?: { message?: string } } };
    err.response = { data: { message: errMessage } };
    throw err;
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

/** School student create – POST api/school/students multipart/form-data with Bearer token. */
export async function createSchoolStudent(body: {
  classId: string;
  studentName: string;
  admissionNo: string;
  rollNo: string;
  fatherName: string;
  motherName: string;
  dob: string;
  mobile: string;
  address: string;
  gender: string;
  bloodGroup: string;
  house: string;
  photoNo: string;
  extraFields?: Record<string, string>;
  photoUri?: string;
  housePhotoUri?: string;
}) {
  const formData = new FormData();
  formData.append('classId', body.classId);
  formData.append('studentName', body.studentName);
  formData.append('admissionNo', body.admissionNo);
  formData.append('rollNo', body.rollNo);
  formData.append('fatherName', body.fatherName);
  formData.append('motherName', body.motherName);
  formData.append('dob', body.dob);
  formData.append('mobile', body.mobile);
  formData.append('gender', body.gender);
  formData.append('bloodGroup', body.bloodGroup);
  formData.append('house', body.house);
  formData.append('photoNo', body.photoNo);
  formData.append('address', body.address);

  for (const [key, value] of Object.entries(body.extraFields ?? {})) {
    if (value.trim()) formData.append(key, value.trim());
  }

  if (body.photoUri) appendImageFile(formData, 'photo', body.photoUri);
  if (body.housePhotoUri) appendImageFile(formData, 'housePhoto', body.housePhotoUri);

  return postFormDataWithToken(formData, mobile_siteConfig.SCHOOL_ENDPOINTS.STUDENTS);
}

/** School student update – PUT api/school/students/:studentId with Bearer token. */
export async function updateSchoolStudent(
  studentId: string,
  body: Record<string, unknown>,
) {
  const path = `${mobile_siteConfig.SCHOOL_ENDPOINTS.STUDENTS}/${studentId}`;
  return PutDataWithToken(body, path);
}

/** School student request correction – PUT api/school/students/:studentId/request-correction with Bearer token. Body: { comment }. */
export async function requestSchoolCorrection(studentId: string, comment: string) {
  const path = `${mobile_siteConfig.SCHOOL_ENDPOINTS.STUDENTS}/${studentId}/request-correction`;
  return PutDataWithToken({ comment }, path);
}

/** School corrections list – GET api/school/corrections with Bearer token. Returns { corrections: [{ _id, studentId: { _id, admissionNo, rollNo, studentName }, comment, status, ... }] }. */
export async function getSchoolCorrections() {
  const response = await getDataWithToken(null, mobile_siteConfig.SCHOOL_ENDPOINTS.CORRECTIONS);
  const data = response?.data ?? response;
  return data;
}

/** Resolve correction – PUT api/school/corrections/:correctionId/resolve. Body: { status: "resolved" }; optional note if backend supports it. */
export async function resolveSchoolCorrection(correctionId: string, note?: string) {
  const path = `${mobile_siteConfig.SCHOOL_ENDPOINTS.CORRECTIONS}/${correctionId}/resolve`;
  const body: Record<string, string> = { status: 'resolved' };
  if (note?.trim()) body.note = note.trim();
  return PutDataWithToken(body, path);
}

/** Reject correction – same route as resolve; body uses status rejected (many backends only expose …/resolve). */
export async function rejectSchoolCorrection(correctionId: string, note?: string) {
  const path = `${mobile_siteConfig.SCHOOL_ENDPOINTS.CORRECTIONS}/${correctionId}/resolve`;
  const body: Record<string, string> = { status: 'rejected' };
  if (note?.trim()) body.note = note.trim();
  return PutDataWithToken(body, path);
}

/** School preview approve – PUT api/school/preview/:studentId/approve with Bearer token. No body. */
export async function approveSchoolPreview(studentId: string) {
  const path = `${mobile_siteConfig.SCHOOL_ENDPOINTS.PREVIEW}/${studentId}/approve`;
  return PutDataWithToken({}, path);
}

/** School preview reject – PUT api/school/preview/:studentId/reject with Bearer token. Body: { comment }. */
export async function rejectSchoolPreview(studentId: string, comment: string) {
  const path = `${mobile_siteConfig.SCHOOL_ENDPOINTS.PREVIEW}/${studentId}/reject`;
  return PutDataWithToken({ comment }, path);
}

/** School preview card – GET api/school/preview/:studentId with Bearer token. Returns { preview: { templateId, ... }, student: { _id, studentName, photoUrl, classId, schoolId, ... } }. */
export async function getSchoolPreview(studentId: string) {
  const path = `${mobile_siteConfig.SCHOOL_ENDPOINTS.PREVIEW}/${studentId}`;
  console.log("getSchoolPreview path", path);
  const response = await getDataWithToken(null, path);
  const data = response?.data ?? response;
  return data;
}

/** Dashboard – GET api/photographer/dashboard with Bearer token. Returns { assignedSchools, totalStudents, photoPending, photoUploaded, correctionRequired, deliveryPending }. */
export async function getDashboard() {
  const response = await getDataWithToken(null, mobile_siteConfig.PHOTOGRAPHER_ENDPOINTS.DASHBOARD);
  return response?.data ?? response;
}

/** Assigned schools – GET api/photographer/schools/assigned with Bearer token. Returns { schools: [{ _id, schoolName, schoolCode, address }] }. */
export async function getAssignedSchools() {
  const response = await getDataWithToken(null, mobile_siteConfig.PHOTOGRAPHER_ENDPOINTS.ASSIGNED_SCHOOLS);
  return response?.data ?? response;
}

/** Classes by school – GET api/photographer/classes/:schoolId with Bearer token. Returns { classes: [{ _id, className, section }] }. */
export async function getClassesBySchool(schoolId: string) {
  const path = `${mobile_siteConfig.PHOTOGRAPHER_ENDPOINTS.CLASSES}/${schoolId}`;
  const response = await getDataWithToken(null, path);
  const data = response?.data ?? response;
  return data;
}

/** Students by school and class – GET api/photographer/students?schoolId=xxx&classId=xxx with Bearer token. Returns { students: [...] }. */
export async function getStudents(schoolId: string, classId: string) {
  const path = `${mobile_siteConfig.PHOTOGRAPHER_ENDPOINTS.STUDENTS}?schoolId=${encodeURIComponent(schoolId)}&classId=${encodeURIComponent(classId)}`;
  const response = await getDataWithToken(null, path);
  return response?.data ?? response;
}

/** Template status by school and class – GET api/photographer/templates/status?schoolId=xxx&classId=xxx. Returns { students, total, withTemplates, withoutTemplates, summary }. */
export async function getTemplatesStatus(schoolId: string, classId: string) {
  const path = `${mobile_siteConfig.PHOTOGRAPHER_ENDPOINTS.TEMPLATES_STATUS}?schoolId=${encodeURIComponent(schoolId)}&classId=${encodeURIComponent(classId)}`;
  const response = await getDataWithToken(null, path);
  return response?.data ?? response;
}

/** Photo upload – POST api/photographer/photos/upload multipart/form-data: photo (file), studentId. Bearer token. Optional deviceInfo if backend expects it. */
export async function uploadPhoto(
  photoUri: string,
  studentId: string,
  deviceInfo?: string,
) {
  const token = await getDataFromAsyncStorage(
    mobile_siteConfig.MOB_ACCESS_TOKEN_KEY,
  );
  const url = `${mobile_siteConfig.BASE_URL}${mobile_siteConfig.PHOTOGRAPHER_ENDPOINTS.PHOTOS_UPLOAD}`;
  const formData = new FormData();
  const rawName = photoUri.split('/').pop() || '';
  const isPng = rawName.toLowerCase().endsWith('.png') || photoUri.toLowerCase().includes('.png');
  const filename = isPng ? (rawName.toLowerCase().endsWith('.png') ? rawName : 'photo.png') : (rawName || 'photo.jpg');
  const mime = isPng ? 'image/png' : 'image/jpeg';
  formData.append('photo', {
    uri: photoUri,
    type: mime,
    name: filename,
  } as unknown as Blob);
  formData.append('studentId', studentId);
  if (deviceInfo) {
    formData.append('deviceInfo', deviceInfo);
  }
  console.log('=== uploadPhoto formData ===', formData);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: '*/*',
      Authorization: `Bearer ${token}`,
    },
    body: formData,
    signal: controller.signal,
  });
  console.log('=== uploadPhoto response ===', response);
  clearTimeout(timeoutId);

  if (!response.ok) {
    const text = await response.text();
    let errMessage = text || `Upload failed (${response.status})`;
    try {
      const json = JSON.parse(text);
      if (json.message) errMessage = json.message;
    } catch (_) {}
    throw new Error(errMessage);
  }
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

