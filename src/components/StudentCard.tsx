import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import StatusBadge from './StatusBadge';
import type { StudentStatus } from '../types';
import { colors, spacing, radius, typography, shadow } from '../theme/colors';

interface StudentCardProps {
  studentName: string;
  className: string;
  rollNo: string;
  status: StudentStatus;
  onPress: () => void;
}

function StudentCard({ studentName, className, rollNo, status, onPress }: StudentCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.left}>
        <Text style={styles.name} numberOfLines={1}>
          {studentName}
        </Text>
        <Text style={styles.meta}>
          Class {className} • Roll No {rollNo}
        </Text>
        <StatusBadge status={status} size="small" />
      </View>
      <View style={styles.arrowWrap}>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

export default memo(StudentCard);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    ...shadow.sm,
  },
  left: {
    flex: 1,
  },
  name: {
    ...typography.bodyMedium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  meta: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  arrowWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
});
