import { Pipe, PipeTransform } from '@angular/core';
import { environment } from 'src/environments/environment';

@Pipe({
  name: 'imageFromCDN',
  standalone: true,
})
export class ImageFromCDN implements PipeTransform {
  transform(value: string): string {
    if (!value) return value;
    return value.replace(
      's3.us-west-2.amazonaws.com/dl.images-compressed',
      environment.COMPRESSED_IMAGE_CDN
    );
  }
}
