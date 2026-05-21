import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Svg, { Circle, Defs, Mask, Polygon, Rect } from 'react-native-svg';
import type { CropFrameType } from '../types/cropFrame';
import { CROP_FRAME_OPTIONS } from '../types/cropFrame';
import {
  getBaseFrameRect,
  getCircleFrame,
  getPolygonPoints,
} from '../utils/cropFrameGeometry';
import { processImageToFrame } from '../utils/processImageToFrame';
import { colors, spacing, radius, typography } from '../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PhotoCaptureModalProps {
  visible: boolean;
  cropFrame: CropFrameType;
  onClose: () => void;
  onPhotoCapture: (photoUri: string) => void;
}

function FrameCutout({
  frameType,
  frame,
}: {
  frameType: CropFrameType;
  frame: ReturnType<typeof getBaseFrameRect>;
}) {
  if (frameType === 'rectangle') {
    return (
      <Rect
        x={frame.x}
        y={frame.y}
        width={frame.width}
        height={frame.height}
        fill="black"
      />
    );
  }
  if (frameType === 'rounded_rectangle') {
    return (
      <Rect
        x={frame.x}
        y={frame.y}
        width={frame.width}
        height={frame.height}
        rx={frame.cornerRadius}
        ry={frame.cornerRadius}
        fill="black"
      />
    );
  }
  if (frameType === 'circle') {
    const circle = getCircleFrame(frame);
    return (
      <Circle
        cx={circle.x + circle.width / 2}
        cy={circle.y + circle.height / 2}
        r={circle.width / 2}
        fill="black"
      />
    );
  }
  const points = getPolygonPoints(frameType, frame);
  return <Polygon points={points} fill="black" />;
}

function FrameOutline({
  frameType,
  frame,
}: {
  frameType: CropFrameType;
  frame: ReturnType<typeof getBaseFrameRect>;
}) {
  const stroke = 'rgba(255,255,255,0.9)';
  const sw = 2;

  if (frameType === 'rectangle') {
    return (
      <Rect
        x={frame.x}
        y={frame.y}
        width={frame.width}
        height={frame.height}
        stroke={stroke}
        strokeWidth={sw}
        fill="none"
      />
    );
  }
  if (frameType === 'rounded_rectangle') {
    return (
      <Rect
        x={frame.x}
        y={frame.y}
        width={frame.width}
        height={frame.height}
        rx={frame.cornerRadius}
        ry={frame.cornerRadius}
        stroke={stroke}
        strokeWidth={sw}
        fill="none"
      />
    );
  }
  if (frameType === 'circle') {
    const circle = getCircleFrame(frame);
    return (
      <Circle
        cx={circle.x + circle.width / 2}
        cy={circle.y + circle.height / 2}
        r={circle.width / 2}
        stroke={stroke}
        strokeWidth={sw}
        fill="none"
      />
    );
  }
  return (
    <Polygon
      points={getPolygonPoints(frameType, frame)}
      stroke={stroke}
      strokeWidth={sw}
      fill="none"
    />
  );
}

