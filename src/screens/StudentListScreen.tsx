import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
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
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStudents } from '../context/StudentContext';
import StudentCard from '../components/StudentCard';
import SearchBar from '../components/SearchBar';
import FilterModal from '../components/FilterModal';
import StudentAddModal from '../components/StudentAddModal';
import Loader from '../components/Loader';
import type { MainStackParamList } from '../navigation/types';
import type { Student, StudentStatus, StudentCreatePayload } from '../types';
import { createStudent, resolveAddStudentFieldKeys } from '../Services/api';
import { colors, spacing, radius, typography } from '../theme/colors';

type Nav = NativeStackNavigationProp<MainStackParamList, 'StudentList'>;
type StudentListRoute = RouteProp<MainStackParamList, 'StudentList'>;

export default function StudentListScreen() {
  const { params } = useRoute<StudentListRoute>();
  const classId = params?.classId ?? '';
  const className = params?.className ?? '';
  const listMode = params?.listMode ?? 'class';
  const isPendingMode = listMode === 'pending';
  const navigation = useNavigation<Nav>();
  const {
    students,
    loading,
    loadStudentsByClass,
    loadPendingStudents,
    refreshDashboard,
  } = useStudents();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<StudentStatus | 'all'>('all');
  const [filterVisible, setFilterVisible] = useState(false);
  const [addVisible, setAddVisible] = useState(false);
  const [addFieldKeys, setAddFieldKeys] = useState<string[]>([]);
  const [addFieldsLoading, setAddFieldsLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (isPendingMode) {
        loadPendingStudents();
        return;
      }
      if (classId) {
        loadStudentsByClass(classId);
      }
    }, [classId, isPendingMode, loadPendingStudents, loadStudentsByClass])
  );

  const filtered = useMemo(() => {
    let list = [...students];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((s) =>
        [
          s.name,
          s.mobile,
          s.photoNo,
          s.rollNo,
          s.admissionNo,
        ].some((value) => (value ?? '').toString().toLowerCase().includes(q))
      );
    }
    if (filterStatus !== 'all') {
      list = list.filter((s) => s.status === filterStatus);
    }
    return list;
  }, [students, searchQuery, filterStatus]);

  const onRefresh = useCallback(() => {
    if (isPendingMode) {
      loadPendingStudents();
    } else if (classId) {
      loadStudentsByClass(classId);
    }
    refreshDashboard();
  }, [classId, isPendingMode, loadPendingStudents, loadStudentsByClass, refreshDashboard]);

  const onStudentPress = (student: Student) => {
    navigation.navigate('StudentDetail', { studentId: student.id });
  };

  const onOpenAddStudent = useCallback(async () => {
    if (addFieldsLoading) return;
    setAddFieldsLoading(true);
    try {
      const keys = await resolveAddStudentFieldKeys(students);
      setAddFieldKeys(keys);
      setAddVisible(true);
    } catch (e) {
      Alert.alert('Error', (e as Error).message || 'Could not load form fields');
    } finally {
      setAddFieldsLoading(false);
    }
  }, [students, addFieldsLoading]);

  const onAddStudent = useCallback(
    async (payload: StudentCreatePayload) => {
      await createStudent(payload);
      await loadStudentsByClass(classId);
      refreshDashboard();
      Alert.alert('Success', 'Student added successfully.');
    },
    [classId, loadStudentsByClass, refreshDashboard],
  );

  const pendingCount = students.length;

  useLayoutEffect(() => {
    if (!isPendingMode) {
      navigation.setOptions({ headerRight: undefined });
      return;
    }

    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerCountBadge}>
          <Text style={styles.headerCountNumber}>{pendingCount}</Text>
          <Text style={styles.headerCountLabel}>Pending</Text>
        </View>
      ),
    });
  }, [navigation, isPendingMode, pendingCount]);

  if (loading && students.length === 0) {
    return <Loader message="Loading students..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <SearchBar onSearch={setSearchQuery} placeholder="Search by name, mobile or photo no." />
        <TouchableOpacity
          style={[styles.filterBtn, filterStatus !== 'all' && styles.filterBtnActive]}
          onPress={() => {
            if (
              filterStatus === 'printed' ||
              filterStatus === 'delivered' ||
              filterStatus === 'received_by_school'
            ) {
              setFilterStatus('all');
            }
            setFilterVisible(true);
          }}
        >
          <Ionicons name="filter" size={18} color={colors.textSecondary} />
          <Text style={[styles.filterBtnText, filterStatus !== 'all' && styles.filterBtnTextActive]}>
            {filterStatus === 'all' ? 'Filter' : 'Filtered'}
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>No students found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <StudentCard
            studentName={item.name}
            className={item.className || className}
            rollNo={item.rollNo}
            status={item.status}
            onPress={() => onStudentPress(item)}
          />
        )}
      />
      <FilterModal
        visible={filterVisible}
        selected={filterStatus}
        onSelect={setFilterStatus}
        onClose={() => setFilterVisible(false)}
      />
      <StudentAddModal
        visible={addVisible}
        fieldKeys={addFieldKeys}
        classId={classId}
        onClose={() => setAddVisible(false)}
        onSubmit={onAddStudent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  toolbar: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.borderLight,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  filterBtnActive: {
    // backgroundColor: colors.primary,
  },
  filterBtnText: { ...typography.bodySmall, fontWeight: '600', color: colors.textSecondary },
  filterBtnTextActive: { 
    // color: colors.textInverse 
  },
  list: { padding: spacing.lg, paddingBottom: spacing.section },
  empty: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: { ...typography.bodySmall, color: colors.textMuted, marginTop: spacing.md },
  headerCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.warningBg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
  },
  headerCountNumber: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.warning,
  },
  headerCountLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.warning,
  },
});
