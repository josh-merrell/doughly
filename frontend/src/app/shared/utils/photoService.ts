import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, catchError, from, map, switchMap } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  private readonly API_URL = `${environment.BACKEND}/uploads`;

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  getPreSignedPostUrl(
    type: string,
    fileName: string,
    fileType: string
  ): Observable<any> {
    const body = { type, fileName, fileType };
    return this.http.post<{ url: string }>(`${this.API_URL}/presigned`, body);
  }

  uploadFileToS3(url: string, file: File | Blob): Promise<Response> {
    return fetch(url, { method: 'PUT', body: file });
  }

  deleteFileFromS3(
    photoURL: string,
    type: string,
    id?: number
  ): Observable<any> {
    const url = `${this.API_URL}/image?photoURL=${encodeURIComponent(
      photoURL
    )}&type=${encodeURIComponent(type)}${id !== undefined ? `&id=${id}` : ''}`;
    return this.http.delete<any>(url);
  }

  fetchPhoto(url: string): Observable<any> {
    return from(fetch(url)).pipe(
      switchMap((response) => {
        if (response.ok) {
          return response.blob();
        }
        throw new Error('Network response was not ok.');
      }),
      map((blob) => {
        const objectURL = URL.createObjectURL(blob);
        return this.sanitizer.bypassSecurityTrustUrl(objectURL);
      }),
      catchError((error) => {
        console.error('Error fetching photo:', error);
        throw error;
      })
    );
  }
}
