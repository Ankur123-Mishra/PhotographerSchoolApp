import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ImageBackground,
  useWindowDimensions,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStudents } from '../context/StudentContext';
import ApprovalModal from '../components/ApprovalModal';
import Loader from '../components/Loader';
import type { MainStackParamList } from '../navigation/types';
import { colors, spacing, radius, typography, shadow } from '../theme/colors';
import { getSchoolPreview } from '../Services/mobile-api';
import { mobile_siteConfig } from '../Services/mobile-siteConfig';

type Nav = NativeStackNavigationProp<MainStackParamList, 'Preview'>;
type PreviewRoute = RouteProp<MainStackParamList, 'Preview'>;

/** Preview API response shape */
type ApiPreviewStudent = {
  _id: string;
  schoolId:
    | string
    | {
        _id: string;
        schoolName?: string;
        dimension?: { width?: unknown; height?: unknown };
        dimensionUnit?: string;
      };
  classId: string | { _id: string; className?: string; section?: string };
  class?: { _id?: string; className?: string; class_name?: string; section?: string };
  school?: {
    _id?: string;
    schoolName?: string;
    address?: string;
    dimension?: { width?: number; height?: number };
    dimensionUnit?: string;
  };
  uniqueCode?: string;
  studentName: string;
  address?: string;
  photoUrl?: string;
  colorCodePhotoUrl?: string;
  mobile?: string;
  dob?: string;
  status?: string;
  extraFields?: Record<string, unknown>;
  [key: string]: unknown;
};

type ApiTemplateElement = {
  type: 'photo' | 'text' | 'colorCode';
  id: string;
  dataField?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  content?: string;
  fontWeight?: string;
  label?: string;
  textAlign?: string;
  textVerticalAlign?: string;
};

type ApiTemplate = {
  _id: string;
  name?: string;
  frontImage?: string;
  backImage?: string;
  elements?: ApiTemplateElement[];
  backElements?: ApiTemplateElement[];
  [key: string]: unknown;
};

type ApiPreviewResponse = {
  preview?: { templateId?: string; [key: string]: unknown };
  student?: ApiPreviewStudent;
  template?: ApiTemplate;
};

function getFullPhotoUrl(photoUrl: string | undefined): string | null {
  if (!photoUrl || !photoUrl.trim()) return null;
  const base = mobile_siteConfig.BASE_URL.replace(/\/$/, '');
  const path = photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`;
  return `${base}${path}`;
}

function getClassName(student: ApiPreviewStudent): string {
  const nestedClass = student.class;
  if (nestedClass && typeof nestedClass === 'object') {
    const baseClassName = nestedClass.className || nestedClass.class_name;
    if (baseClassName) return nestedClass.section ? `${baseClassName} - ${nestedClass.section}` : baseClassName;
  }
  const c = student.classId;
  if (!c) return '—';
  if (typeof c === 'object' && c.className) return c.section ? `${c.className} - ${c.section}` : c.className;
  return String(c);
}

function getSchoolName(student: ApiPreviewStudent): string {
  console.log('=== getStudent === ', student);
  if (student.school?.schoolName) return student.school.schoolName;
  const s = student.schoolId;
  console.log('=== getSchoolName === ', s);
  if (!s) return 'School';
  if (typeof s === 'object' && s.schoolName) return s.schoolName;
  return 'School';
}

function getFullAssetUrl(path: string | undefined): string | null {
  if (!path || !path.trim()) return null;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${mobile_siteConfig.BASE_URL.replace(/\/$/, '')}${normalized}`;
}

function coerceSchoolDimension(
  student: ApiPreviewStudent | undefined,
): { width: number; height: number; unit: string } | null {
  if (!student) return null;

  const pick = (
    dim?: { width?: unknown; height?: unknown },
    unitRaw?: string,
  ): { width: number; height: number; unit: string } | null => {
    if (!dim) return null;
    const nw = typeof dim.width === 'string' ? parseFloat(dim.width) : Number(dim.width);
    const nh = typeof dim.height === 'string' ? parseFloat(dim.height) : Number(dim.height);
    if (!Number.isFinite(nw) || !Number.isFinite(nh) || nw <= 0 || nh <= 0) return null;
    const unit = (unitRaw?.trim() || 'mm').toLowerCase();
    return { width: nw, height: nh, unit: unit || 'mm' };
  };

  const fromSchool = pick(student.school?.dimension, student.school?.dimensionUnit);
  if (fromSchool) return fromSchool;

  const sid = student.schoolId;
  if (typeof sid === 'object' && sid !== null && sid.dimension) {
    return pick(sid.dimension, sid.dimensionUnit);
  }

  return null;
}

