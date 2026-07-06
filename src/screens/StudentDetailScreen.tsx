import React, { useCallback, useState, useEffect, useLayoutEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
  useWindowDimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useStudents } from '../context/StudentContext';
// import StatusBadge from '../components/StatusBadge';
import CorrectionModal from '../components/CorrectionModal';
import PhotoCaptureModal from '../components/PhotoCaptureModal';
import StudentEditModal from '../components/StudentEditModal';
import Loader from '../components/Loader';
import type { MainStackParamList, PhotographerStackParamList } from '../navigation/types';
import type { Student, StudentUpdatePayload } from '../types';
import { colors, spacing, radius, typography, shadow } from '../theme/colors';
import { PutDataWithToken, uploadPhoto, uploadStudentPhoto } from '../Services/mobile-api';
import { mobile_siteConfig } from '../Services/mobile-siteConfig';
import {
  resolveAddStudentFieldKeys,
  updateStudent,
  updatePhotographerStudent,
  fetchStudentsByClass,
} from '../Services/api';
import { formatCardLabel, getCardFieldEntries, getStudentDisplayName } from '../utils/cardFields';
import { sortClassItems } from '../utils/classSort';
import Images from '../assets/image';

type Nav = NativeStackNavigationProp<MainStackParamList & PhotographerStackParamList, 'StudentDetail'>;
type DetailRoute = RouteProp<MainStackParamList & PhotographerStackParamList, 'StudentDetail'>;

function getCardFieldIcon(key: string): string {
  const k = key.toLowerCase();
  if (k.includes('class') || k.includes('section')) return 'school-outline';
  if (k.includes('phone') || k.includes('mobile') || k.includes('contact')) return 'call-outline';
  if (k.includes('address') || k.includes('location')) return 'location-outline';
  if (k.includes('dob') || k.includes('birth') || k.includes('date')) return 'calendar-outline';
  if (k.includes('name')) return 'person-outline';
  if (k.includes('admission') || k.includes('roll')) return 'document-text-outline';
  if (k.includes('school')) return 'business-outline';
  return 'information-circle-outline';
}

