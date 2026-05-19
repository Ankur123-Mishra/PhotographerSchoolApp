import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, radius, typography } from '../theme/colors';

type ApprovalModalVariant = 'approve' | 'reject' | 'delivery';

interface ApprovalModalProps {
  visible: boolean;
  variant: ApprovalModalVariant;
  title: string;
  message: string;
  comment?: string;
  onCommentChange?: (text: string) => void;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export default function ApprovalModal({
  visible,
  variant,
  title,
  message,
  comment = '',
  onCommentChange,
  loading = false,
  onConfirm,
  onCancel,
  confirmLabel,
  cancelLabel = 'Cancel',
}: ApprovalModalProps) {
  const defaultConfirm =
    variant === 'approve'
      ? 'Approve'
      : variant === 'reject'
        ? 'Reject'
        : 'Confirm';
  const label = confirmLabel ?? defaultConfirm;
  const isDestructive = variant === 'reject';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          {variant === 'reject' && (
            <TextInput
              style={styles.input}
              placeholder="Reason for rejection (required)"
              placeholderTextColor={colors.textMuted}
              value={comment}
              onChangeText={onCommentChange}
              multiline
              numberOfLines={3}
              editable={!loading}
            />
          )}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn]}
              onPress={onCancel}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.btn,
                isDestructive ? styles.destructiveBtn : styles.confirmBtn,
              ]}
              onPress={onConfirm}
              disabled={loading || (variant === 'reject' && !comment.trim())}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={colors.textInverse} size="small" />
              ) : (
                <Text style={styles.confirmText}>{label}</Text>
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
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  box: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xxl,
  },
  title: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  message: {
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
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
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
  confirmBtn: {
    backgroundColor: colors.primary,
  },
  destructiveBtn: {
    backgroundColor: colors.error,
  },
  cancelText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  confirmText: {
    ...typography.bodyMedium,
    color: colors.textInverse,
  },
});
