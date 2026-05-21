import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Polygon,
  Rect,
  Image as SvgImage,
} from 'react-native-svg';
import type { CropFrameType } from '../types/cropFrame';
import {
  frameTypeNeedsShapeMask,
  getPolygonPointsInRect,
  getScaledCornerRadius,
} from '../utils/cropFrameGeometry';
import {
  registerFrameShapeMaskProcessor,
  type FrameShapeMaskRequest,
} from '../utils/frameShapeMaskService';

function FrameClipShape({
  frameType,
  width,
  height,
}: {
  frameType: CropFrameType;
  width: number;
  height: number;
}) {
  if (frameType === 'rounded_rectangle') {
    const radius = getScaledCornerRadius(width, height);
    return <Rect x={0} y={0} width={width} height={height} rx={radius} ry={radius} />;
  }

  if (frameType === 'circle') {
    const size = Math.min(width, height);
    const cx = width / 2;
    const cy = height / 2;
    return <Circle cx={cx} cy={cy} r={size / 2} />;
  }

  if (frameType === 'pentagon' || frameType === 'hexagon' || frameType === 'octagon') {
    return <Polygon points={getPolygonPointsInRect(frameType, width, height)} />;
  }

  return <Rect x={0} y={0} width={width} height={height} />;
}

export default function FrameShapeMaskHost() {
  const viewRef = useRef<View>(null);
  const [request, setRequest] = useState<FrameShapeMaskRequest | null>(null);
  const [imageReady, setImageReady] = useState(false);
  const capturingRef = useRef(false);

  const finish = useCallback((req: FrameShapeMaskRequest, uri: string) => {
    req.resolve(uri);
    setRequest(null);
    setImageReady(false);
    capturingRef.current = false;
  }, []);

  const fail = useCallback((req: FrameShapeMaskRequest, message: string) => {
    req.reject(new Error(message));
    setRequest(null);
    setImageReady(false);
    capturingRef.current = false;
  }, []);

  const captureMaskedImage = useCallback(async () => {
    if (!request || !viewRef.current || capturingRef.current) return;
    capturingRef.current = true;

    try {
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      finish(request, uri);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to apply frame mask';
      fail(request, message);
    }
  }, [request, finish, fail]);

  useEffect(() => {
    registerFrameShapeMaskProcessor(req => {
      if (!frameTypeNeedsShapeMask(req.frameType)) {
        req.resolve(req.imageUri);
        return;
      }
      setImageReady(false);
      capturingRef.current = false;
      setRequest(req);
    });
    return () => registerFrameShapeMaskProcessor(null);
  }, []);

  useEffect(() => {
    if (!request || !imageReady) return;
    const timer = setTimeout(() => {
      captureMaskedImage();
    }, 80);
    return () => clearTimeout(timer);
  }, [request, imageReady, captureMaskedImage]);

  useEffect(() => {
    if (!request) return;
    const fallback = setTimeout(() => {
      if (!capturingRef.current && request) {
        captureMaskedImage();
      }
    }, 4000);
    return () => clearTimeout(fallback);
  }, [request, captureMaskedImage]);

  if (!request || !frameTypeNeedsShapeMask(request.frameType)) {
    return null;
  }

  const { imageUri, frameType, width, height } = request;

  return (
    <View style={styles.offscreen} pointerEvents="none" collapsable={false}>
      <View ref={viewRef} collapsable={false} style={{ width, height, backgroundColor: 'transparent' }}>
        <Svg width={width} height={height}>
          <Defs>
            <ClipPath id="frameClip">
              <FrameClipShape frameType={frameType} width={width} height={height} />
            </ClipPath>
          </Defs>
          <SvgImage
            href={{ uri: imageUri }}
            x={0}
            y={0}
            width={width}
            height={height}
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#frameClip)"
            onLoad={() => setImageReady(true)}
          />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  offscreen: {
    position: 'absolute',
    left: -10000,
    top: 0,
  },
});
