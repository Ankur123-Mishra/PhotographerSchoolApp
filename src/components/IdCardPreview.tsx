import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, Dimensions } from 'react-native';
import type { IdCardTemplate, IdCardSampleData } from '../data/idCardTemplates';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH_SMALL = Math.max(260, Math.min(SCREEN_WIDTH - 48, 320));
const CARD_HEIGHT_SMALL = Math.round(CARD_WIDTH_SMALL * 0.72);
const CARD_WIDTH_LARGE = Math.max(280, Math.min(SCREEN_WIDTH - 32, 340));
const CARD_HEIGHT_LARGE = Math.round(CARD_WIDTH_LARGE * 0.72);

type Size = 'small' | 'large';

interface IdCardPreviewProps {
  template: IdCardTemplate;
  data: IdCardSampleData;
  size?: Size;
  style?: ViewStyle;
}

/**
 * Renders ID card preview – same design for Navy, Green, Maroon (screenshot layout).
 * Header: title, school name, top-right placeholder (solid Navy/Green, dashed Maroon).
 * Body: photo left with "Valid for current session" below it; right: Name, ID No., Class, School Name, Address.
 * Footer: AUTHORISED SIGNATORY, code.
 */


export function IdCardPreview({ template, data, size = 'large', style }: IdCardPreviewProps) {
  console.log('=== IdCardPreview === ', data);
  const isLarge = size === 'large';
  const cardWidth = isLarge ? CARD_WIDTH_LARGE : CARD_WIDTH_SMALL;
  const cardHeight = isLarge ? CARD_HEIGHT_LARGE : CARD_HEIGHT_SMALL;
  const themeColor = template.themeColor;
  const isMaroon = template.id === 'template-maroon';
  const isGreen = template.id === 'template-green';

  const headerHeight = isLarge ? 48 : 40;
  const photoSize = isLarge ? 60 : 48;
  const bodyPadding = isLarge ? 12 : 10;
  const footerHeight = isLarge ? 32 : 26;

  return (
    <View style={[styles.card, { width: cardWidth, height: cardHeight }, style]}>
      {/* Header: title, school name, top-right placeholder */}
      <View style={[styles.header, { height: headerHeight, backgroundColor: themeColor }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle} numberOfLines={1}>STUDENT IDENTITY CARD</Text>
          <Text style={styles.schoolNameHeader} numberOfLines={1}>{data.schoolName}</Text>
        </View>
        <View style={[styles.headerPlaceholder, isMaroon && styles.headerPlaceholderDashed]} />
      </View>
      {/* Thin separator line below header */}
      <View style={[styles.headerLine, { backgroundColor: themeColor }]} />

      {/* Body – Navy/Maroon: image left, content right; Green: content left, image right */}
      <View style={[styles.body, { padding: bodyPadding }]}>
        <View style={[styles.photoRow, isGreen && styles.photoRowReverse]}>
          <View style={[styles.photoColumn, isGreen && styles.photoColumnRight]}>
            <View style={styles.photoWrapStretch}>
              {data.photoUri ? (
                <Image source={{ uri: data.photoUri }} style={styles.photo} resizeMode="cover" />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderText}>{data.studentName.charAt(0)}</Text>
                </View>
              )}
            </View>
            <Text style={styles.validSession}>Valid for current session</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={[styles.studentName, isLarge && styles.studentNameLarge]} numberOfLines={1}>{data.studentName}</Text>
            <Text style={styles.idLine}>ID No. {data.studentId}</Text>
            <Text style={styles.classLine}>Class {data.className}</Text>
            <Text style={styles.bodySchool} numberOfLines={1}>{data.schoolName}</Text>
            <Text style={styles.bodyAddress} numberOfLines={2}>{data.address}</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { height: footerHeight, backgroundColor: themeColor }]}>
        <Text style={styles.footerText}>AUTHORISED SIGNATORY</Text>
        <Text style={styles.footerCode}>253012</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
  },
  headerLeft: { flex: 1, minWidth: 0 },
  headerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  schoolNameHeader: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.95)',
    marginTop: 2,
  },
  headerPlaceholder: {
    width: 28,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginLeft: 8,
  },
  headerPlaceholderDashed: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    borderStyle: 'dashed',
  },
  headerLine: {
    height: 2,
    opacity: 0.4,
  },
  body: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  photoRow: { flexDirection: 'row', alignItems: 'stretch' },
  photoRowReverse: { flexDirection: 'row-reverse' },
  photoColumn: { marginRight: 12, alignItems: 'center', alignSelf: 'stretch' },
  photoColumnRight: { marginRight: 0, marginLeft: 8 },
  photoWrapStretch: {
    flex: 1,
    aspectRatio: 1,
    minWidth: 52,
    maxWidth: 76,
    maxHeight: 76,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  photoWrap: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  photoPlaceholderText: { fontSize: 16, fontWeight: '700', color: '#64748b' },
  validSession: { fontSize: 9, color: '#64748b', marginTop: 6 },
  infoBlock: { flex: 1, minWidth: 0 },
  studentName: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  studentNameLarge: { fontSize: 15 },
  idLine: { fontSize: 11, color: '#475569', marginTop: 2 },
  classLine: { fontSize: 11, color: '#475569', marginTop: 1 },
  bodySchool: { fontSize: 11, color: '#0f172a', fontWeight: '600', marginTop: 6 },
  bodyAddress: { fontSize: 10, color: '#64748b', marginTop: 2 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  footerText: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.9)', letterSpacing: 0.3 },
  footerCode: { fontSize: 10, color: 'rgba(255,255,255,0.85)' },
});

export { CARD_WIDTH_SMALL, CARD_HEIGHT_SMALL, CARD_WIDTH_LARGE, CARD_HEIGHT_LARGE };
