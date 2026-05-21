import React, { useState, useCallback, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors, spacing, radius } from '../theme/colors';

const DEBOUNCE_MS = 300;

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  value?: string;
  autoFocus?: boolean;
}

export default function SearchBar({
  placeholder = 'Search by name...',
  onSearch,
  value: controlledValue,
  autoFocus = false,
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(controlledValue ?? '');
  const value = controlledValue !== undefined ? controlledValue : localValue;

  useEffect(() => {
    const t = setTimeout(() => {
      onSearch(value.trim());
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [value, onSearch]);

  const handleChange = useCallback(
    (text: string) => {
      if (controlledValue === undefined) setLocalValue(text);
      else onSearch(text);
    },
    [controlledValue, onSearch]
  );

  const clear = useCallback(() => {
    if (controlledValue === undefined) setLocalValue('');
    onSearch('');
  }, [controlledValue, onSearch]);

  return (
    <View style={styles.container}>
      <Ionicons name="search" size={20} color={colors.textMuted} style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={handleChange}
        returnKeyType="search"
        autoFocus={autoFocus}
      />
      {value.length > 0 ? (
        <TouchableOpacity onPress={clear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close-circle" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
});
