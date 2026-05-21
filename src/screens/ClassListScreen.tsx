import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStudents } from '../context/StudentContext';
import Loader from '../components/Loader';
import SearchBar from '../components/SearchBar';
import StudentCard from '../components/StudentCard';
import { searchStudentsGlobal } from '../Services/api';
import type { MainStackParamList } from '../navigation/types';
import type { ClassItem, Student } from '../types';
import { colors, spacing, radius, typography, shadow } from '../theme/colors';
import { sortClassItems } from '../utils/classSort';

type Nav = NativeStackNavigationProp<MainStackParamList, 'ClassList'>;
type ClassListRoute = RouteProp<MainStackParamList, 'ClassList'>;

const formatClassName = (name: string) => {
  if (!name) return '';
  let formattedName = name;
  if (formattedName.startsWith('Class - ')) {
    formattedName = formattedName.replace('Class - ', '');
  }
  const parts = formattedName.split(' - ');
  if (parts.length > 2) {
    return `${parts[0]} - ${parts[1]}`;
  }
  return formattedName;
};

export default function ClassListScreen() {
  const { params } = useRoute<ClassListRoute>();
  const navigation = useNavigation<Nav>();
  const { classes, loading, refreshClasses } = useStudents();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const sortedClasses = useMemo(() => sortClassItems(classes), [classes]);
  const isSearching = searchQuery.trim().length > 0;

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    setSearchLoading(true);
    searchStudentsGlobal(q)
      .then((results) => {
        if (!cancelled) setSearchResults(results);
      })
      .catch(() => {
        if (!cancelled) setSearchResults([]);
      })
      .finally(() => {
        if (!cancelled) setSearchLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [searchQuery]);

  useFocusEffect(
    useCallback(() => {
      refreshClasses();
    }, [refreshClasses]),
  );

  const onClassPress = (item: ClassItem) => {
    navigation.navigate('StudentList', { classId: item.id, className: formatClassName(item.name) });
  };

  const onStudentPress = (student: Student) => {
    navigation.navigate('StudentDetail', { studentId: student.id });
  };

  if (loading && classes.length === 0 && !isSearching) {
    return <Loader message="Loading classes..." />;
  }

  if (classes.length === 0 && !isSearching) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <Ionicons name="school-outline" size={48} color={colors.textMuted} />
        </View>
        <Text style={styles.emptyText}>No classes found</Text>
        <Text style={styles.emptySub}>Classes will appear here when available.</Text>
      </View>
    );
  }

  const searchBar = (
    <View style={styles.searchWrap}>
      <SearchBar
        onSearch={setSearchQuery}
        placeholder="Search by name, mobile or photo no."
        autoFocus={params?.autoFocusSearch}
      />
    </View>
  );

  if (isSearching) {
    return (
      <View style={styles.container}>
        {searchBar}
        {searchLoading ? (
          <Loader message="Searching students..." />
        ) : searchResults.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="search-outline" size={48} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyText}>No students found</Text>
            <Text style={styles.emptySub}>Try name, mobile number, or photo number.</Text>
          </View>
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <StudentCard
                studentName={item.name}
                className={item.className}
                rollNo={item.rollNo}
                status={item.status}
                onPress={() => onStudentPress(item)}
              />
            )}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {searchBar}
      <FlatList
        data={sortedClasses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => onClassPress(item)}
            activeOpacity={0.85}
          >
            <View style={styles.cardLeft}>
              <View style={styles.classIcon}>
                <Ionicons name="people" size={24} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.className}>{formatClassName(item.name)}</Text>
                {item.studentCount != null ? (
                  <Text style={styles.meta}>{item.studentCount} students</Text>
                ) : (
                  <Text style={styles.meta}>View students</Text>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.section },
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
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  classIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  className: { ...typography.heading, color: colors.text },
  meta: { ...typography.bodySmall, color: colors.textMuted, marginTop: spacing.xs },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
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
});
