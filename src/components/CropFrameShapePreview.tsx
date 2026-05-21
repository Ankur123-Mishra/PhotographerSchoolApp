import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Polygon, Rect, Stop } from 'react-native-svg';
import type { CropFrameType } from '../types/cropFrame';

const GRADIENT_ID = 'frameGradient';

interface CropFrameShapePreviewProps {
  frameType: CropFrameType;
  size?: number;
  showGlow?: boolean;
}

function ShapeIcon({ frameType, size }: { frameType: CropFrameType; size: number }) {
  const stroke = '#0f172a';
  const sw = 2;
  const half = size / 2;
  const pad = size * 0.15;

  if (frameType === 'rectangle') {
    return (
      <Rect
        x={pad}
        y={pad * 1.4}
        width={size - pad * 2}
        height={size - pad * 2.2}
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
      />
    );
  }
  if (frameType === 'rounded_rectangle') {
    return (
      <Rect
        x={pad}
        y={pad * 1.4}
        width={size - pad * 2}
        height={size - pad * 2.2}
        rx={6}
        ry={6}
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
      />
    );
  }
  if (frameType === 'circle') {
    return <Circle cx={half} cy={half} r={half - pad} fill="none" stroke="#dc2626" strokeWidth={sw} />;
  }
  if (frameType === 'pentagon') {
    const r = half - pad;
    const pts = Array.from({ length: 5 }, (_, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      return `${half + r * Math.cos(a)},${half + r * Math.sin(a)}`;
    }).join(' ');
    return <Polygon points={pts} fill={stroke} />;
  }
  if (frameType === 'hexagon') {
    const r = half - pad;
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (i * 2 * Math.PI) / 6;
      return `${half + r * Math.cos(a)},${half + r * Math.sin(a)}`;
    }).join(' ');
    return <Polygon points={pts} fill="none" stroke={stroke} strokeWidth={sw} />;
  }
  const r = half - pad;
  const pts = Array.from({ length: 8 }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 8;
    return `${half + r * Math.cos(a)},${half + r * Math.sin(a)}`;
  }).join(' ');
  return <Polygon points={pts} fill="none" stroke={stroke} strokeWidth={sw} />;
}

function MainShape({ frameType, size }: { frameType: CropFrameType; size: number }) {
  const half = size / 2;
  const inset = size * 0.08;

  if (frameType === 'rectangle') {
    return (
      <Rect
        x={inset}
        y={inset}
        width={size - inset * 2}
        height={size - inset * 2}
        fill={`url(#${GRADIENT_ID})`}
      />
    );
  }
  if (frameType === 'rounded_rectangle') {
    return (
      <Rect
        x={inset}
        y={inset}
        width={size - inset * 2}
        height={size - inset * 2}
        rx={size * 0.12}
        ry={size * 0.12}
        fill={`url(#${GRADIENT_ID})`}
      />
    );
  }
  if (frameType === 'circle') {
    return <Circle cx={half} cy={half} r={half - inset} fill={`url(#${GRADIENT_ID})`} />;
  }
  const sides = frameType === 'pentagon' ? 5 : frameType === 'hexagon' ? 6 : 8;
  const r = half - inset;
  const start = frameType === 'hexagon' ? 0 : -Math.PI / 2;
  const pts = Array.from({ length: sides }, (_, i) => {
    const a = start + (i * 2 * Math.PI) / sides;
    return `${half + r * Math.cos(a)},${half + r * Math.sin(a)}`;
  }).join(' ');
  return <Polygon points={pts} fill={`url(#${GRADIENT_ID})`} />;
}

export default function CropFrameShapePreview({
  frameType,
  size = 72,
  showGlow = true,
}: CropFrameShapePreviewProps) {
  const iconSize = 28;
  return (
    <View style={[styles.wrap, showGlow && styles.glow]}>
      <Svg width={iconSize} height={iconSize} style={styles.icon}>
        <ShapeIcon frameType={frameType} size={iconSize} />
      </Svg>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id={GRADIENT_ID} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#2dd4bf" />
            <Stop offset="100%" stopColor="#3b82f6" />
          </LinearGradient>
        </Defs>
        <MainShape frameType={frameType} size={size} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  glow: {
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  icon: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
