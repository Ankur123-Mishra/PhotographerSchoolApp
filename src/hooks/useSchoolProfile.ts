import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getSchoolProfile } from '../Services/mobile-api';
import { parseSchoolProfileResponse } from '../utils/schoolProfile';
import type { SchoolProfile } from '../types';

export function useSchoolProfile(options?: { loadOnFocus?: boolean }) {
  const { user } = useAuth();
  const loadOnFocus = options?.loadOnFocus ?? true;
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const raw = await getSchoolProfile();
      const parsed = parseSchoolProfileResponse(raw);
      setProfile(parsed);
      if (!parsed) setError('School profile format not recognized.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profile');
      setProfile(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (loadOnFocus) loadProfile();
    }, [loadOnFocus, loadProfile]),
  );

  const effective: SchoolProfile | null =
    profile ??
    (user?.school?.name
      ? {
          name: user.school.name,
          contact: user.school.contact ?? user.mobile,
          email: user.school.email,
          schoolCode: user.school.schoolCode,
        }
      : null);

  const schoolName = effective?.name ?? null;

  return {
    profile,
    effective,
    schoolName,
    loading,
    refreshing,
    error,
    loadProfile,
  };
}
