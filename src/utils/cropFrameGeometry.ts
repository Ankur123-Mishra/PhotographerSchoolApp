import { Dimensions } from 'react-native';
import type { CropFrameType } from '../types/cropFrame';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const FRAME_LEFT_PERCENT = 0.12;
export const FRAME_TOP_PERCENT = 0.15;
export const FRAME_WIDTH_PERCENT = 0.76;
export const FRAME_HEIGHT_PERCENT = 0.43;
export const FRAME_CORNER_RADIUS = 24;

export interface FrameRect {
  x: number;
  y: number;
  width: number;
  height: number;
  cornerRadius: number;
}

export interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function getBaseFrameRect(
  screenWidth = SCREEN_WIDTH,
  screenHeight = SCREEN_HEIGHT,
): FrameRect {
  const width = screenWidth * FRAME_WIDTH_PERCENT;
  const height = screenHeight * FRAME_HEIGHT_PERCENT;
  const cornerRadius = Math.min(FRAME_CORNER_RADIUS, width / 8, height / 8);
  return {
    x: screenWidth * FRAME_LEFT_PERCENT,
    y: screenHeight * FRAME_TOP_PERCENT,
    width,
    height,
    cornerRadius,
  };
}

function regularPolygonPoints(sides: number, cx: number, cy: number, radius: number, startAngle = -Math.PI / 2) {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < sides; i += 1) {
    const angle = startAngle + (i * 2 * Math.PI) / sides;
    points.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }
  return points;
}

export function getPolygonPoints(
  frameType: 'pentagon' | 'hexagon' | 'octagon',
  frame: FrameRect,
): string {
  const sides = frameType === 'pentagon' ? 5 : frameType === 'hexagon' ? 6 : 8;
  const cx = frame.x + frame.width / 2;
  const cy = frame.y + frame.height / 2;
  const radius = Math.min(frame.width, frame.height) / 2;
  const startAngle = frameType === 'hexagon' ? 0 : -Math.PI / 2;
  const points = regularPolygonPoints(sides, cx, cy, radius, startAngle);
  return points.map(p => `${p.x},${p.y}`).join(' ');
}

export function getCircleFrame(frame: FrameRect): FrameRect {
  const size = Math.min(frame.width, frame.height);
  return {
    x: frame.x + (frame.width - size) / 2,
    y: frame.y + (frame.height - size) / 2,
    width: size,
    height: size,
    cornerRadius: size / 2,
  };
}

function bboxFromPoints(points: { x: number; y: number }[]): CropRegion {
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function getScreenCropRegion(
  frameType: CropFrameType,
  screenWidth = SCREEN_WIDTH,
  screenHeight = SCREEN_HEIGHT,
): CropRegion {
  const base = getBaseFrameRect(screenWidth, screenHeight);

  if (frameType === 'rectangle' || frameType === 'rounded_rectangle') {
    return { x: base.x, y: base.y, width: base.width, height: base.height };
  }

  if (frameType === 'circle') {
    const circle = getCircleFrame(base);
    return { x: circle.x, y: circle.y, width: circle.width, height: circle.height };
  }

  const sides = frameType === 'pentagon' ? 5 : frameType === 'hexagon' ? 6 : 8;
  const cx = base.x + base.width / 2;
  const cy = base.y + base.height / 2;
  const radius = Math.min(base.width, base.height) / 2;
  const startAngle = frameType === 'hexagon' ? 0 : -Math.PI / 2;
  const points = regularPolygonPoints(sides, cx, cy, radius, startAngle);
  return bboxFromPoints(points);
}

export function getCropAspectRatio(frameType: CropFrameType): number {
  const region = getScreenCropRegion(frameType);
  return region.width / region.height;
}

export function mapScreenCropToImage(
  imageWidth: number,
  imageHeight: number,
  screenWidth: number,
  screenHeight: number,
  cropRegion: CropRegion,
): CropRegion {
  const screenAspect = screenWidth / screenHeight;
  const imageAspect = imageWidth / imageHeight;

  let scaleFactor = 1;
  let offsetX = 0;
  let offsetY = 0;

  if (imageAspect > screenAspect) {
    scaleFactor = imageHeight / screenHeight;
    offsetX = (imageWidth - screenWidth * scaleFactor) / 2;
  } else {
    scaleFactor = imageWidth / screenWidth;
    offsetY = (imageHeight - screenHeight * scaleFactor) / 2;
  }

  const x = Math.max(0, offsetX + cropRegion.x * scaleFactor);
  const y = Math.max(0, offsetY + cropRegion.y * scaleFactor);
  const width = Math.min(imageWidth - x, cropRegion.width * scaleFactor);
  const height = Math.min(imageHeight - y, cropRegion.height * scaleFactor);

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
  };
}

export function frameTypeNeedsShapeMask(frameType: CropFrameType): boolean {
  return frameType !== 'rectangle';
}

export function getScaledCornerRadius(
  cropWidth: number,
  cropHeight: number,
  screenWidth = SCREEN_WIDTH,
): number {
  const baseFrameWidth = screenWidth * FRAME_WIDTH_PERCENT;
  return Math.min(
    FRAME_CORNER_RADIUS * (cropWidth / baseFrameWidth),
    cropWidth / 8,
    cropHeight / 8,
  );
}

export function getPolygonPointsInRect(
  frameType: 'pentagon' | 'hexagon' | 'octagon',
  width: number,
  height: number,
): string {
  const frame: FrameRect = {
    x: 0,
    y: 0,
    width,
    height,
    cornerRadius: 0,
  };
  return getPolygonPoints(frameType, frame);
}

export function getCenterCropRegion(
  imageWidth: number,
  imageHeight: number,
  targetAspect: number,
): CropRegion {
  const imageAspect = imageWidth / imageHeight;
  let cropWidth: number;
  let cropHeight: number;

  if (imageAspect > targetAspect) {
    cropHeight = imageHeight;
    cropWidth = imageHeight * targetAspect;
  } else {
    cropWidth = imageWidth;
    cropHeight = imageWidth / targetAspect;
  }

  return {
    x: Math.round((imageWidth - cropWidth) / 2),
    y: Math.round((imageHeight - cropHeight) / 2),
    width: Math.round(cropWidth),
    height: Math.round(cropHeight),
  };
}
