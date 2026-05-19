import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useStudents } from '../context/StudentContext';
import ApprovalModal from '../components/ApprovalModal';
import type { Student } from '../types';
import { colors, spacing, radius, typography, shadow } from '../theme/colors';

export default function DeliveryScreen() {
  const { deliveryList, loading, refreshDeliveryList, markStudentsReceived } = useStudents();
  const [confirmModal, setConfirmModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshDeliveryList();
    }, [refreshDeliveryList])
  );

  const onMarkReceived = (student: Student) => {
    setSelectedIds([student.id]);
    setConfirmModal(true);
  };

  const onConfirmReceived = async () => {
    setActionLoading(true);
    try {
      await markStudentsReceived(selectedIds);
      setConfirmModal(false);
      setSelectedIds([]);
      Alert.alert('Success', 'Marked as received by school.');
      refreshDeliveryList();
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const delivered = deliveryList.filter((s) => s.status === 'delivered' || s.status === 'printed');

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Ionicons name="cube" size={24} color={colors.primary} />
        <View>
          <Text style={styles.header}>Delivery</Text>
          <Text style={styles.subheader}>Mark ID cards as received by school</Text>
        </View>
      </View>
      <FlatList
        data={delivered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshDeliveryList} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cube-outline" size={44} color={colors.textMuted} />
            <Text style={styles.emptyText}>No delivery records to confirm</Text>
          </View>
        }
        renderItem={({ item }: { item: Student }) => (
          <View style={styles.card}>
            <View style={styles.cardLeft}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={22} color={colors.primary} />
              </View>
              <View style={styles.cardTextWrap}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.meta} numberOfLines={1}>Class {item.className} • Roll No {item.rollNo}</Text>
              </View>
            </View>
            <View style={styles.receivedBtnWrap}>
              <TouchableOpacity
                style={styles.receivedBtn}
                onPress={() => onMarkReceived(item)}
                activeOpacity={0.85}
              >
         <Ionicons name="checkmark" size={18} color={colors.textInverse} />
              <Text style={styles.receivedBtnText}>Received</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <ApprovalModal
        visible={confirmModal}
        variant="delivery"
        title="Confirm delivery"
        message="Are you sure the ID cards have been received by the school?"
        loading={actionLoading}
        onConfirm={onConfirmReceived}
        onCancel={() => { setConfirmModal(false); setSelectedIds([]); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
  },
  header: { ...typography.heading, color: colors.text },
  subheader: { ...typography.bodySmall, color: colors.textMuted, marginTop: spacing.xs },
  list: { padding: spacing.lg, paddingBottom: spacing.section },
  empty: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: { ...typography.bodySmall, color: colors.textMuted, marginTop: spacing.md },
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
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: spacing.md,
  },
  cardTextWrap: { flex: 1, minWidth: 0 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  name: { ...typography.bodyMedium, color: colors.text },
  meta: { ...typography.bodySmall, color: colors.textMuted, marginTop: spacing.xs },
  receivedBtnWrap: {
    flexShrink: 0,
  },
  receivedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    minWidth: 85,
    maxWidth: 100,
  },
  receivedBtnText: { color: colors.textInverse, ...typography.bodySmall, fontWeight: '600' },
});
