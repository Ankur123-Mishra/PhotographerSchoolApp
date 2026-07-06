import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getPhotographerProfile } from '../Services/mobile-api';
import type { PhotographerProfile } from '../types';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function str(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

function num(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
}

function bool(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function parsePhotographerProfileResponse(res: unknown): PhotographerProfile | null {
  const root = asRecord(res);
  if (!root) return null;

  const data = asRecord(root.data);
  const container = data ?? root;
  const photographer = asRecord(container.photographer) ?? asRecord(root.photographer);
  if (!photographer) return null;

  const id = str(photographer._id) ?? str(photographer.id);
  const name = str(photographer.name);
  if (!id || !name) return null;

  const wallet = asRecord(container.wallet) ?? asRecord(root.wallet);
  const stats = asRecord(container.stats) ?? asRecord(root.stats);
  const latestWalletTransaction =
    asRecord(container.latestWalletTransaction) ?? asRecord(root.latestWalletTransaction);

  return {
    id,
    name,
    mobile: str(photographer.mobile),
    email: str(photographer.email),
    role: str(photographer.role),
    isActive: bool(photographer.isActive),
    parentCollectionEnabled: bool(photographer.parentCollectionEnabled),
    accessDurationValue: num(photographer.accessDurationValue),
    accessDurationUnit: str(photographer.accessDurationUnit),
    accessExpiresAt: str(photographer.accessExpiresAt),
    pointsBalance: num(wallet?.pointsBalance),
    perStudentTemplateCost: num(wallet?.perStudentTemplateCost),
    assignedSchools: num(stats?.assignedSchools),
    latestWalletTransaction: latestWalletTransaction
      ? {
          id: str(latestWalletTransaction._id) ?? str(latestWalletTransaction.id) ?? '',
          type: str(latestWalletTransaction.type),
          points: num(latestWalletTransaction.points),
          action: str(latestWalletTransaction.action),
          note: str(latestWalletTransaction.note),
          balanceAfter: num(latestWalletTransaction.balanceAfter),
          createdAt: str(latestWalletTransaction.createdAt),
        }
      : undefined,
  };
}

export function usePhotographerProfile(options?: { loadOnFocus?: boolean }) {
  const loadOnFocus = options?.loadOnFocus ?? true;
  const [profile, setProfile] = useState<PhotographerProfile | null>(null);
  const [loading, setLoading] = useState(loadOnFocus);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const raw = await getPhotographerProfile();
      const parsed = parsePhotographerProfileResponse(raw);
      setProfile(parsed);
      if (!parsed) setError('Photographer profile format not recognized.');
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

  return {
    profile,
    loading,
    refreshing,
    error,
    loadProfile,
  };
}
