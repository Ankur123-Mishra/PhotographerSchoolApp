import type { CropFrameType } from '../types/cropFrame';
import { processImageToFrame } from './processImageToFrame';

/** Gallery images: center-crop to frame aspect ratio, then apply shape mask. */
export function cropImageToFrame(uri: string, frameType: CropFrameType): Promise<string> {
  return processImageToFrame(uri, frameType);
}
