import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, spacing, radius, typography } from '../theme/colors';

interface CorrectionModalProps {
  visible: boolean;
  studentName: string;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

export default function CorrectionModal({
  visible,
  studentName,
  onClose,
  onSubmit,
}: CorrectionModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const r = reason.trim();
    if (!r) {
      Alert.alert('Required', 'Please enter correction reason.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit(r);
      setReason('');
      onClose();
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setReason('');
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>Raise Correction</Text>
          <Text style={styles.subtitle}>Student: {studentName}</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter correction reason (required)"
            placeholderTextColor={colors.textMuted}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={4}
            editable={!loading}
          />
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
              disabled={loading || !reason.trim()}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={colors.textInverse} size="small" />
              ) : (
                <Text style={styles.submitText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    padding: spacing.xxl,
    paddingBottom: spacing.section,
  },
  title: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: spacing.xl,
    backgroundColor: colors.borderLight,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
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
