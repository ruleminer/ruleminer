import { Injectable } from '@angular/core';

export interface ColoredCellData {
  backgroundColor: string;
  whiteText: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ColoredCellColorsService {
  constructor() {}

  private generateColor(num: number): string {
    // Base hues from each given color
    const baseHues = [
      18, 277, 213, 158, 76, 11, 315, 352, 49, 89, 130, 171, 202, 233, 5, 46, 87, 119, 143, 167, 191, 215, 239, 263,
      287, 311, 335, 359, 34, 59,
    ];
    const baseSat = 45; // Lower saturation for less intensity
    const baseLit = 50; // Increase lightness for less intensity

    // Select base color hue based on num
    let hue = baseHues[num % baseHues.length];

    // Modify hue slightly (+/- 5) to vary color while keeping harmony
    hue = (hue + (5 - (num % 10))) % 360;

    // Convert to RGB
    const h = hue / 60;
    const c = ((1 - Math.abs((2 * baseLit) / 100 - 1)) * baseSat) / 100;
    const x = c * (1 - Math.abs((h % 2) - 1));
    const [r, g, b] = (
      h < 1 ? [c, x, 0] : h < 2 ? [x, c, 0] : h < 3 ? [0, c, x] : h < 4 ? [0, x, c] : h < 5 ? [x, 0, c] : [c, 0, x]
    ).map((v) => Math.round((v + (baseLit / 100 - c / 2)) * 255));

    // Convert to Hex
    const rHex = r.toString(16).padStart(2, '0');
    const gHex = g.toString(16).padStart(2, '0');
    const bHex = b.toString(16).padStart(2, '0');

    return '#' + rHex + gHex + bHex;
  }

  private shouldUseWhiteText(hexColor: string): boolean {
    hexColor = hexColor.replace('#', '');

    const r: number = parseInt(hexColor.substring(0, 2), 16);
    const g: number = parseInt(hexColor.substring(2, 4), 16);
    const b: number = parseInt(hexColor.substring(4, 6), 16);

    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  }

  public getColorsForId(id: number): ColoredCellData {
    const backgroundColor = this.generateColor(id);
    return {
      backgroundColor: backgroundColor,
      whiteText: this.shouldUseWhiteText(backgroundColor),
    };
  }
}
