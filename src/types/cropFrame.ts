export type CropFrameType =
  | 'rectangle'
  | 'rounded_rectangle'
  | 'circle'
  | 'pentagon'
  | 'hexagon'
  | 'octagon';

export interface CropFrameOption {
  id: CropFrameType;
  label: string;
  description: string;
}

export const CROP_FRAME_OPTIONS: CropFrameOption[] = [
  { id: 'rectangle', label: 'Rectangle', description: 'Standard rectangular frame' },
  { id: 'rounded_rectangle', label: 'Rounded Rectangle', description: 'Rectangle with smooth rounded corners' },
  { id: 'circle', label: 'Circle', description: 'Perfect circular frame' },
  { id: 'pentagon', label: 'Pentagon', description: 'Five-sided polygon frame' },
  { id: 'hexagon', label: 'Hexagon', description: 'Six-sided polygon frame' },
  { id: 'octagon', label: 'Octagon', description: 'Eight-sided polygon frame' },
];
