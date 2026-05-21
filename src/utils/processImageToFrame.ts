import { Dimensions, Image as RNImage } from 'react-native';
import ImageEditor from '@react-native-community/image-editor';
import type { CropFrameType } from '../types/cropFrame';
import {
  frameTypeNeedsShapeMask,
  getCenterCropRegion,
  getCropAspectRatio,
  getScreenCropRegion,
  mapScreenCropToImage,
} from './cropFrameGeometry';
import { applyFrameShapeMask } from './frameShapeMaskService';

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    RNImage.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      error => reject(error),
    );
  });
}

async function cropRectangularRegion(uri: string, region: {
  x: number;
  y: number;
  width: number;
  height: number;
}): Promise<string> {
  const cropped = await ImageEditor.cropImage(uri, {
    offset: { x: region.x, y: region.y },
    size: { width: region.width, height: region.height },
    displaySize: { width: region.width, height: region.height },
    resizeMode: 'contain',
  });
  return typeof cropped === 'string' ? cropped : cropped?.uri || uri;
}

async function applyShapeMaskIfNeeded(
  uri: string,
  frameType: CropFrameType,
): Promise<string> {
  if (!frameTypeNeedsShapeMask(frameType)) {
    return uri;
  }
  const { width, height } = await getImageSize(uri);
  return applyFrameShapeMask(uri, frameType, width, height);
}

export interface ProcessImageToFrameOptions {
  screenWidth?: number;
  screenHeight?: number;
}

/**
 * Crops an image to the selected frame region, then applies the frame shape mask
 * (circle, polygon, rounded corners) so the uploaded file matches the preview.
 */
export async function processImageToFrame(
  uri: string,
  frameType: CropFrameType,
  options?: ProcessImageToFrameOptions,
): Promise<string> {
  const screenWidth = options?.screenWidth ?? Dimensions.get('window').width;
  const screenHeight = options?.screenHeight ?? Dimensions.get('window').height;
  const useScreenMapping = options?.screenWidth != null && options?.screenHeight != null;

  const { width: imageWidth, height: imageHeight } = await getImageSize(uri);

  const cropRegion = useScreenMapping
    ? mapScreenCropToImage(
        imageWidth,
        imageHeight,
        screenWidth,
        screenHeight,
        getScreenCropRegion(frameType, screenWidth, screenHeight),
      )
    : getCenterCropRegion(imageWidth, imageHeight, getCropAspectRatio(frameType));

  const croppedUri = await cropRectangularRegion(uri, cropRegion);
  return applyShapeMaskIfNeeded(croppedUri, frameType);
}
