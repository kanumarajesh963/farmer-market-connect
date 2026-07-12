import type { CropCategory } from '../types';

import vegetablesImg from '../assets/crops/vegetables.svg';
import fruitsImg from '../assets/crops/fruits.svg';
import grainsImg from '../assets/crops/grains.svg';
import pulsesImg from '../assets/crops/pulses.svg';
import spicesImg from '../assets/crops/spices.svg';
import oilseedsImg from '../assets/crops/oilseeds.svg';

// Real, bundled illustration files -- one per crop category -- shipped inside
// the app itself (src/assets/crops/*.svg). No network request, no random
// third-party photo lookup, nothing that can ever come back as an unrelated
// or inappropriate image.
//
// We previously called loremflickr.com with the crop name as a search
// keyword (e.g. `loremflickr.com/640/480/sunflower`), which returns a random
// tagged photo from all of Flickr. That's unmoderated and can return
// literally anything for a given keyword. These local files replace that
// entirely.
const CATEGORY_IMAGE: Record<CropCategory, string> = {
  Vegetables: vegetablesImg,
  Fruits: fruitsImg,
  Grains: grainsImg,
  Pulses: pulsesImg,
  Spices: spicesImg,
  Oilseeds: oilseedsImg,
};

export function categoryPlaceholder(_cropName: string, category: CropCategory): string {
  return CATEGORY_IMAGE[category] ?? vegetablesImg;
}
