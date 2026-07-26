import type { StickerModule } from './types';

export const VEHICLE_MODULE: StickerModule = {
  id: 'vehicle',
  label: 'Vehicle',
  labelSingular: 'Vehicle',
  labelPlural: 'Vehicles',
  tagline: 'Car, bike & helmet tags',
  description:
    'Wrong-parking alerts, crash SOS, blocked-driveway pings, and masked calling — all without giving out your number.',
  categories: ['car', 'bike', 'bicycle', 'helmet'],
  icon: '🚗',
  color: '#EAB308',
  colorLight: '#FEF9C3',
};

export default VEHICLE_MODULE;
