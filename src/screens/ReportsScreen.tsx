import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { downloadReport } from '../Services/api';
import { colors, spacing, radius, typography, shadow } from '../theme/colors';

const reports = [
  { key: 'students' as const, label: 'Student List', icon: 'people' as const },
  { key: 'approved' as const, label: 'Approved List', icon: 'checkmark-done' as const },
  { key: 'delivery' as const, label: 'Delivery Report', icon: 'cube' as const },
];

export default function ReportsScreen() {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const onDownload = async (key: 'students' | 'approved' | 'delivery') => {
    setLoadingKey(key);
    try {
      const result = await downloadReport(key);
      Alert.alert('Success', result);
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <Ionicons name="document-text" size={24} color={colors.primary} />
        <View>
          <Text style={styles.header}>Reports</Text>
          <Text style={styles.subheader}>Tap to download</Text>
        </View>
      </View>
      {reports.map(({ key, label, icon }) => (
        <TouchableOpacity
          key={key}
          style={styles.card}
          onPress={() => onDownload(key)}
          disabled={loadingKey !== null}
          activeOpacity={0.85}
        >
          <View style={styles.cardLeft}>
            <View style={styles.iconWrap}>
              <Ionicons name={icon} size={22} color={colors.primary} />
            </View>
            <Text style={styles.cardLabel}>{label}</Text>
          </View>
          {loadingKey === key ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <View style={styles.downloadWrap}>
              <Ionicons name="download" size={20} color={colors.primary} />
              <Text style={styles.downloadText}>Download</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.section },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
  },
  header: { ...typography.heading, color: colors.text },
  subheader: { ...typography.bodySmall, color: colors.textMuted, marginTop: spacing.xs },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardLabel: { ...typography.bodyMedium, color: colors.text },
  downloadWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  downloadText: { ...typography.bodySmall, fontWeight: '600', color: colors.primary },
});
