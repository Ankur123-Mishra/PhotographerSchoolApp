import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useStudents } from '../context/StudentContext';
import { useSchoolProfile } from '../hooks/useSchoolProfile';
import Loader from '../components/Loader';
import { colors, spacing, radius, typography, shadow } from '../theme/colors';

const workflowStats = [
  { key: 'photoUploaded', label: 'Photo Uploaded', icon: 'camera' as const, color: colors.info },
  { key: 'previewPending', label: 'Preview Pending', icon: 'eye' as const, color: colors.warning },
  { key: 'correctionPending', label: 'Correction Pending', icon: 'construct' as const, color: colors.error },
  { key: 'approved', label: 'Approved', icon: 'checkmark-circle' as const, color: colors.success },
] as const;

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const gridGap = spacing.md;
  const contentWidth = width - spacing.lg * 2;
  const cellWidth = Math.floor((contentWidth - gridGap) / 2);
  const navigation = useNavigation<any>();
  const {
    dashboardStats,
    loading,
    refreshDashboard,
    refreshClasses,
  } = useStudents();
  const { schoolName } = useSchoolProfile();

  useFocusEffect(
    useCallback(() => {
      refreshDashboard();
    }, [refreshDashboard])
  );

  const onClassList = () => navigation.navigate('ClassList');
  const onRefresh = useCallback(() => {
    refreshDashboard();
    refreshClasses();
  }, [refreshDashboard, refreshClasses]);

  if (loading && !dashboardStats) {
    return <Loader message="Loading dashboard..." />;
  }

  const stats = dashboardStats ?? {
    totalStudents: 0,
    photoUploaded: 0,
    previewPending: 0,
    correctionPending: 0,
    approved: 0,
    printed: 0,
    delivered: 0,
    receivedBySchool: 0,
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <Ionicons name="school" size={28} color={colors.primary} />
        </View>
        <View style={styles.heroText}>
          <Text style={styles.heroSchoolName} numberOfLines={2}>
            {schoolName ?? 'Your School'}
          </Text>
          <Text style={styles.heroSub}>Overview of ID card workflow</Text>
        </View>
      </View>

      <View style={styles.statsSection}>
        <View style={[styles.grid, { gap: gridGap }]}>
          {workflowStats.map(({ key, label, icon, color }) => (
            <View key={key} style={[styles.gridCard, { width: cellWidth }]}>
              <View style={[styles.iconWrap, { backgroundColor: `${color}18` }]}>
                <Ionicons name={icon} size={22} color={color} />
              </View>
              <Text style={styles.cardValue}>{stats[key] ?? 0}</Text>
              <Text style={styles.cardLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
      <TouchableOpacity style={styles.cta} onPress={onClassList} activeOpacity={0.85}>
        <Ionicons name="list" size={22} color={colors.textInverse} />
        <Text style={styles.ctaText}>View Class List</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.section },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    ...shadow.sm,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  heroText: { flex: 1 },
  heroSchoolName: {
    ...typography.titleSmall,
    color: colors.text,
    lineHeight: 26,
  },
  heroSub: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  statsSection: {
    gap: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadow.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardValue: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  cardLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  cta: {
    marginTop: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  ctaText: {
    color: colors.textInverse,
    ...typography.bodyMedium,
  },
});
