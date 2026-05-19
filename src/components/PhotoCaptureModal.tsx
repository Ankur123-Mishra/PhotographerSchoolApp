import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  ActivityIndicator,
  Image as RNImage,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import ImageEditor from '@react-native-community/image-editor';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Svg, { Defs, Mask, Rect } from 'react-native-svg';
import { colors, spacing, radius, typography } from '../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const FRAME_LEFT_PERCENT = 0.12;
const FRAME_TOP_PERCENT = 0.15;
const FRAME_WIDTH_PERCENT = 0.76;
const FRAME_HEIGHT_PERCENT = 0.43;
const FRAME_CORNER_RADIUS = 24;

interface PhotoCaptureModalProps {
  visible: boolean;
  onClose: () => void;
  onPhotoCapture: (photoUri: string) => void;
}

export default function PhotoCaptureModal({
  visible,
  onClose,
  onPhotoCapture,
}: PhotoCaptureModalProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [cameraType, setCameraType] = useState<'front' | 'back'>('back');
  const camera = useRef<Camera>(null);
  const device = useCameraDevice(cameraType);
  const { hasPermission, requestPermission } = useCameraPermission();

  const toggleCamera = useCallback(() => {
    setCameraType(prev => prev === 'front' ? 'back' : 'front');
  }, []);

  const handleRequestPermission = useCallback(async () => {
    const granted = await requestPermission();
    if (!granted) {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to take photos',
        [{ text: 'OK', onPress: onClose }]
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

      const photoUri = Platform.OS === 'ios' ? `file://${photo.path}` : `file://${photo.path}`;

      RNImage.getSize(
        photoUri,
        async (imageWidth, imageHeight) => {
          try {
            const screenAspect = SCREEN_WIDTH / SCREEN_HEIGHT;
            const imageAspect = imageWidth / imageHeight;

            let scaleFactor = 1;
            let offsetX = 0;
            let offsetY = 0;

            if (imageAspect > screenAspect) {
              scaleFactor = imageHeight / SCREEN_HEIGHT;
              offsetX = (imageWidth - SCREEN_WIDTH * scaleFactor) / 2;
            } else {
              scaleFactor = imageWidth / SCREEN_WIDTH;
              offsetY = (imageHeight - SCREEN_HEIGHT * scaleFactor) / 2;
            }

            const cropX = Math.max(0, offsetX + (SCREEN_WIDTH * FRAME_LEFT_PERCENT * scaleFactor));
            const cropY = Math.max(0, offsetY + (SCREEN_HEIGHT * FRAME_TOP_PERCENT * scaleFactor));
            const cropWidth = Math.min(imageWidth - cropX, SCREEN_WIDTH * FRAME_WIDTH_PERCENT * scaleFactor);
            const cropHeight = Math.min(imageHeight - cropY, SCREEN_HEIGHT * FRAME_HEIGHT_PERCENT * scaleFactor);

            const croppedImageUri = await ImageEditor.cropImage(photoUri, {
              offset: { x: Math.round(cropX), y: Math.round(cropY) },
              size: { width: Math.round(cropWidth), height: Math.round(cropHeight) },
              displaySize: { width: Math.round(cropWidth), height: Math.round(cropHeight) },
              resizeMode: 'contain',
            });

            const finalUri = typeof croppedImageUri === 'string' 
              ? croppedImageUri 
              : croppedImageUri?.uri || photoUri;

            onPhotoCapture(finalUri);
            onClose();
          } catch (cropError) {
            console.error('Crop error:', cropError);
            Alert.alert('Error', 'Failed to crop photo. Please try again.');
          } finally {
            setIsCapturing(false);
          }
        },
        (error) => {
          console.error('Image size error:', error);
          Alert.alert('Error', 'Failed to process photo. Please try again.');
          setIsCapturing(false);
        }
      );
    } catch (error: any) {
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
      console.error('Photo capture error:', error);
      setIsCapturing(false);
    }
  }, [isCapturing, onPhotoCapture, onClose]);

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
          <Text style={styles.permissionText}>
            No camera device found on this device
          </Text>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  const frameX = SCREEN_WIDTH * FRAME_LEFT_PERCENT;
  const frameY = SCREEN_HEIGHT * FRAME_TOP_PERCENT;
  const frameWidth = SCREEN_WIDTH * FRAME_WIDTH_PERCENT;
  const frameHeight = SCREEN_HEIGHT * FRAME_HEIGHT_PERCENT;
  const frameCornerRadius = Math.min(FRAME_CORNER_RADIUS, frameWidth / 8, frameHeight / 8);

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
                <Rect
                  x={frameX}
                  y={frameY}
                  width={frameWidth}
                  height={frameHeight}
                  rx={frameCornerRadius}
                  ry={frameCornerRadius}
                  fill="black"
                />
              </Mask>
            </Defs>
            <Rect
              height={SCREEN_HEIGHT}
              width={SCREEN_WIDTH}
              fill="rgba(0, 0, 0, 0.7)"
              mask="url(#mask)"
            />
            <Rect
              x={frameX}
              y={frameY}
              width={frameWidth}
              height={frameHeight}
              rx={frameCornerRadius}
              ry={frameCornerRadius}
              stroke="rgba(255,255,255,0.9)"
              strokeWidth="2"
              fill="none"
            />
          </Svg>

          {showGuide && (
            <View style={styles.guideContainer}>
              <View style={styles.guideBox}>
                <Ionicons name="person" size={32} color={colors.primary} />
                <Text style={styles.guideText}>
                  Position face and shoulders (upper body) within the outline
                </Text>
                <Text style={styles.guideSubText}>
                  Use the flip button to switch between front and back camera
                </Text>
                <TouchableOpacity
                  style={styles.gotItBtn}
                  onPress={() => setShowGuide(false)}
                >
                  <Text style={styles.gotItText}>Got it</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.header}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerText}>Capture Student Photo</Text>
            <TouchableOpacity style={styles.flipBtn} onPress={toggleCamera}>
              <Ionicons name="camera-reverse" size={28} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <View style={styles.instructionBox}>
              <Ionicons name="information-circle" size={20} color="white" />
              <Text style={styles.instructionText}>
                Align face and upper body within the frame
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
