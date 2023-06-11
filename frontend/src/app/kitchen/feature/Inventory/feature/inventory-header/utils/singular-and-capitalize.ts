import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'singularizeAndCapitalize',
  standalone: true,
})
export class SingularizeAndCapitalize implements PipeTransform {
  transform(value: string | null): string | null {
    if (!value) return value;
    const capitalized = value.charAt(0).toUpperCase() + value.slice(1);
    return capitalized.endsWith('s') ? capitalized.slice(0, -1) : capitalized;
  }
}