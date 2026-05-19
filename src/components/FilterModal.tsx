import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Pressable,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type { StudentStatus } from '../types';
import { colors, spacing, radius, typography } from '../theme/colors';

const FILTER_OPTIONS: { value: StudentStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'photo_uploaded', label: 'Photo Uploaded' },
  { value: 'preview_sent', label: 'Preview Sent' },
  { value: 'correction_pending', label: 'Correction Pending' },
  { value: 'approved', label: 'Approved' },
];

interface FilterModalProps {
  visible: boolean;
  selected: StudentStatus | 'all';
  onSelect: (value: StudentStatus | 'all') => void;
  onClose: () => void;
}

export default function FilterModal({
  visible,
  selected,
  onSelect,
  onClose,
}: FilterModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Filter by status</Text>
            <TouchableOpacity onPress={onClose} style={styles.doneBtn}>
              <Text style={styles.doneText}>Done</Text>
              <Ionicons name="checkmark" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={FILTER_OPTIONS}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.option, selected === item.value && styles.optionSelected]}
                onPress={() => onSelect(item.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionText, selected === item.value && styles.optionTextSelected]}>
                  {item.label}
                </Text>
                {selected === item.value ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                ) : null}
              </TouchableOpacity>
            )}
          />
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '70%',
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  doneText: {
    ...typography.bodyMedium,
    color: colors.primary,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  optionSelected: {
    backgroundColor: colors.primaryLight,
  },
  optionText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
});
