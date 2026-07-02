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
  Keyboard,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors, spacing, radius, typography } from '../theme/colors';
import type { ClassItem, Student, StudentUpdatePayload } from '../types';
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
  classId?: string;
  classOptions?: ClassItem[];
  onClassChange?: (classId: string) => void | Promise<void>;
  loadingFields?: boolean;
  onClose: () => void;
  onSubmit: (payload: StudentUpdatePayload) => Promise<void>;
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isRedundantClassField(key: string): boolean {
  const norm = normalizeKey(key);
  return norm === 'class' || norm === 'classname' || norm === 'standard' || norm === 'grade';
}

export default function StudentEditModal({
  visible,
  student,
  fieldKeys = [],
  classId = '',
  classOptions = [],
  onClassChange,
  loadingFields = false,
  onClose,
  onSubmit,
}: StudentEditModalProps) {
  const { width: screenWidth } = useWindowDimensions();
  const isCompact = screenWidth < 380;
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(classId);

  const editEntries = student ? getStudentFormFieldEntries(student) : [];
  const editFieldKeys = fieldKeys.length > 0 ? fieldKeys : editEntries.map(([key]) => key);

  useEffect(() => {
    if (!visible) return;
    setClassDropdownOpen(false);
    setSelectedClassId(classId || student?.classId || '');
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      setKeyboardVisible(false);
      return;
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible]);

  useEffect(() => {
    if (visible && student) {
      const baseForm = buildStudentEditForm(student);
      for (const key of fieldKeys) {
        if (!(key in baseForm)) baseForm[key] = '';
      }
      setForm(baseForm);
    }
  }, [visible, student, fieldKeys]);

  const visibleFieldKeys = editFieldKeys.filter((key) => !isRedundantClassField(key));

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
    const effectiveClassId = classOptions.length > 0 ? selectedClassId : (student.classId ?? '');
    if (classOptions.length > 0 && !effectiveClassId) {
      Alert.alert('Required', 'Please select a class.');
      return;
    }

    const filteredForm = Object.fromEntries(
      Object.entries(form).filter(([key]) => !isRedundantClassField(key)),
    );
    const payload = cardFormToUpdatePayload(filteredForm, studentToBasePayload(student));
    if (effectiveClassId && effectiveClassId !== student.classId) {
      payload.classId = effectiveClassId;
    }
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

  const selectedClassName =
    classOptions.find((item) => item.id === selectedClassId)?.name ??
    student?.className ??
    'Select class';
  const canSave =
    editFieldKeys.length > 0 &&
    !loading &&
    (classOptions.length === 0 || Boolean(selectedClassId));

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
            {classOptions.length > 0 ? (
              <View style={styles.field}>
                <Text style={styles.label}>Class</Text>
                <TouchableOpacity
                  style={styles.dropdownTrigger}
                  onPress={() => setClassDropdownOpen((prev) => !prev)}
                  disabled={loading || loadingFields}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.dropdownText, !selectedClassId && styles.placeholderText]}>
                    {selectedClassName}
                  </Text>
                  {loadingFields ? (
                    <ActivityIndicator color={colors.primary} size="small" />
                  ) : (
                    <Ionicons
                      name={classDropdownOpen ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={colors.textMuted}
                    />
                  )}
                </TouchableOpacity>
                {classDropdownOpen ? (
                  <View style={styles.dropdownList}>
                    {classOptions.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setSelectedClassId(item.id);
                          setClassDropdownOpen(false);
                          onClassChange?.(item.id);
                        }}
                        disabled={loading || loadingFields}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.dropdownItemText}>{item.name}</Text>
                        {selectedClassId === item.id ? (
                          <Ionicons name="checkmark" size={18} color={colors.primary} />
                        ) : null}
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
            {loadingFields ? (
              <View style={styles.fieldLoaderWrap}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.fieldLoaderText}>Loading form fields...</Text>
              </View>
            ) : visibleFieldKeys.length > 0 ? (
              visibleFieldKeys.map((key) => (
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
            ) : editFieldKeys.length === 0 ? (
              <Text style={styles.empty}>No card details available</Text>
            ) : null}
          </ScrollView>
          {!keyboardVisible ? (
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
          ) : null}
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
  dropdownTrigger: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  dropdownText: {
    ...typography.bodySmall,
    color: colors.text,
    flex: 1,
  },
  placeholderText: {
    color: colors.textMuted,
  },
  dropdownList: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  dropdownItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  dropdownItemText: {
    ...typography.bodySmall,
    color: colors.text,
    flex: 1,
  },
  fieldLoaderWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  fieldLoaderText: {
    ...typography.bodySmall,
    color: colors.textMuted,
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
