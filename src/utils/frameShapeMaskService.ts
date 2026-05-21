import type { CropFrameType } from '../types/cropFrame';

export interface FrameShapeMaskRequest {
  imageUri: string;
  frameType: CropFrameType;
  width: number;
  height: number;
  resolve: (uri: string) => void;
  reject: (error: Error) => void;
}

type MaskProcessor = (request: FrameShapeMaskRequest) => void;

let processor: MaskProcessor | null = null;

export function registerFrameShapeMaskProcessor(fn: MaskProcessor | null) {
  processor = fn;
}

export function applyFrameShapeMask(
  imageUri: string,
  frameType: CropFrameType,
  width: number,
  height: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!processor) {
      reject(new Error('Frame shape mask processor is not ready'));
      return;
    }
    processor({ imageUri, frameType, width, height, resolve, reject });
  });
}
