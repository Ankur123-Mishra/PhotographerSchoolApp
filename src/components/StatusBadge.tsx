import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { StudentStatus } from '../types';
import { colors, radius, typography } from '../theme/colors';

function getStatusStyle(status: StudentStatus): { bg: string; text: string } {
  const map: Record<StudentStatus, { bg: string; text: string }> = {
    pending: colors.pending,
    photo_uploaded: colors.photo_uploaded,
    preview_sent: colors.preview_sent,
    correction_pending: colors.correction_pending,
    approved: colors.approved,
    printed: colors.printed,
    delivered: colors.delivered,
    received_by_school: colors.received_by_school,
  };
  return map[status] ?? colors.pending;
}

function getStatusLabel(status: StudentStatus): string {
  const labels: Record<StudentStatus, string> = {
    pending: 'Pending',
    photo_uploaded: 'Photo Uploaded',
    preview_sent: 'Preview Sent',
    correction_pending: 'Correction Pending',
    approved: 'Approved',
    printed: 'Printed',
    delivered: 'Delivered',
    received_by_school: 'Received',
  };
  return labels[status] ?? status;
}

interface StatusBadgeProps {
  status: StudentStatus;
  size?: 'small' | 'medium';
}

export default function StatusBadge({ status, size = 'medium' }: StatusBadgeProps) {
  const { bg, text } = getStatusStyle(status);
  const label = getStatusLabel(status);
  const isSmall = size === 'small';

  return (
    <View style={[styles.badge, { backgroundColor: bg }, isSmall && styles.badgeSmall]}>
      <Text style={[styles.label, { color: text }, isSmall && styles.labelSmall]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  label: {
    ...typography.caption,
  },
  labelSmall: {
    fontSize: 10,
    fontWeight: '600',
  },
});
