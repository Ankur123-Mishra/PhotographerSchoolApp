import React, { useEffect, useState } from 'react';
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
  useWindowDimensions,
} from 'react-native';
import { colors, spacing, radius, typography } from '../theme/colors';
import type { Student, StudentUpdatePayload } from '../types';
import {
  buildStudentEditForm,
  cardFormToUpdatePayload,
  formatCardLabel,
  getStudentFormFieldEntries,
  studentToBasePayload,
} from '../utils/cardFields';

interface StudentEditModalProps {
  visible: boolean;
  student: Student | null;
  fieldKeys?: string[];
  onClose: () => void;
  onSubmit: (payload: StudentUpdatePayload) => Promise<void>;
}

export default function StudentEditModal({
  visible,
  student,
  fieldKeys = [],
  onClose,
  onSubmit,
}: StudentEditModalProps) {
  const { width: screenWidth } = useWindowDimensions();
  const isCompact = screenWidth < 380;
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const editEntries = student ? getStudentFormFieldEntries(student) : [];
  const editFieldKeys = fieldKeys.length > 0 ? fieldKeys : editEntries.map(([key]) => key);

  useEffect(() => {
    if (visible && student) {
      const baseForm = buildStudentEditForm(student);
      for (const key of fieldKeys) {
        if (!(key in baseForm)) baseForm[key] = '';
      }
      setForm(baseForm);
    }
  }, [visible, student, fieldKeys]);

  const updateCardField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const isMobileField = (key: string) => {
    const field = key.toLowerCase();
    return field.includes('mobile') || field.includes('phone') || field.includes('contact');
  };

  const handleSubmit = async () => {
    if (!student) return;

    if (editFieldKeys.length === 0) {
      Alert.alert('No fields', 'No student details available to update.');
      return;
    }
    const payload = cardFormToUpdatePayload(form, studentToBasePayload(student));
    setLoading(true);
    try {
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

  const canSave = editFieldKeys.length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.box, isCompact && styles.boxCompact]}>
          <Text style={styles.title}>Edit Student</Text>
          <Text style={styles.subtitle}>Update ID card details</Text>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {editFieldKeys.length > 0 ? (
              editFieldKeys.map((key) => (
                <View key={key} style={styles.field}>
                  <Text style={styles.label}>{formatCardLabel(key)}</Text>
                  <TextInput
                    style={styles.input}
                    value={form[key] ?? ''}
                    onChangeText={(text) => updateCardField(key, text)}
                    placeholder={formatCardLabel(key)}
                    placeholderTextColor={colors.textMuted}
                    editable={!loading}
                    keyboardType={isMobileField(key) ? 'number-pad' : 'default'}
                  />
                </View>
              ))
            ) : (
              <Text style={styles.empty}>No card details available</Text>
            )}
          </ScrollView>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn, isCompact && styles.btnCompact]}
              onPress={handleClose}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={[styles.cancelText, isCompact && styles.btnTextCompact]} numberOfLines={1}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.submitBtn, isCompact && styles.btnCompact]}
              onPress={handleSubmit}
              disabled={loading || !canSave}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={colors.textInverse} size="small" />
              ) : (
                <Text style={[styles.submitText, isCompact && styles.btnTextCompact]} numberOfLines={1}>
                  Save
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
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
    width: '100%',
  },
  boxCompact: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
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
    minWidth: 0,
    minHeight: 48,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCompact: {
    minHeight: 44,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
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
    textAlign: 'center',
    lineHeight: 22,
  },
  submitText: {
    ...typography.bodyMedium,
    color: colors.textInverse,
    textAlign: 'center',
    lineHeight: 22,
  },
  btnTextCompact: {
    fontSize: 14,
    lineHeight: 20,
  },
});
