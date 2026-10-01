/*
 * Dhofar wilayat for the visual explorer: English names and the approximate centre of each
 * wilayat's main town (latitude, longitude). Used to place bubbles and 3D columns; they are
 * reference points, not boundaries.
 */
export interface WilayaGeo { ar: string; en: string; lat: number; lon: number }

export const WILAYAT_GEO: WilayaGeo[] = [
  { ar: 'صلالة', en: 'Salalah', lat: 17.0151, lon: 54.0924 },
  { ar: 'طاقة', en: 'Taqah', lat: 17.0372, lon: 54.4036 },
  { ar: 'مرباط', en: 'Mirbat', lat: 16.9925, lon: 54.6919 },
  { ar: 'سدح', en: 'Sadah', lat: 17.05, lon: 55.0667 },
  { ar: 'شليم وجزر الحلانيات', en: 'Shalim & Hallaniyat Islands', lat: 18.1075, lon: 55.657 },
  { ar: 'ثمريت', en: 'Thumrait', lat: 17.666, lon: 54.024 },
  { ar: 'المزيونة', en: 'Al Mazyunah', lat: 17.839, lon: 52.657 },
  { ar: 'مقشن', en: 'Muqshin', lat: 19.558, lon: 54.883 },
  { ar: 'رخيوت', en: 'Rakhyut', lat: 16.744, lon: 53.418 },
  { ar: 'ضلكوت', en: 'Dhalkut', lat: 16.706, lon: 53.25 },
];

export const geoOf = (wilaya: string) => WILAYAT_GEO.find(w => w.ar === wilaya) || null;
export const DHOFAR_CENTER: [number, number] = [17.75, 54.2];