/**
 * Preview fills horizontal space (minus padding); aspect ratio matches school.dimension width/height.
 * ScrollView allows a taller max height so portrait cards (e.g. 56×88 mm) are not forced tiny.
 */
function getPreviewCardLayout(
  student: ApiPreviewStudent | undefined,
  screenWidth: number,
  screenHeight: number,
  contentPaddingHorizontal: number,
): { width: number; aspectRatio: number; sizeLabel: string | null; textScale: number } {
  const inset = contentPaddingHorizontal * 2;
  const availW = Math.max(100, screenWidth - inset);
  const availH = Math.max(180, Math.min(screenHeight * 0.62, screenHeight - 140));

  const meta = coerceSchoolDimension(student);
  const fallbackAspect = 1.62;
  const fallbackW = Math.min(280, availW);

  if (!meta) {
    return {
      width: fallbackW,
      aspectRatio: fallbackAspect,
      sizeLabel: null,
      textScale: Math.max(0.95, fallbackW / 240),
    };
  }

  const { width: pw, height: ph, unit } = meta;
  const aspectRatio = pw / ph;

  let width = availW;
  let height = width / aspectRatio;
  if (height > availH) {
    height = availH;
    width = height * aspectRatio;
  }

  const displayUnit =
    unit === 'millimeter' || unit === 'millimeters'
      ? 'mm'
      : unit === 'centimeter' || unit === 'centimeters'
        ? 'cm'
        : unit === 'inch' || unit === 'inches'
          ? 'in'
          : meta.unit;

  return {
    width,
    aspectRatio,
    sizeLabel: `${pw} × ${ph} ${displayUnit}`,
    textScale: Math.max(0.85, Math.min(1.35, width / 220)),
  };
}

function getStudentFieldValue(student: ApiPreviewStudent, dataField?: string): string {
  if (!dataField) return '';

  const normalizedField = dataField.trim();
  const normalizeKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizedDataField = normalizeKey(normalizedField);
  const normalizedFieldMap: Record<string, string> = {
    name: 'name',
    studentname: 'name',
    classname: 'className',
    class: 'className',
    dateofbirth: 'dateOfBirth',
    dob: 'dateOfBirth',
    phone: 'phone',
    mobile: 'phone',
    address: 'address',
    admissionno: 'admissionNo',
    studentid: 'studentId',
  };

  const fieldMap: Record<string, string> = {
    name: student.studentName || '',
    className: getClassName(student),
    dateOfBirth: student.dob ? new Date(student.dob).toLocaleDateString('en-GB') : '',
    phone: student.mobile || '',
    address: student.address || '',
    admissionNo: typeof student.admissionNo === 'string' ? student.admissionNo : '',
    studentId: typeof student.admissionNo === 'string' ? student.admissionNo : '',
  };

  const canonicalField = normalizedFieldMap[normalizedDataField] ?? normalizedField;
  const mapped = fieldMap[canonicalField];
  if (mapped !== undefined) return mapped;

  const dynamicValue = student[normalizedField];
  if (typeof dynamicValue === 'string') return dynamicValue;

  const extraFields = student.extraFields;
  if (extraFields && typeof extraFields === 'object') {
    const directExtraValue = extraFields[normalizedField];
    if (typeof directExtraValue === 'string') return directExtraValue;

    for (const [key, value] of Object.entries(extraFields)) {
      if (normalizeKey(key) === normalizedDataField && typeof value === 'string') {
        return value;
      }
    }
  }

  return '';
}

function mapTemplateTextAlign(raw?: string): 'left' | 'center' | 'right' | 'justify' {
  const a = raw?.toLowerCase()?.trim();
  if (a === 'center') return 'center';
  if (a === 'right' || a === 'end') return 'right';
  if (a === 'justify') return 'justify';
  return 'left';
}

function mapTemplateVerticalAlign(raw?: string): 'flex-start' | 'center' | 'flex-end' {
  const v = raw?.toLowerCase()?.trim();
  if (v === 'center' || v === 'middle') return 'center';
  if (v === 'bottom') return 'flex-end';
  return 'flex-start';
}

function isAddressField(dataField?: string): boolean {
  const key = dataField?.trim().toLowerCase();
  return key === 'address';
}

