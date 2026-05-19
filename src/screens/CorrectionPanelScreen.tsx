import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useStudents } from '../context/StudentContext';
import {
  fetchCorrectionList,
  resolveCorrection,
  rejectCorrection,
} from '../Services/api';
import Loader from '../components/Loader';
import type { CorrectionItem } from '../types';
import { showAlert, MessageType } from '../Services/Alerts';
import { colors, spacing, radius, typography, shadow } from '../theme/colors';

function formatTimestamp(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function apiErrorMessage(err: unknown): string {
  const anyErr = err as {
    message?: string;
    response?: { data?: { message?: string } };
  };
  const serverMsg = anyErr?.response?.data?.message;
  if (typeof serverMsg === 'string' && serverMsg.trim()) return serverMsg;
  if (typeof anyErr?.message === 'string' && anyErr.message.trim()) return anyErr.message;
  return 'Request failed';
}

export default function CorrectionPanelScreen() {
  const { refreshDashboard } = useStudents();
  const [items, setItems] = useState<CorrectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [acting, setActing] = useState<{ id: string; kind: 'resolve' | 'reject' } | null>(
    null,
  );

  const load = useCallback(async () => {
    const list = await fetchCorrectionList();
    console.log(' correction list', list);
    setItems(list);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setLoading(true);
        try {
          await load();
        } catch {
          if (!cancelled) {
            setItems([]);
            showAlert('Could not load corrections', undefined, MessageType.ERROR);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } catch {
      showAlert('Refresh failed', undefined, MessageType.ERROR);
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const handleResolve = async (item: CorrectionItem) => {
    const note = notes[item.id];
    setActing({ id: item.id, kind: 'resolve' });
    try {
      await resolveCorrection(item.id, note);
      showAlert('Correction resolved', undefined, MessageType.SUCCESS);
      await load();
      await refreshDashboard();
      setNotes((n) => {
        const next = { ...n };
        delete next[item.id];
        return next;
      });
    } catch (e) {
      showAlert(apiErrorMessage(e), undefined, MessageType.ERROR);
    } finally {
      setActing(null);
    }
  };

  const handleReject = async (item: CorrectionItem) => {
    const note = notes[item.id];
    setActing({ id: item.id, kind: 'reject' });
    try {
      await rejectCorrection(item.id, note);
      showAlert('Correction rejected', undefined, MessageType.SUCCESS);
      await load();
      await refreshDashboard();
      setNotes((n) => {
        const next = { ...n };
        delete next[item.id];
        return next;
      });
    } catch (e) {
      showAlert(apiErrorMessage(e), undefined, MessageType.ERROR);
    } finally {
      setActing(null);
    }
  };

  if (loading && items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Loader message="Loading corrections..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.pageHeader}>
            <View style={styles.titleRow}>
              <View style={styles.titleBlock}>
                <Text style={styles.screenTitle}>Corrections</Text>
                <Text style={styles.screenSubtitle}>
                  Pending correction requests from school/parents.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.refreshBtn}
                onPress={onRefresh}
                disabled={refreshing}
                activeOpacity={0.7}
              >
                <Text style={styles.refreshBtnText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="checkmark-done" size={48} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyText}>No correction pending</Text>
            <Text style={styles.emptySub}>All corrections are resolved.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const busy = acting?.id === item.id;
          const admissionLabel =
            item.admissionNo != null && item.admissionNo !== ''
              ? `Adm: SR.No. - ${item.admissionNo}`
              : 'Adm: —';
          const metaParts = [
            admissionLabel,
            item.rollNo != null && item.rollNo !== '' ? `Roll: ${item.rollNo}` : null,
            formatTimestamp(item.createdAt),
          ].filter(Boolean);

          return (
            <View style={styles.card}>
              <Text style={styles.studentName}>{item.studentName || '—'}</Text>
              <Text style={styles.meta}>{metaParts.join(' • ')}</Text>

              <View style={styles.changesSection}>
                <Text style={styles.labelMuted}>Requested changes</Text>
                {item.changes.length === 0 ? (
                  <Text style={styles.noChanges}>No field details</Text>
                ) : (
                  item.changes.map((ch, idx) => (
                    <View key={`${ch.field}_${idx}`} style={styles.changeRow}>
                      <View style={styles.fieldPill}>
                        <Text style={styles.fieldPillText}>{ch.field}</Text>
                      </View>
                      <View style={styles.changeValues}>
                        <Text style={styles.valueLine}>
                          <Text style={styles.valueLabel}>Old: </Text>
                          {ch.oldValue ?? '—'}
                        </Text>
                        <Text style={styles.valueLine}>
                          <Text style={styles.valueLabel}>New: </Text>
                          {ch.newValue ?? '—'}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
              {item.comment ? (
                <View style={styles.commentSection}>
                  <Text style={styles.labelMuted}>Comment</Text>
                  <Text style={styles.commentText}>{item.comment}</Text>
                </View>
              ) : null}

              <Text style={styles.labelMuted}>Note (optional)</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="Optional note"
                placeholderTextColor={colors.textMuted}
                multiline
                value={notes[item.id] ?? ''}
                onChangeText={(t) => setNotes((n) => ({ ...n, [item.id]: t }))}
              />

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.btnResolve, busy && acting?.kind === 'resolve' && styles.btnDisabled]}
                  onPress={() => handleResolve(item)}
                  disabled={!!busy}
                  activeOpacity={0.85}
                >
                  {busy && acting?.kind === 'resolve' ? (
                    <ActivityIndicator color={colors.textInverse} size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={22} color={colors.textInverse} />
                      <Text style={styles.btnResolveText}>Apply & Resolve</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnReject, busy && acting?.kind === 'reject' && styles.btnDisabled]}
                  onPress={() => handleReject(item)}
                  disabled={!!busy}
                  activeOpacity={0.85}
                >
                  {busy && acting?.kind === 'reject' ? (
                    <ActivityIndicator color={colors.textInverse} size="small" />
                  ) : (
                    <>
                      <Ionicons name="close-circle" size={22} color={colors.textInverse} />
                      <Text style={styles.btnRejectText}>Reject</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  listContent: { paddingBottom: spacing.section },
  pageHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  titleBlock: { flex: 1 },
  screenTitle: { ...typography.titleSmall, color: colors.text },
  screenSubtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  refreshBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  refreshBtnText: { ...typography.bodySmall, fontWeight: '600', color: colors.text },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.xxl,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyText: { ...typography.heading, color: colors.textSecondary, marginBottom: spacing.sm },
  emptySub: { ...typography.bodySmall, color: colors.textMuted, textAlign: 'center' },
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  studentName: {
    ...typography.bodyMedium,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'uppercase',
  },
  meta: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  labelMuted: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs },
  changesSection: { marginBottom: spacing.md },
  noChanges: { ...typography.bodySmall, color: colors.textSecondary, fontStyle: 'italic' },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  fieldPill: {
    backgroundColor: colors.borderLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    minWidth: 100,
  },
  fieldPillText: { ...typography.caption, color: colors.textSecondary },
  changeValues: {
    flex: 1,
    gap: spacing.xs,
  },
  valueLine: {
    ...typography.body,
    color: colors.text,
  },
  valueLabel: { ...typography.bodySmall, color: colors.textMuted, fontWeight: '400' },
  commentSection: { marginBottom: spacing.md },
  commentText: { ...typography.bodySmall, color: colors.textSecondary },
  noteInput: {
    ...typography.bodySmall,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 88,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  btnResolve: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.info,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    flexGrow: 1,
    justifyContent: 'center',
  },
  btnResolveText: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textInverse,
  },
  btnReject: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.error,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    flexGrow: 1,
    justifyContent: 'center',
  },
  btnRejectText: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textInverse,
  },
  btnDisabled: { opacity: 0.7 },
});
