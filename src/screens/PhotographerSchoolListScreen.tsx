import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Loader from '../components/Loader';
import { fetchPhotographerAssignedSchools } from '../Services/api';
import type { PhotographerStackParamList } from '../navigation/types';
import type { PhotographerSchool } from '../types';
import { colors, radius, shadow, spacing, typography } from '../theme/colors';

type Nav = NativeStackNavigationProp<PhotographerStackParamList, 'PhotographerSchools'>;

export default function PhotographerSchoolListScreen() {
  const navigation = useNavigation<Nav>();
  const [schools, setSchools] = useState<PhotographerSchool[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSchools = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchPhotographerAssignedSchools();
      setSchools(list);
    } catch {
      setSchools([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSchools();
    }, [loadSchools]),
  );

  if (loading && schools.length === 0) {
    return <Loader message="Loading schools..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={schools}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadSchools} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="business-outline" size={44} color={colors.textMuted} />
            <Text style={styles.emptyText}>No schools found</Text>
            <Text style={styles.emptySub}>Assigned schools will appear here.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate('ClassList', {
                schoolId: item.id,
                schoolName: item.name,
              })
            }
            activeOpacity={0.85}
          >
            <View style={styles.cardLeft}>
              <View style={styles.iconWrap}>
                <Ionicons name="school-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.title} numberOfLines={2}>{item.name}</Text>
                {item.code ? <Text style={styles.meta}>Code: {item.code}</Text> : null}
                {item.address ? <Text style={styles.meta} numberOfLines={2}>{item.address}</Text> : null}
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
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.section,
    flexGrow: 1,
  },
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
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  cardText: { flex: 1 },
  title: { ...typography.heading, color: colors.text },
  meta: { ...typography.bodySmall, color: colors.textMuted, marginTop: spacing.xs },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyText: { ...typography.heading, color: colors.textSecondary, marginTop: spacing.md },
  emptySub: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
