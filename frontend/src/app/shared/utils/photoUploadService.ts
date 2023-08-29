import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PhotoUploadService {
  private readonly API_URL = `${environment.BACKEND}/uploads`;

  constructor(private http: HttpClient) {}

  getPreSignedUrl(fileName: string, fileType: string): Observable<any> {
    const body = { fileName, fileType };
    return this.http.post<{ url: string }>(`${this.API_URL}/presigned`, body);
  }

  uploadFileToS3(url: string, file: File | Blob): Promise<Response> {
    return fetch(url, { method: 'PUT', body: file });
  }
}
