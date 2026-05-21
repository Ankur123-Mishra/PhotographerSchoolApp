import React, { useCallback, useState, useEffect, useLayoutEffect } from 'react';
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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStudents } from '../context/StudentContext';
import StatusBadge from '../components/StatusBadge';
import CorrectionModal from '../components/CorrectionModal';
import PhotoCaptureModal from '../components/PhotoCaptureModal';
import CropFrameSelectModal from '../components/CropFrameSelectModal';
import type { CropFrameType } from '../types/cropFrame';
import { cropImageToFrame } from '../utils/cropImageToFrame';
import StudentEditModal from '../components/StudentEditModal';
import Loader from '../components/Loader';
import type { MainStackParamList } from '../navigation/types';
import type { Student, StudentUpdatePayload } from '../types';
import { colors, spacing, radius, typography, shadow } from '../theme/colors';
import { PutDataWithToken, uploadPhoto } from '../Services/mobile-api';
import { mobile_siteConfig } from '../Services/mobile-siteConfig';
import { updateStudent } from '../Services/api';
import { formatCardLabel, getCardFieldEntries, getStudentDisplayName } from '../utils/cardFields';

type Nav = NativeStackNavigationProp<MainStackParamList, 'StudentDetail'>;
type DetailRoute = RouteProp<MainStackParamList, 'StudentDetail'>;

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
  const { params } = useRoute<DetailRoute>();
  const { studentId } = params;
  const navigation = useNavigation<Nav>();
  const { getStudentDetail, raiseStudentCorrection, setError } = useStudents();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [correctionVisible, setCorrectionVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [frameSelectVisible, setFrameSelectVisible] = useState(false);
  const [selectedCropFrame, setSelectedCropFrame] = useState<CropFrameType | null>(null);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const [markingReceived, setMarkingReceived] = useState(false);
  /** Local file URI after capture; cleared after successful server upload */
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setPhotoError(false);
    const s = await getStudentDetail(studentId);
    setStudent(s);
    setLoading(false);
  }, [studentId, getStudentDetail]);

  useEffect(() => {
    load();
  }, [load]);

  const onSaveStudent = useCallback(
    async (payload: StudentUpdatePayload) => {
      try {
        await updateStudent(studentId, payload);
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
    [studentId, load, setError],
  );

  useLayoutEffect(() => {
    if (!student) {
      navigation.setOptions({ headerRight: undefined });
      return;
    }
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setEditVisible(true)}
          style={{ marginRight: spacing.sm }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="create-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, student]);

  const onRaiseCorrection = async (reason: string) => {
    await raiseStudentCorrection(studentId, reason);
    setError(null);
    await load();
  };

  const onViewPreview = () => {
    navigation.navigate('Preview', { studentId });
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
    setSelectedCropFrame(null);
    setCameraVisible(false);
  }, []);

  const onPickFromGallery = useCallback(
    async (frameType: CropFrameType) => {
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
        if (!uri) {
          Alert.alert('Error', 'No image selected.');
          return;
        }

        const croppedUri = await cropImageToFrame(uri, frameType);
        onPhotoCapture(croppedUri);
      } catch {
        Alert.alert('Error', 'Failed to process gallery image. Please try again.');
      }
    },
    [onPhotoCapture],
  );

  const onFrameSelected = useCallback(
    (frameType: CropFrameType) => {
      setSelectedCropFrame(frameType);
      setFrameSelectVisible(false);
      Alert.alert(
        'Add Photo',
        'Capture or upload a photo using the selected frame',
        [
          { text: 'Camera', onPress: () => setCameraVisible(true) },
          { text: 'Gallery', onPress: () => onPickFromGallery(frameType) },
          { text: 'Cancel', style: 'cancel', onPress: () => setSelectedCropFrame(null) },
        ],
      );
    },
    [onPickFromGallery],
  );

  const onPhotoSourcePress = useCallback(() => {
    setFrameSelectVisible(true);
  }, []);

  const onUploadPendingPhoto = useCallback(async () => {
    if (!pendingPhotoUri || uploadingPhoto) return;
    setUploadingPhoto(true);
    try {
      await uploadPhoto(pendingPhotoUri, studentId);
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
  }, [pendingPhotoUri, studentId, load, uploadingPhoto]);

  const canRaiseCorrection = student && !['correction_pending', 'pending'].includes(student.status);
  const canViewPreview = student && ['preview_sent', 'approved', 'printed', 'delivered', 'received_by_school'].includes(student.status);
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.photoContainer}>
        {displayPhotoUri && !photoError ? (
          <Image
            source={{ uri: displayPhotoUri }}
            style={styles.photo}
            resizeMode="contain"
            onError={() => setPhotoError(true)}
          />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="person" size={56} color={colors.textMuted} />
            <Text style={styles.photoPlaceholderText}>
              {displayPhotoUri && photoError ? 'Photo failed to load' : 'No photo'}
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={onPhotoSourcePress}
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
          <Text style={styles.uploadPhotoBtnText}>
            {uploadingPhoto ? 'Uploading...' : 'Upload photo'}
          </Text>
        </TouchableOpacity>
      ) : null}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.name}>{displayName}</Text>
          <StatusBadge status={student.status} />
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
                <Text style={styles.meta}>
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
          <Text style={styles.reason}>{student.correctionReason}</Text>
        </View>
      ) : null}
      <View style={styles.actions}>
        {canMarkReceived && (
          <TouchableOpacity
            style={[styles.btn, markingReceived && styles.btnDisabled]}
            onPress={onMarkReceived}
            disabled={markingReceived}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-done" size={20} color={colors.textInverse} />
            <Text style={styles.btnText}>{markingReceived ? 'Marking...' : 'Received'}</Text>
          </TouchableOpacity>
        )}
        {canViewPreview && (
          <TouchableOpacity style={styles.btn} onPress={onViewPreview} activeOpacity={0.85}>
            <Ionicons name="eye" size={20} color={colors.textInverse} />
            <Text style={styles.btnText}>View Preview</Text>
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

        <TouchableOpacity
          style={styles.btn}
          onPress={onShareWhatsapp}
          activeOpacity={0.85}
        >
          <Ionicons name="share-social" size={20} color={colors.textInverse} />
          <Text style={styles.btnText}>Share on WhatsApp</Text>
        </TouchableOpacity>
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
        onClose={() => setEditVisible(false)}
        onSubmit={onSaveStudent}
      />

      <CropFrameSelectModal
        visible={frameSelectVisible}
        subtitle={`Choose a crop frame for ${displayName}'s photo.`}
        onClose={() => setFrameSelectVisible(false)}
        onSelect={onFrameSelected}
      />

      {selectedCropFrame ? (
        <PhotoCaptureModal
          visible={cameraVisible}
          cropFrame={selectedCropFrame}
          onClose={() => {
            setCameraVisible(false);
            if (!pendingPhotoUri) setSelectedCropFrame(null);
          }}
          onPhotoCapture={onPhotoCapture}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.section },
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
  photoPlaceholder: {
    width: '100%',
    height: 220,
    borderRadius: radius.lg,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: { ...typography.bodySmall, color: colors.textMuted, marginTop: spacing.sm },
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  name: { ...typography.titleSmall, color: colors.text },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  meta: { ...typography.bodySmall, color: colors.textSecondary, flex: 1 },
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
    padding: spacing.lg,
  },
  btnSecondary: { backgroundColor: colors.borderLight },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: colors.textInverse, ...typography.bodyMedium },
  btnTextSecondary: { color: colors.textSecondary, ...typography.bodyMedium },
});