export default function PhotoCaptureModal({
  visible,
  cropFrame,
  onClose,
  onPhotoCapture,
}: PhotoCaptureModalProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [cameraType, setCameraType] = useState<'front' | 'back'>('back');
  const camera = useRef<Camera>(null);
  const device = useCameraDevice(cameraType);
  const { hasPermission, requestPermission } = useCameraPermission();

  const frameLabel = CROP_FRAME_OPTIONS.find(o => o.id === cropFrame)?.label ?? 'Frame';

  const toggleCamera = useCallback(() => {
    setCameraType(prev => (prev === 'front' ? 'back' : 'front'));
  }, []);

  const handleRequestPermission = useCallback(async () => {
    const granted = await requestPermission();
    if (!granted) {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to take photos',
        [{ text: 'OK', onPress: onClose }],
      );
    }
  }, [requestPermission, onClose]);

  const capturePhoto = useCallback(async () => {
    if (!camera.current || isCapturing) return;

    try {
      setIsCapturing(true);
      const photo = await camera.current.takePhoto({
        flash: 'off',
        enableShutterSound: false,
      });

      const photoUri = `file://${photo.path}`;

      try {
        const finalUri = await processImageToFrame(photoUri, cropFrame, {
          screenWidth: SCREEN_WIDTH,
          screenHeight: SCREEN_HEIGHT,
        });
        onPhotoCapture(finalUri);
        onClose();
      } catch (cropError) {
        console.error('Crop error:', cropError);
        Alert.alert('Error', 'Failed to crop photo. Please try again.');
      } finally {
        setIsCapturing(false);
      }
    } catch (error: unknown) {
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
      console.error('Photo capture error:', error);
      setIsCapturing(false);
    }
  }, [isCapturing, cropFrame, onPhotoCapture, onClose]);

  if (!visible) return null;

  if (!hasPermission) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={colors.textMuted} />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to capture student photos
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={handleRequestPermission}>
            <Text style={styles.permissionBtnText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  if (!device) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={styles.permissionContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={styles.permissionTitle}>Camera Not Available</Text>
          <Text style={styles.permissionText}>No camera device found on this device</Text>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  const frame = getBaseFrameRect(SCREEN_WIDTH, SCREEN_HEIGHT);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <Camera
          ref={camera}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={visible}
          photo={true}
        />

        <View style={styles.overlay}>
          <Svg height={SCREEN_HEIGHT} width={SCREEN_WIDTH} style={styles.svg}>
            <Defs>
              <Mask id="mask">
                <Rect height={SCREEN_HEIGHT} width={SCREEN_WIDTH} fill="white" />
                <FrameCutout frameType={cropFrame} frame={frame} />
              </Mask>
            </Defs>
            <Rect
              height={SCREEN_HEIGHT}
              width={SCREEN_WIDTH}
              fill="rgba(0, 0, 0, 0.7)"
              mask="url(#mask)"
            />
            <FrameOutline frameType={cropFrame} frame={frame} />
          </Svg>

          {showGuide && (
            <View style={styles.guideContainer}>
              <View style={styles.guideBox}>
                <Ionicons name="scan-outline" size={32} color={colors.primary} />
                <Text style={styles.guideText}>
                  Position the subject within the {frameLabel.toLowerCase()} outline
                </Text>
                <Text style={styles.guideSubText}>
                  Photo will be cropped to match the selected frame
                </Text>
                <TouchableOpacity style={styles.gotItBtn} onPress={() => setShowGuide(false)}>
                  <Text style={styles.gotItText}>Got it</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.header}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerText}>Capture Student Photo</Text>
              <Text style={styles.headerSubText}>{frameLabel} frame</Text>
            </View>
            <TouchableOpacity style={styles.flipBtn} onPress={toggleCamera}>
              <Ionicons name="camera-reverse" size={28} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <View style={styles.instructionBox}>
              <Ionicons name="information-circle" size={20} color="white" />
              <Text style={styles.instructionText}>
                Align subject within the {frameLabel.toLowerCase()}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.captureBtn, isCapturing && styles.captureBtnDisabled]}
              onPress={capturePhoto}
              disabled={isCapturing}
            >
              {isCapturing ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : (
                <View style={styles.captureBtnInner} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xl + 20,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    marginTop: 2,
  },
  flipBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingBottom: spacing.xl + 20,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  instructionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  captureBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  captureBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'white',
  },
  captureBtnDisabled: {
    opacity: 0.5,
  },
  guideContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  guideBox: {
    backgroundColor: 'white',
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginHorizontal: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  guideText: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
  },
  guideSubText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  gotItBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  gotItText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  permissionTitle: {
    ...typography.titleSmall,
    color: colors.text,
    textAlign: 'center',
  },
  permissionText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  permissionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  permissionBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
});
