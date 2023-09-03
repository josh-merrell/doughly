import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, switchMap } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  private readonly API_URL = `${environment.BACKEND}/uploads`;

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  getPreSignedPostUrl(fileName: string, fileType: string): Observable<any> {
    const body = { fileName, fileType };
    return this.http.post<{ url: string }>(`${this.API_URL}/presigned`, body);
  }

  uploadFileToS3(url: string, file: File | Blob): Promise<Response> {
    return fetch(url, { method: 'PUT', body: file });
  }

  deleteFileFromS3(photoURL: string, type: string, id: number): Observable<any> {
    const body = { photoURL, type, id };
    return this.http.delete(`${this.API_URL}/image`, {body} );
  }
}
