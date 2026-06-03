import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStudents } from '../context/StudentContext';
import { useSchoolProfile } from '../hooks/useSchoolProfile';
import Loader from '../components/Loader';
import StudentAddModal from '../components/StudentAddModal';
import { createStudent, fetchStudentsByClass, resolveAddStudentFieldKeys } from '../Services/api';
import type { MainStackParamList } from '../navigation/types';
import type { StudentCreatePayload } from '../types';
import { colors, spacing, radius, typography, shadow } from '../theme/colors';
import { sortClassItems } from '../utils/classSort';

type ActionCardProps = {
  label: string;
  icon: string;
  iconColor: string;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
  onPress: () => void;
};

function ActionCard({
  label,
  icon,
  iconColor,
  textColor,
  backgroundColor,
  borderColor,
  onPress,
}: ActionCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.actionCard,
        {
          backgroundColor,
          borderColor,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={styles.actionCardContent}>
        <Ionicons name={icon} size={24} color={iconColor} />
        <Text style={[styles.actionCardText, { color: textColor }]}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const {
    classes,
    loading,
    refreshDashboard,
    refreshClasses,
  } = useStudents();
  const { schoolName } = useSchoolProfile();
  const [selectedClassId, setSelectedClassId] = useState('');
  const [addVisible, setAddVisible] = useState(false);
  const [addFieldKeys, setAddFieldKeys] = useState<string[]>([]);
  const [addFieldsLoading, setAddFieldsLoading] = useState(false);
  const sortedClasses = useMemo(() => sortClassItems(classes), [classes]);

  useFocusEffect(
    useCallback(() => {
      refreshDashboard();
    }, [refreshDashboard])
  );

  const onClassList = () => navigation.navigate('ClassList');
  const onPendingStudents = useCallback(
    () =>
      navigation.navigate('StudentList', {
        listMode: 'pending',
        title: 'Pending Students',
      }),
    [navigation],
  );
  const onGoSearch = useCallback(
    () => navigation.navigate('ClassList', { autoFocusSearch: true }),
    [navigation],
  );
  const onRefresh = useCallback(() => {
    refreshDashboard();
    refreshClasses();
  }, [refreshDashboard, refreshClasses]);

  const onOpenAddStudent = useCallback(async () => {
    if (addFieldsLoading) return;
    if (sortedClasses.length === 0) {
      await refreshClasses();
    }
    setSelectedClassId('');
    setAddFieldKeys([]);
    setAddVisible(true);
  }, [addFieldsLoading, sortedClasses.length, refreshClasses]);

  const onClassChangeForAdd = useCallback(async (classId: string) => {
    if (addFieldsLoading || !classId) return;
    setSelectedClassId(classId);
    setAddFieldsLoading(true);
    try {
      const classStudents = await fetchStudentsByClass(classId);
      const keys = await resolveAddStudentFieldKeys(classStudents);
      setAddFieldKeys(keys);
    } catch (e) {
      Alert.alert('Error', (e as Error).message || 'Could not load form fields');
    } finally {
      setAddFieldsLoading(false);
    }
  }, [addFieldsLoading]);

  const onAddStudent = useCallback(
    async (payload: StudentCreatePayload) => {
      await createStudent(payload);
      await Promise.all([refreshDashboard(), refreshClasses()]);
      Alert.alert('Success', 'Student added successfully.');
    },
    [refreshDashboard, refreshClasses],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={onGoSearch}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="search" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, onGoSearch]);

  if (loading) {
    return <Loader message="Loading dashboard..." />;
  }

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

      <View style={styles.actionGroup}>
        <ActionCard
          label="Create New Student"
          icon="person-add-outline"
          iconColor={colors.primary}
          textColor={colors.primary}
          backgroundColor={colors.primaryLight}
          borderColor={colors.primaryMuted}
          onPress={onOpenAddStudent}
        />
        <ActionCard
          label="Pending Students"
          icon="time-outline"
          iconColor={colors.warning}
          textColor={colors.warning}
          backgroundColor="#fff5e6"
          borderColor="#f6c17f"
          onPress={onPendingStudents}
        />
        <ActionCard
          label="View Class List"
          icon="list-outline"
          iconColor={colors.textInverse}
          textColor={colors.textInverse}
          backgroundColor={colors.primary}
          borderColor={colors.primary}
          onPress={onClassList}
        />
      </View>
      <StudentAddModal
        visible={addVisible}
        fieldKeys={addFieldKeys}
        classId={selectedClassId}
        classOptions={sortedClasses}
        onClassChange={onClassChangeForAdd}
        loadingFields={addFieldsLoading}
        onClose={() => setAddVisible(false)}
        onSubmit={onAddStudent}
      />
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.section,
    flexGrow: 1,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    ...shadow.md,
  },
  heroIcon: {
    width: 58,
    height: 58,
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
    lineHeight: 28,
  },
  heroSub: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  actionGroup: {
    flex: 1,
    gap: spacing.xl,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xl,
    minHeight: 94,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    ...shadow.md,
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionCardText: {
    ...typography.titleSmall,
    letterSpacing: 0.2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
});
