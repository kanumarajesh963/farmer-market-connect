import type { CropCategory } from '../types';

// Generates a crop/category-themed placeholder as an inline SVG data URI.
//
// We used to build a photo URL from loremflickr.com by keyword (e.g.
// `loremflickr.com/500/500/cotton`). loremflickr pulls a random tagged photo
// from all of Flickr for that keyword — it isn't curated, so for some
// keywords it can return an unrelated or outright inappropriate image. Since
// this "suggested photo" is just a stand-in until the farmer uploads a real
// picture of their crop, there's no reason to gamble on an external random
// image search at all. This renders locally, so it's always safe and always
// on-topic.

const CATEGORY_THEME: Record<CropCategory, { bg: string; fg: string; icon: string }> = {
  Vegetables: { bg: '#e6f2df', fg: '#3f6b2a', icon: '🥕' },
  Fruits: { bg: '#fdece3', fg: '#a1481f', icon: '🍎' },
  Grains: { bg: '#f6efd9', fg: '#8a6a1e', icon: '🌾' },
  Pulses: { bg: '#eee6f5', fg: '#5b3f8a', icon: '🫘' },
  Spices: { bg: '#fbe4e1', fg: '#a1301f', icon: '🌶️' },
  Oilseeds: { bg: '#eef2d9', fg: '#5c6b1e', icon: '🌻' },
};

export function categoryPlaceholder(cropName: string, category: CropCategory): string {
  const theme = CATEGORY_THEME[category] ?? { bg: '#e8ece7', fg: '#5b6b60', icon: '🌱' };
  const label = (cropName.trim() || category).slice(0, 28);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500">
    <rect width="100%" height="100%" fill="${theme.bg}"/>
    <text x="50%" y="42%" font-size="120" text-anchor="middle" dominant-baseline="middle">${theme.icon}</text>
    <text x="50%" y="74%" font-family="sans-serif" font-size="28" font-weight="600" fill="${theme.fg}" text-anchor="middle">${escapeXml(label)}</text>
    <text x="50%" y="82%" font-family="sans-serif" font-size="16" fill="${theme.fg}" text-anchor="middle" opacity="0.75">${escapeXml(category)}</text>
  </svg>`;

  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