export default function PreviewScreen() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { params } = useRoute<PreviewRoute>();
  const { studentId } = params;
  const navigation = useNavigation<Nav>();
  const { approveStudentPreview, rejectStudentPreview } = useStudents();
  const [previewData, setPreviewData] = useState<ApiPreviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approveModal, setApproveModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSchoolPreview(studentId) as ApiPreviewResponse;
      console.log('=== getSchoolPreview === ', data);
      setPreviewData(data);
    } catch (e) {
      const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Failed to load preview';
      setError(message);
      setPreviewData(null);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const onConfirmApprove = async () => {
    setActionLoading(true);
    try {
      await approveStudentPreview(studentId);
      setApproveModal(false);
      Alert.alert('Success', 'Preview approved.');
      navigation.goBack();
    } finally {
      setActionLoading(false);
    }
  };

  const onConfirmReject = async () => {
    if (!rejectComment.trim()) {
      Alert.alert('Required', 'Please enter reason for rejection.');
      return;
    }
    setActionLoading(true);
    try {
      await rejectStudentPreview(studentId, rejectComment.trim());
      setRejectModal(false);
      setRejectComment('');
      Alert.alert('Done', 'Preview rejected. Correction raised.');
      navigation.goBack();
    } finally {
      setActionLoading(false);
    }
  };

  const student = previewData?.student;
  const template = previewData?.template;
  const frontTemplateUri = getFullAssetUrl(template?.frontImage);
  const backTemplateUri = getFullAssetUrl(template?.backImage);
  const studentPhotoUri = getFullPhotoUrl(student?.photoUrl);
  const studentColorCodeUri = getFullPhotoUrl(student?.colorCodePhotoUrl);
  const canApproveReject = student && student.status === 'preview_sent';
  const cardLayout = getPreviewCardLayout(student, windowWidth, windowHeight, spacing.lg);
  const renderTemplateElements = (elements: ApiTemplateElement[]) =>
    elements.map((element) => {
      const commonStyle = {
        left: `${element.x}%` as const,
        top: `${element.y}%` as const,
      };

      if (element.type === 'photo') {
        return (
          <View
            key={element.id}
            style={[
              styles.photoElementWrap,
              commonStyle,
              {
                width: `${element.width ?? 28}%`,
                height: `${element.height ?? 42}%`,
              },
            ]}
          >
            {studentPhotoUri ? (
              <Image source={{ uri: studentPhotoUri }} style={styles.photoElement} resizeMode="cover" />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>{student!.studentName.charAt(0)}</Text>
              </View>
            )}
          </View>
        );
      }

      if (element.type === 'colorCode') {
        return (
          <View
            key={element.id}
            style={[
              styles.photoElementWrap,
              commonStyle,
              {
                width: `${element.width ?? 14}%`,
                height: `${element.height ?? 8}%`,
              },
            ]}
          >
            {studentColorCodeUri ? (
              <Image
                source={{ uri: studentColorCodeUri }}
                style={styles.photoElement}
                resizeMode="contain"
              />
            ) : null}
          </View>
        );
      }

      const rawValue = getStudentFieldValue(student!, element.dataField) || element.content || '';
      const value = rawValue;
      const isAddress = isAddressField(element.dataField);
      const fontSize = Math.round((element.fontSize ?? 10) * cardLayout.textScale);
      const lineHeight = Math.round(fontSize * 1.3);
      const fontWeight = (element.fontWeight as '400' | '500' | '600' | '700') ?? '400';
      const textAlign = mapTemplateTextAlign(element.textAlign);
      const w = element.width;
      const h = element.height;
      const hasWidth = w != null && Number(w) > 0;
      const hasHeight = h != null && Number(h) > 0;
      const useLayoutBox = hasWidth;

      const textStyle = [
        styles.textElementInner,
        {
          fontSize,
          lineHeight,
          fontWeight,
          textAlign,
          alignSelf: 'stretch' as const,
        },
        isAddress ? styles.textElementAddress : null,
        isAddress && Platform.OS === 'android' ? styles.textElementAddressAndroid : null,
      ];

      if (useLayoutBox) {
        return (
          <View
            key={element.id}
            style={[
              styles.textElementWrap,
              isAddress && styles.textElementWrapAddress,
              commonStyle,
              {
                width: `${Number(w)}%`,
                ...(hasHeight && !isAddress ? { height: `${Number(h)}%` } : {}),
                justifyContent: mapTemplateVerticalAlign(element.textVerticalAlign),
              },
            ]}
          >
            <Text
              style={textStyle}
              numberOfLines={isAddress ? undefined : 2}
              ellipsizeMode={isAddress ? undefined : 'tail'}
            >
              {value}
            </Text>
          </View>
        );
      }

      return (
        <Text
          key={element.id}
          style={[
            styles.textElement,
            isAddress && styles.textElementAddress,
            commonStyle,
            {
              fontSize,
              lineHeight,
              fontWeight,
              textAlign,
            },
          ]}
          numberOfLines={isAddress ? undefined : 2}
          ellipsizeMode={isAddress ? undefined : 'tail'}
        >
          {value}
        </Text>
      );
    });

  if (loading && !previewData) {
    return <Loader message="Loading preview..." />;
  }

  if (error || !previewData?.student) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyText}>{error || 'Preview not found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <Ionicons name="id-card" size={28} color={colors.primary} />
        <View>
          <Text style={styles.title}>ID Card Preview</Text>
          <Text style={styles.subtitle}>{student!.studentName} • Class {getClassName(student!)}</Text>
        </View>
      </View>
      
      {/* {cardLayout.sizeLabel ? (
        <View style={styles.sizeBadge}>
          <Ionicons name="resize-outline" size={18} color={colors.primary} />
          <Text style={styles.sizeBadgeText}>Physical card: {cardLayout.sizeLabel}</Text>
        </View>
      ) : null} */}

      <View style={styles.cardWrap}>
        {frontTemplateUri ? (
          <>
            <ImageBackground
              source={{ uri: frontTemplateUri }}
              style={[
                styles.templateCanvas,
                { width: cardLayout.width, aspectRatio: cardLayout.aspectRatio },
              ]}
              resizeMode="stretch"
            >
              {renderTemplateElements(template?.elements ?? [])}
            </ImageBackground>
            {backTemplateUri ? (
              <ImageBackground
                source={{ uri: backTemplateUri }}
                style={[
                  styles.templateCanvas,
                  { width: cardLayout.width, aspectRatio: cardLayout.aspectRatio },
                ]}
                resizeMode="stretch"
              >
                {renderTemplateElements(template?.backElements ?? [])}
              </ImageBackground>
            ) : null}
          </>
        ) : (
          <View style={styles.noTemplateWrap}>
            <Text style={styles.emptyText}>Template image not found in response.</Text>
          </View>
        )}
      </View>
      {canApproveReject && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, styles.rejectBtn]}
            onPress={() => setRejectModal(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="close-circle" size={22} color={colors.textInverse} />
            <Text style={styles.btnText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.approveBtn]}
            onPress={() => setApproveModal(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle" size={22} color={colors.textInverse} />
            <Text style={styles.btnText}>Approve</Text>
          </TouchableOpacity>
        </View>
      )}
      {student!.status !== 'preview_sent' && (
        <View style={styles.hintWrap}>
          <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
          <Text style={styles.hint}>Status: {student!.status}. Approve/Reject not available.</Text>
        </View>
      )}

      <ApprovalModal
        visible={approveModal}
        variant="approve"
        title="Approve Preview"
        message="Are you sure you want to approve this ID card preview?"
        loading={actionLoading}
        onConfirm={onConfirmApprove}
        onCancel={() => setApproveModal(false)}
      />

      <ApprovalModal
        visible={rejectModal}
        variant="reject"
        title="Reject Preview"
        message="Please provide reason for rejection (required)."
        comment={rejectComment}
        onCommentChange={setRejectComment}
        loading={actionLoading}
        onConfirm={onConfirmReject}
        onCancel={() => { setRejectModal(false); setRejectComment(''); }}
      />
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.section },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  emptyText: { ...typography.body, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  title: { ...typography.heading, color: colors.text },
  subtitle: { ...typography.bodySmall, color: colors.textMuted, marginTop: spacing.xs },
  sizeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  sizeBadgeText: { ...typography.bodySmall, color: colors.text, flex: 1 },
  cardWrap: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    gap: spacing.md,
  },
  templateCanvas: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#fff',
    ...shadow.sm,
  },
  photoElementWrap: {
    position: 'absolute',
    overflow: 'hidden',
  },
  photoElement: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#64748b',
  },
  textElementWrap: {
    position: 'absolute',
    overflow: 'hidden',
  },
  textElementWrapAddress: {
    overflow: 'visible',
  },
  textElementInner: {
    color: '#111827',
  },
  textElementAddress: {
    flexShrink: 1,
  },
  textElementAddressAndroid: {
    includeFontPadding: false,
  },
  textElement: {
    position: 'absolute',
    color: '#111827',
    maxWidth: '80%',
  },
  noTemplateWrap: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  actions: { flexDirection: 'row', gap: spacing.md },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.md,
  },
  rejectBtn: { backgroundColor: colors.error },
  approveBtn: { backgroundColor: colors.success },
  btnText: { color: colors.textInverse, ...typography.bodyMedium },
  hintWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  hint: { ...typography.bodySmall, color: colors.textMuted },
});
