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

/** ~96 dpi — keeps template element positions stable vs shrinking to screen width. */
const PREVIEW_PX_PER_MM = 3.78;

function dimensionToMm(value: number, unit: string): number {
  const u = unit.toLowerCase();
  if (u === 'cm' || u === 'centimeter' || u === 'centimeters') return value * 10;
  if (u === 'in' || u === 'inch' || u === 'inches') return value * 25.4;
  return value;
}

function formatDimensionUnit(unit: string): string {
  if (unit === 'millimeter' || unit === 'millimeters') return 'mm';
  if (unit === 'centimeter' || unit === 'centimeters') return 'cm';
  if (unit === 'inch' || unit === 'inches') return 'in';
  return unit;
}

/**
 * Card size follows school physical dimensions (not squeezed to screen width).
 * Wider cards scroll horizontally so template elements stay aligned.
 */
function getPreviewCardLayout(
  student: ApiPreviewStudent | undefined,
  screenWidth: number,
  contentPaddingHorizontal: number,
): {
  width: number;
  aspectRatio: number;
  sizeLabel: string | null;
  fontScale: number;
  needsHorizontalScroll: boolean;
} {
  const inset = contentPaddingHorizontal * 2;
  const availW = Math.max(100, screenWidth - inset);

  const meta = coerceSchoolDimension(student);
  const fallbackAspect = 1.62;
  const fallbackW = Math.min(280, availW);

  if (!meta) {
    return {
      width: fallbackW,
      aspectRatio: fallbackAspect,
      sizeLabel: null,
      fontScale: 1,
      needsHorizontalScroll: false,
    };
  }

  const { width: pw, height: ph, unit } = meta;
  const aspectRatio = pw / ph;
  const widthMm = dimensionToMm(pw, unit);
  const naturalWidth = widthMm * PREVIEW_PX_PER_MM;
  const displayUnit = formatDimensionUnit(unit);

  return {
    width: naturalWidth,
    aspectRatio,
    sizeLabel: `${pw} × ${ph} ${displayUnit}`,
    // Template fontSize is authored for naturalWidth; percentage boxes already scale with card.
    fontScale: 1,
    needsHorizontalScroll: naturalWidth > availW,
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
  const { width: windowWidth } = useWindowDimensions();
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
  const cardLayout = getPreviewCardLayout(student, windowWidth, spacing.lg);
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
                <Text allowFontScaling={false} style={styles.photoPlaceholderText}>
                  {student!.studentName.charAt(0)}
                </Text>
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
      const fontSize = Math.max(6, Math.round((element.fontSize ?? 10) * cardLayout.fontScale));
      const lineHeight = Math.round(fontSize * 1.2);
      const fontWeight = (element.fontWeight as '400' | '500' | '600' | '700') ?? '400';
      const textAlign = mapTemplateTextAlign(element.textAlign);
      const w = element.width;
      const h = element.height;
      const hasWidth = w != null && Number(w) > 0;
      const hasHeight = h != null && Number(h) > 0;
      // textAlign only works when Text has a bounded width; elements without width
      // (e.g. className) need a layout box or center/right alignment is ignored.
      const needsFullWidthForAlign = !hasWidth && (textAlign === 'center' || textAlign === 'right');
      const boxLeft = needsFullWidthForAlign ? 0 : element.x;
      const boxTop = element.y;
      const effectiveWidth = hasWidth
        ? Number(w)
        : needsFullWidthForAlign
          ? 100
          : Math.min(100, Math.max(20, 100 - element.x));

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

      return (
        <View
          key={element.id}
          style={[
            styles.textElementWrap,
            isAddress && styles.textElementWrapAddress,
            {
              left: `${boxLeft}%`,
              top: `${boxTop}%`,
              width: `${effectiveWidth}%`,
              ...(hasHeight && !isAddress ? { height: `${Number(h)}%` } : {}),
              justifyContent: mapTemplateVerticalAlign(element.textVerticalAlign),
            },
          ]}
        >
          <Text
            style={textStyle}
            allowFontScaling={false}
            maxFontSizeMultiplier={1}
            numberOfLines={isAddress ? undefined : 2}
            ellipsizeMode={isAddress ? undefined : 'tail'}
          >
            {value}
          </Text>
        </View>
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
      {/* {cardLayout.sizeLabel ? (
        <View style={styles.sizeBadge}>
          <Ionicons name="resize-outline" size={18} color={colors.primary} />
          <Text style={styles.sizeBadgeText}>Physical card: {cardLayout.sizeLabel}</Text>
        </View>
      ) : null} */}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        nestedScrollEnabled
        scrollEnabled={cardLayout.needsHorizontalScroll}
        contentContainerStyle={[
          styles.cardScrollContent,
          !cardLayout.needsHorizontalScroll && styles.cardScrollContentCentered,
        ]}
        style={styles.cardScroll}
      >
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
      </ScrollView>
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
  cardScroll: {
    marginBottom: spacing.xxl,
  },
  cardScrollContent: {
    flexGrow: 1,
  },
  cardScrollContentCentered: {
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  cardWrap: {
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
