import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { CROP_FRAME_OPTIONS } from '../types/cropFrame';
import type { CropFrameType } from '../types/cropFrame';
import CropFrameShapePreview from './CropFrameShapePreview';
import { spacing, radius } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const H_PADDING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - H_PADDING * 2 - CARD_GAP) / 2;

interface CropFrameSelectModalProps {
  visible: boolean;
  subtitle?: string;
  onClose: () => void;
  onSelect: (frameType: CropFrameType) => void;
}

export default function CropFrameSelectModal({
  visible,
  subtitle,
  onClose,
  onSelect,
}: CropFrameSelectModalProps) {
  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={26} color="#f8fafc" />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Select Crop Frame</Text>
            <Text style={styles.subtitle}>
              {subtitle || 'Choose a predefined crop frame for the student photo.'}
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        >
          {CROP_FRAME_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.id}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => onSelect(option.id)}
            >
              <CropFrameShapePreview frameType={option.id} size={64} />
              <Text style={styles.cardTitle}>{option.label}</Text>
              <Text style={styles.cardDesc}>{option.description}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: spacing.xl + 24,
    paddingHorizontal: H_PADDING,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: H_PADDING,
    paddingBottom: spacing.section,
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#1e293b',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#334155',
    padding: spacing.lg,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  cardDesc: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 16,
  },
});
