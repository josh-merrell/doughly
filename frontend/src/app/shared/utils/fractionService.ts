import { Injectable } from '@angular/core';
import Fraction from 'fraction.js';

@Injectable({
  providedIn: 'root',
})
export class FractionService {
  decimalToFraction(decimal: number): string {
    // Define common fractions and their decimal equivalents
    const commonFractions = {
      0.125: '1/8',
      0.25: '1/4',
      0.33: '1/3',
      0.34: '1/3',
      0.5: '1/2',
      0.66: '2/3',
      0.67: '2/3',
      0.75: '3/4',
    };

    // Define a tolerance for how close the decimal should be to the common fraction
    const tolerance = 0.01;

    // Check if the decimal is close to any common fractions
    for (const [key, value] of Object.entries(commonFractions)) {
      if (Math.abs(decimal - parseFloat(key)) < tolerance) {
        return value;
      }
    }

    // If not close to any common fraction, return the exact fraction
    return new Fraction(decimal).toFraction(true);
  }
}
