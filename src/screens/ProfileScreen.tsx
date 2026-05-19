import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { useSchoolProfile } from '../hooks/useSchoolProfile';
import { colors, spacing, radius, typography, shadow } from '../theme/colors';
import Loader from '../components/Loader';

type DetailRow = { icon: string; label: string; value: string };

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { effective, loading, refreshing, error, loadProfile } = useSchoolProfile();

  const onLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const rows: DetailRow[] = [];
  if (effective) {
    rows.push({ icon: 'school-outline', label: 'School', value: effective.name });
    if (effective.schoolCode) {
      rows.push({ icon: 'barcode-outline', label: 'School code', value: effective.schoolCode });
    }
    const contact = effective.contact ?? user?.mobile;
    if (contact) {
      rows.push({ icon: 'call-outline', label: 'Contact / Mobile', value: contact });
    }
    if (effective.email) {
      rows.push({ icon: 'mail-outline', label: 'Email', value: effective.email });
    }
  }

  if (loading && !refreshing) {
    return <Loader message="Loading profile..." />;
  }

  const displayTitle = effective?.name ?? 'School Account';
  const displaySub = 'ID Card Automation';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadProfile(true)}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="business" size={40} color={colors.primary} />
        </View>
        <Text style={styles.profileName}>{displayTitle}</Text>
        <Text style={styles.profileSub} numberOfLines={2}>
          {displaySub}
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>School details</Text>
        <View style={styles.card}>
          {rows.length === 0 ? (
            <Text style={styles.empty}>No school details available.</Text>
          ) : (
            rows.map((row, index) => (
              <View
                key={`${row.label}-${index}`}
                style={[styles.row, index > 0 ? styles.rowBorder : undefined]}
              >
                <Ionicons name={row.icon} size={22} color={colors.textMuted} />
                <View style={styles.rowText}>
                  <Text style={styles.label}>{row.label}</Text>
                  <Text style={styles.value}>{row.value}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.85}>
        <Ionicons name="log-out-outline" size={22} color={colors.textInverse} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl * 2,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadow.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  profileName: { ...typography.heading, color: colors.text, textAlign: 'center' },
  profileSub: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorText: { flex: 1, ...typography.bodySmall, color: colors.error },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.sm,
  },
  empty: { ...typography.bodyMedium, color: colors.textMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rowBorder: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowText: { flex: 1, marginLeft: spacing.md },
  label: { ...typography.label, color: colors.textMuted, marginBottom: spacing.xs },
  value: { ...typography.bodyMedium, color: colors.text },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.error,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  logoutText: { color: colors.textInverse, ...typography.bodyMedium },
});
