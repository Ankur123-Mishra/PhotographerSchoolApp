import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { colors, spacing, radius, typography } from '../theme/colors';
import {
  buildEmptyAddStudentForm,
  cardFormToCreatePayload,
  formatCardLabel,
} from '../utils/cardFields';
import type { StudentCreatePayload } from '../types';

interface StudentAddModalProps {
  visible: boolean;
  fieldKeys: string[];
  classId: string;
  onClose: () => void;
  onSubmit: (payload: StudentCreatePayload) => Promise<void>;
}

export default function StudentAddModal({
  visible,
  fieldKeys,
  classId,
  onClose,
  onSubmit,
}: StudentAddModalProps) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && fieldKeys.length > 0) {
      setForm(buildEmptyAddStudentForm(fieldKeys));
      setPhotoUri(null);
    }
  }, [visible, fieldKeys]);

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

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
      if (uri) setPhotoUri(uri);
      else Alert.alert('Error', 'No image selected.');
    } catch {
      Alert.alert('Error', 'Failed to open gallery. Please try again.');
    }
  }, []);

  const onTakePhoto = useCallback(async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.9,
        saveToPhotos: false,
      });
      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert('Error', result.errorMessage || 'Failed to take photo.');
        return;
      }
      const uri = result.assets?.[0]?.uri;
      if (uri) setPhotoUri(uri);
      else Alert.alert('Error', 'No photo captured.');
    } catch {
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  }, []);

  const onPhotoSourcePress = useCallback(() => {
    Alert.alert('Student Photo', 'Choose how you want to add the student photo', [
      { text: 'Camera', onPress: onTakePhoto },
      { text: 'Gallery', onPress: onPickFromGallery },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [onPickFromGallery, onTakePhoto]);

  const handleSubmit = async () => {
    const name =
      (form.name ?? form.studentName ?? '').trim() ||
      Object.entries(form).find(([k]) => normalizeKey(k) === 'name')?.[1]?.trim() ||
      '';

    if (!name) {
      Alert.alert('Required', 'Student name is required.');
      return;
    }

    setLoading(true);
    try {
      const payload = cardFormToCreatePayload(form, classId);
      if (photoUri) payload.photoUri = photoUri;
      await onSubmit(payload);
      onClose();
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) onClose();
  };

  const canSave = fieldKeys.length > 0 && !loading;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.box}>
          <Text style={styles.title}>Add Student</Text>
          <Text style={styles.subtitle}>Enter ID card details</Text>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.field}>
              <Text style={styles.label}>Student Photo</Text>
              {photoUri ? (
                <View style={styles.photoPreviewWrap}>
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.removePhotoBtn}
                    onPress={() => setPhotoUri(null)}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="close-circle" size={22} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ) : null}
              <TouchableOpacity
                style={styles.photoBtn}
                onPress={onPhotoSourcePress}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Ionicons name="camera-outline" size={20} color={colors.primary} />
                <Text style={styles.photoBtnText}>
                  {photoUri ? 'Change photo' : 'Upload student photo'}
                </Text>
              </TouchableOpacity>
            </View>
            {fieldKeys.length > 0 ? (
              fieldKeys.map((key) => (
                <View key={key} style={styles.field}>
                  <Text style={styles.label}>{formatCardLabel(key)}</Text>
                  <TextInput
                    style={styles.input}
                    value={form[key] ?? ''}
                    onChangeText={(text) => updateField(key, text)}
                    placeholder={formatCardLabel(key)}
                    placeholderTextColor={colors.textMuted}
                    editable={!loading}
                  />
                </View>
              ))
            ) : (
              <Text style={styles.empty}>No form fields available</Text>
            )}
          </ScrollView>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn]}
              onPress={handleClose}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.submitBtn]}
              onPress={handleSubmit}
              disabled={!canSave}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={colors.textInverse} size="small" />
              ) : (
                <Text style={styles.submitText}>Add</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  box: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.section,
    maxHeight: '92%',
  },
  title: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  scroll: { maxHeight: '72%' },
  scrollContent: { paddingBottom: spacing.md },
  field: { marginBottom: spacing.md },
  label: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.borderLight,
  },
  photoPreviewWrap: {
    position: 'relative',
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  photoPreview: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    backgroundColor: colors.borderLight,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.borderLight,
  },
  photoBtnText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  empty: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  btn: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: colors.borderLight,
  },
  submitBtn: {
    backgroundColor: colors.primary,
  },
  cancelText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  submitText: {
    ...typography.bodyMedium,
    color: colors.textInverse,
  },
});
