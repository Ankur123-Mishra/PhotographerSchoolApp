import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius, typography, shadow } from '../theme/colors';
import { generateOtp } from '../Services/mobile-api';
import type { AuthRole } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LoginScreen() {
  const { login } = useAuth();
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [loading, setLoading] = useState(false);
  const [loginRole, setLoginRole] = useState<AuthRole>('school');

  const isPhotographer = loginRole === 'photographer';

  const togglePhotographer = () => {
    if (loading) return;
    setLoginRole(isPhotographer ? 'school' : 'photographer');
    setStep('mobile');
    setOtp('');
  };

  const onSendOtp = async () => {
    const m = mobile.replace(/\D/g, '');
    if (m.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      await generateOtp(m, loginRole);
      
      setStep('otp');
      setOtp('');
      Alert.alert('Success', 'OTP sent to your mobile number');
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e && (e as { response?: { data?: { message?: string } } }).response?.data?.message;
      Alert.alert('Error', msg && typeof msg === 'string' ? msg : 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async () => {
    if (otp.length < 4) {
      Alert.alert('Error', 'Please enter the OTP sent to your number');
      return;
    }
    setLoading(true);
    try {
      const ok = await login(mobile.trim(), otp, loginRole);
      if (!ok) Alert.alert('Error', 'Invalid OTP. Please try again.');
    } catch (e) {
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.topStrip}>
        <View style={styles.heroContent}>
          <View style={styles.heroBadge}>
            <Ionicons name="school" size={40} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>School ID Card</Text>
          <Text style={styles.heroSubtitle}>Teacher Management Portal</Text>
          <View style={styles.heroFeatures}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="rgba(255,255,255,0.9)" />
              <Text style={styles.featureText}>Secure Access</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="rgba(255,255,255,0.9)" />
              <Text style={styles.featureText}>Real-time Updates</Text>
            </View>
          </View>
        </View>
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <View style={styles.decorCircle3} />
      </View>
      <View style={styles.card}>
        <View style={styles.badgeRow}>
          <View style={styles.logoSmall}>
            <Ionicons name="id-card" size={28} color={colors.primary} />
          </View>
          <View style={styles.securityTag}>
            <Ionicons name="shield-checkmark" size={14} color={colors.success} />
            <Text style={styles.securityTagText}>Secure Login</Text>
          </View>
        </View>
        <Text style={styles.title}>School Teacher Panel</Text>
        <Text style={styles.subtitle}>
          {step === 'mobile'
            ? 'Sign in with your registered mobile number'
            : `Enter OTP sent to +91 ${mobile.replace(/\D/g, '')}`}
        </Text>

        {step === 'mobile' ? (
          <>
            <Text style={styles.inputLabel}>Mobile Number</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="call-outline" size={20} color={colors.textMuted} />
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                style={styles.input}
                placeholder="10-digit mobile number"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                maxLength={10}
                value={mobile}
                onChangeText={(text) => setMobile(text.replace(/\D/g, ''))}
                editable={!loading}
              />
            </View>
            <Text style={styles.helperText}>We will send a one-time password to this number.</Text>
            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={onSendOtp}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={styles.btnText}>Send OTP</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.photographerCheck}
              onPress={togglePhotographer}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isPhotographer ? 'checkbox' : 'square-outline'}
                size={16}
                color={isPhotographer ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.photographerCheckText,
                  isPhotographer && styles.photographerCheckTextActive,
                ]}
              >
                Login as Photographer
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.inputLabel}>Verification Code</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="keypad-outline" size={20} color={colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Enter OTP"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={(text) => setOtp(text.replace(/\D/g, ''))}
                editable={!loading}
              />
            </View>
            <Text style={styles.helperText}>Code is valid for a few minutes only.</Text>
            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={onVerifyOtp}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={styles.btnText}>Login</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setStep('mobile')}
              disabled={loading}
            >
              <Text style={styles.backBtnText}>Change number</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
  },
  topStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: 'hidden',
  },
  heroContent: {
    paddingTop: 60,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    zIndex: 2,
  },
  heroBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: spacing.lg,
  },
  heroFeatures: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  featureText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  decorCircle1: {
    position: 'absolute',
    top: -40,
    right: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
    zIndex: 1,
  },
  decorCircle2: {
    position: 'absolute',
    top: 120,
    left: -50,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
    zIndex: 1,
  },
  decorCircle3: {
    position: 'absolute',
    bottom: -30,
    right: 40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    zIndex: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    marginTop: spacing.xl,
    borderColor: colors.borderLight,
    ...shadow.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  logoSmall: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#ECFDF3',
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  securityTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  title: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  inputLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countryCode: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    marginRight: spacing.xs,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md + 2,
    paddingLeft: spacing.sm,
    fontSize: 16,
    color: colors.text,
  },
  helperText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  photographerCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 6,
    marginTop: spacing.lg,
    paddingVertical: spacing.xs,
  },
  photographerCheckText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  photographerCheckTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.75,
  },
  btnText: {
    color: colors.textInverse,
    ...typography.bodyMedium,
  },
  backBtn: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  backBtnText: {
    color: colors.primary,
    ...typography.bodySmall,
  },
});