export default function StudentDetailScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const isCompact = screenWidth < 380;
  const { params } = useRoute<DetailRoute>();
  const { studentId } = params;
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const isSchoolLogin = user?.role !== 'photographer';
  const { getStudentDetail, raiseStudentCorrection, setError, classes, refreshClasses } = useStudents();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [correctionVisible, setCorrectionVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [editFieldKeys, setEditFieldKeys] = useState<string[]>([]);
  const [editClassId, setEditClassId] = useState('');
  const [editFieldsLoading, setEditFieldsLoading] = useState(false);
  const sortedClasses = useMemo(() => sortClassItems(classes), [classes]);
  const [photoError, setPhotoError] = useState(false);
  const [markingReceived, setMarkingReceived] = useState(false);
  /** Local file URI after capture; cleared after successful server upload */
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setPhotoError(false);
    const s = await getStudentDetail(studentId);
    console.log('=== s === ', s);
    setStudent(s);
    setLoading(false);
  }, [studentId, getStudentDetail]);

  useEffect(() => {
    load();
  }, [load]);

  const onSaveStudent = useCallback(
    async (payload: StudentUpdatePayload) => {
      try {
        if (isSchoolLogin) {
          await updateStudent(studentId, payload);
        } else {
          await updatePhotographerStudent(studentId, payload);
        }
        setError(null);
        await load();
        Alert.alert('Success', 'Student updated successfully.');
      } catch (err: unknown) {
        const message =
          err && typeof err === 'object' && 'message' in err
            ? String((err as { message: unknown }).message)
            : 'Failed to update student';
        throw new Error(message);
      }
    },
    [studentId, load, setError, isSchoolLogin],
  );

  const onClassChangeForEdit = useCallback(async (classId: string) => {
    if (editFieldsLoading || !classId) return;
    setEditClassId(classId);
    setEditFieldsLoading(true);
    try {
      const classStudents = await fetchStudentsByClass(classId);
      const keys = await resolveAddStudentFieldKeys(classStudents);
      setEditFieldKeys(keys);
    } catch (e) {
      Alert.alert('Error', (e as Error).message || 'Could not load form fields');
    } finally {
      setEditFieldsLoading(false);
    }
  }, [editFieldsLoading]);

  useLayoutEffect(() => {
    if (!student) {
      navigation.setOptions({ headerRight: undefined });
      return;
    }
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={async () => {
            if (!student) return;
            if (sortedClasses.length === 0) {
              await refreshClasses();
            }
            setEditClassId(student.classId);
            setEditFieldKeys([]);
            resolveAddStudentFieldKeys([student])
              .then((keys) => setEditFieldKeys(keys))
              .catch(() => setEditFieldKeys([]))
              .finally(() => setEditVisible(true));
          }}
          style={styles.headerEditButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.headerEditButtonText} numberOfLines={1}>
            Edit
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, student, sortedClasses.length, refreshClasses]);

  const onRaiseCorrection = async (reason: string) => {
    await raiseStudentCorrection(studentId, reason);
    setError(null);
    await load();
  };

  const onViewPreview = () => {
    navigation.navigate('Preview', { studentId: student?.id ?? studentId });
  };

  const onMarkReceived = async () => {
    if (!studentId || markingReceived) return;
    setMarkingReceived(true);
    try {
      const urlPath = mobile_siteConfig.SCHOOL_ENDPOINTS.CONFIRM_STUDENT;
      await PutDataWithToken({ studentId }, urlPath);
      await load();
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : 'Failed to mark as received';
      Alert.alert('Error', message);
    } finally {
      setMarkingReceived(false);
    }
  };

  const onShareWhatsapp = useCallback(async () => {
    if (!student) return;
    const phoneRaw = student.mobile?.trim();
    const uniqueCode = student.uniqueCode?.trim();

    if (!phoneRaw) {
      Alert.alert('Missing mobile', 'Student mobile/WhatsApp number is not available.');
      return;
    }

    if (!uniqueCode) {
      Alert.alert('Missing unique code', 'Student unique code is not available.');
      return;
    }

    const phone = phoneRaw.replace(/\D/g, '');
    if (!phone) {
      Alert.alert('Invalid mobile', 'Student mobile/WhatsApp number is invalid.');
      return;
    }

    const previewUrl = `http://72.61.240.84:8080/p/${uniqueCode}`;
    const message = `Please verify the ID card details for ${student.name}: ${previewUrl} If anything is wrong, submit correction on that page.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappAppUrl = `whatsapp://send?phone=${phone}&text=${encodedMessage}`;
    const whatsappWebUrl = `https://wa.me/${phone}?text=${encodedMessage}`;

    try {
      const canOpenWhatsApp = await Linking.canOpenURL(whatsappAppUrl);
      const targetUrl = canOpenWhatsApp ? whatsappAppUrl : whatsappWebUrl;
      await Linking.openURL(targetUrl);
    } catch {
      Alert.alert('Unable to open WhatsApp', 'Please check WhatsApp availability on this device.');
    }
  }, [student]);

  const onPhotoCapture = useCallback((photoUri: string) => {
    setPhotoError(false);
    setPendingPhotoUri(photoUri);
  }, []);

  const onPickFromGallery = useCallback(async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.9,
        selectionLimit: 1,
      });

      if (result.didCancel) return;

      if (result.errorCode) {
        Alert.alert('Error', result.errorMessage || 'Failed to pick image from gallery.');
        return;
      }

      const uri = result.assets?.[0]?.uri;
      if (uri) {
        onPhotoCapture(uri);
      } else {
        Alert.alert('Error', 'No image selected.');
      }
    } catch {
      Alert.alert('Error', 'Failed to open gallery. Please try again.');
    }
  }, [onPhotoCapture]);

  const onUploadPendingPhoto = useCallback(async () => {
    if (!pendingPhotoUri || uploadingPhoto) return;
    setUploadingPhoto(true);
    try {
      if (isSchoolLogin) {
        await uploadPhoto(pendingPhotoUri, studentId);
      } else {
        await uploadStudentPhoto(studentId, pendingPhotoUri);
      }
      setPendingPhotoUri(null);
      await load();
      Alert.alert('Success', 'Photo uploaded successfully.');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Photo upload failed';
      Alert.alert('Upload failed', message);
    } finally {
      setUploadingPhoto(false);
    }
  }, [pendingPhotoUri, studentId, load, uploadingPhoto, isSchoolLogin]);

  const canRaiseCorrection = student && !['correction_pending', 'pending'].includes(student.status);
  const canViewPreview =
    student &&
    (isSchoolLogin
      ? ['preview_sent', 'approved', 'printed', 'delivered', 'received_by_school'].includes(student.status)
      : true);
  const canMarkReceived = student && student.status === 'delivered';

  if (loading && !student) {
    return <Loader message="Loading..." />;
  }

  if (!student) {
    return (
      <View style={styles.centered}>
        <Ionicons name="person-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyText}>Student not found</Text>
      </View>
    );
  }

  const displayPhotoUri = pendingPhotoUri || student.photoUri;
  const cardFields = getCardFieldEntries(student.card);
  const displayName = getStudentDisplayName(student);

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, isCompact && styles.contentCompact]}>
      <View style={styles.photoContainer}>
        <Image
          source={displayPhotoUri && !photoError ? { uri: displayPhotoUri } : Images.ABSENT}
          style={[styles.photo, { height: Math.min(220, screenWidth * 0.55) }]}
          resizeMode="contain"
          onError={() => setPhotoError(true)}
        />
        <TouchableOpacity
          style={[styles.uploadBtn, styles.uploadBtnLeft]}
          onPress={onPickFromGallery}
          activeOpacity={0.8}
        >
          <Ionicons name="images" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={() => setCameraVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="camera" size={24} color="white" />
        </TouchableOpacity>
      </View>
      {pendingPhotoUri ? (
        <TouchableOpacity
          style={[styles.uploadPhotoBtn, uploadingPhoto && styles.btnDisabled]}
          onPress={onUploadPendingPhoto}
          disabled={uploadingPhoto}
          activeOpacity={0.85}
        >
          {uploadingPhoto ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Ionicons name="cloud-upload-outline" size={22} color={colors.textInverse} />
          )}
          <Text style={[styles.uploadPhotoBtnText, isCompact && styles.textCompact]} numberOfLines={2}>
            {uploadingPhoto ? 'Uploading...' : 'Upload photo'}
          </Text>
        </TouchableOpacity>
      ) : null}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={[styles.name, isCompact && styles.nameCompact]} numberOfLines={3}>
            {displayName}
          </Text>
          {/* <View style={styles.badgeWrap}>
            <StatusBadge status={student.status} size={isCompact ? 'small' : 'medium'} />
          </View> */}
        </View>
        {cardFields.length > 0 ? (
          cardFields
            .filter(([key]) => key.toLowerCase() !== 'name')
            .map(([key, value]) => (
              <View key={key} style={styles.metaRow}>
                <Ionicons
                  name={getCardFieldIcon(key)}
                  size={18}
                  color={colors.textMuted}
                />
                <Text style={[styles.meta, isCompact && styles.textCompact]}>
                  {formatCardLabel(key)}: {String(value)}
                </Text>
              </View>
            ))
        ) : (
          <Text style={styles.metaEmpty}>No card details available</Text>
        )}
      </View>
      {student.correctionReason ? (
        <View style={styles.card}>
          <Text style={styles.label}>Correction reason</Text>
          <Text style={[styles.reason, isCompact && styles.textCompact]}>{student.correctionReason}</Text>
        </View>
      ) : null}
      <View style={styles.actions}>
        {canMarkReceived && (
          <TouchableOpacity
            style={[styles.btn, isCompact && styles.btnCompact, markingReceived && styles.btnDisabled]}
            onPress={onMarkReceived}
            disabled={markingReceived}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-done" size={isCompact ? 18 : 20} color={colors.textInverse} />
            <Text style={[styles.btnText, isCompact && styles.btnTextCompact]} numberOfLines={2}>
              {markingReceived ? 'Marking...' : 'Received'}
            </Text>
          </TouchableOpacity>
        )}
        {canViewPreview && (
          <TouchableOpacity style={[styles.btn, isCompact && styles.btnCompact]} onPress={onViewPreview} activeOpacity={0.85}>
            <Ionicons name="eye" size={isCompact ? 18 : 20} color={colors.textInverse} />
            <Text style={[styles.btnText, isCompact && styles.btnTextCompact]} numberOfLines={2}>
              View Preview
            </Text>
          </TouchableOpacity>
        )}

        {/* {canRaiseCorrection && (
          <TouchableOpacity
            style={[styles.btn, styles.btnSecondary]}
            onPress={() => setCorrectionVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="construct" size={20} color={colors.textSecondary} />
            <Text style={styles.btnTextSecondary}>Raise Correction</Text>
          </TouchableOpacity>
        )} */}

        {isSchoolLogin && (
          <TouchableOpacity
            style={[styles.btn, isCompact && styles.btnCompact]}
            onPress={onShareWhatsapp}
            activeOpacity={0.85}
          >
            <Ionicons name="share-social" size={isCompact ? 18 : 20} color={colors.textInverse} />
            <Text style={[styles.btnText, isCompact && styles.btnTextCompact]} numberOfLines={2}>
              Share on WhatsApp
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <CorrectionModal
        visible={correctionVisible}
        studentName={student.name}
        onClose={() => setCorrectionVisible(false)}
        onSubmit={onRaiseCorrection}
      />

      <StudentEditModal
        visible={editVisible}
        student={student}
        fieldKeys={editFieldKeys}
        classId={editClassId}
        classOptions={sortedClasses}
        onClassChange={onClassChangeForEdit}
        loadingFields={editFieldsLoading}
        onClose={() => setEditVisible(false)}
        onSubmit={onSaveStudent}
      />

      <PhotoCaptureModal
        visible={cameraVisible}
        onClose={() => setCameraVisible(false)}
        onPhotoCapture={onPhotoCapture}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.section, flexGrow: 1 },
  contentCompact: { padding: spacing.md },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  emptyText: { ...typography.body, color: colors.textMuted, marginTop: spacing.md },
  photoContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: spacing.lg,
  },
  photo: {
    width: '100%',
    height: 220,
    borderRadius: radius.lg,
    backgroundColor: colors.borderLight,
  },
  uploadBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.sm,
  },
  uploadBtnLeft: {
    left: 12,
    right: undefined,
  },
  uploadPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  uploadPhotoBtnText: { color: colors.textInverse, ...typography.bodyMedium },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  name: {
    ...typography.titleSmall,
    color: colors.text,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  nameCompact: { fontSize: 18 },
  badgeWrap: { flexShrink: 0, maxWidth: '45%' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  meta: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  textCompact: { fontSize: 13, lineHeight: 18 },
  metaEmpty: { ...typography.bodySmall, color: colors.textMuted },
  label: { ...typography.label, color: colors.textMuted, marginBottom: spacing.sm },
  reason: { ...typography.bodySmall, color: colors.textSecondary },
  actions: { marginTop: spacing.lg, gap: spacing.md },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
  },
  btnCompact: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  btnSecondary: { backgroundColor: colors.borderLight },
  btnDisabled: { opacity: 0.7 },
  btnText: {
    color: colors.textInverse,
    ...typography.bodyMedium,
    flexShrink: 1,
    textAlign: 'center',
    lineHeight: 22,
  },
  btnTextCompact: { fontSize: 14, lineHeight: 20 },
  btnTextSecondary: { color: colors.textSecondary, ...typography.bodyMedium },
  headerEditButton: {
    marginRight: spacing.sm,
    minWidth: 52,
    minHeight: 32,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerEditButtonText: {
    color: colors.textInverse,
    ...typography.bodySmall,
    fontWeight: '600',
    lineHeight: 18,
    textAlign: 'center',
  },
});
