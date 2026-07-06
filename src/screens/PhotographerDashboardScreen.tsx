import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import StudentAddModal from '../components/StudentAddModal';
import {
  createPhotographerStudent,
  fetchPhotographerAssignedSchools,
  fetchPhotographerClasses,
  resolvePhotographerAddStudentFieldKeys,
} from '../Services/api';
import type { PhotographerStackParamList } from '../navigation/types';
import type { ClassItem, PhotographerSchool, StudentCreatePayload } from '../types';
import { colors, radius, shadow, spacing, typography } from '../theme/colors';

type Nav = NativeStackNavigationProp<PhotographerStackParamList, 'PhotographerDashboard'>;

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
      style={[styles.actionCard, { backgroundColor, borderColor }]}
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

export default function PhotographerDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();

  const [addVisible, setAddVisible] = useState(false);
  const [schools, setSchools] = useState<PhotographerSchool[]>([]);
  const [classOptions, setClassOptions] = useState<ClassItem[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [addFieldKeys, setAddFieldKeys] = useState<string[]>([]);
  const [addFieldsLoading, setAddFieldsLoading] = useState(false);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const selectedSchoolIdRef = useRef('');

  const schoolOptions = useMemo(
    () => schools.map((school) => ({ id: school.id, name: school.name })),
    [schools],
  );

  const onGoProfile = useCallback(() => {
    navigation.getParent()?.navigate('Profile');
  }, [navigation]);

  const onOpenAddStudent = useCallback(async () => {
    if (schoolsLoading || addFieldsLoading) return;
    setSelectedSchoolId('');
    setSelectedClassId('');
    selectedSchoolIdRef.current = '';
    setClassOptions([]);
    setAddFieldKeys([]);
    setSchoolsLoading(true);
    try {
      const list = await fetchPhotographerAssignedSchools();
      setSchools(list);
      if (list.length === 0) {
        Alert.alert('No schools', 'No assigned schools found. Contact admin to assign schools.');
        return;
      }
      setAddVisible(true);
    } catch (e) {
      Alert.alert('Error', (e as Error).message || 'Could not load schools');
    } finally {
      setSchoolsLoading(false);
    }
  }, [schoolsLoading, addFieldsLoading]);

  const onSchoolChange = useCallback(async (schoolId: string) => {
    selectedSchoolIdRef.current = schoolId;
    setSelectedSchoolId(schoolId);
    setSelectedClassId('');
    setAddFieldKeys([]);
    setAddFieldsLoading(true);
    try {
      const classes = await fetchPhotographerClasses(schoolId);
      setClassOptions(classes);
      if (classes.length === 0) {
        Alert.alert('No classes', 'No classes found for this school.');
      }
    } catch (e) {
      setClassOptions([]);
      Alert.alert('Error', (e as Error).message || 'Could not load classes');
    } finally {
      setAddFieldsLoading(false);
    }
  }, []);

  const onClassChange = useCallback(async (classId: string) => {
    const schoolId = selectedSchoolIdRef.current;
    if (!schoolId) return;
    setSelectedClassId(classId);
    setAddFieldsLoading(true);
    try {
      const keys = await resolvePhotographerAddStudentFieldKeys(schoolId, classId);
      setAddFieldKeys(keys);
    } catch (e) {
      setAddFieldKeys([]);
      Alert.alert('Error', (e as Error).message || 'Could not load form fields');
    } finally {
      setAddFieldsLoading(false);
    }
  }, []);

  const onAddStudent = useCallback(async (payload: StudentCreatePayload) => {
    await createPhotographerStudent(payload);
    Alert.alert('Success', 'Student added successfully.');
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={onGoProfile}
          activeOpacity={0.75}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="person-circle-outline" size={28} color={colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, onGoProfile]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <Ionicons name="camera" size={28} color={colors.primary} />
        </View>
        <View style={styles.heroText}>
          <Text style={styles.heroSchoolName} numberOfLines={2}>
            {user?.name ?? 'Photographer Dashboard'}
          </Text>
          <Text style={styles.heroSub}>Overview of assigned school workflow</Text>
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
          label="View School"
          icon="business-outline"
          iconColor={colors.textInverse}
          textColor={colors.textInverse}
          backgroundColor={colors.primary}
          borderColor={colors.primary}
          onPress={() => navigation.navigate('PhotographerSchools')}
        />
      </View>

      <StudentAddModal
        visible={addVisible}
        fieldKeys={addFieldKeys}
        classId={selectedClassId}
        classOptions={classOptions}
        onClassChange={onClassChange}
        schoolOptions={schoolOptions}
        schoolId={selectedSchoolId}
        onSchoolChange={onSchoolChange}
        loadingSchools={schoolsLoading}
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
});
