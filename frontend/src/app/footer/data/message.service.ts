import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Message } from '../state/message-state';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private API_URL = `${environment.BACKEND}/messages`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Message[]> {
    return this.http.get<Message[]>(this.API_URL);
  }

  acknowledge(message: Message): Observable<Message> {
    return this.http.post<Message>(`${this.API_URL}/acknowledge`, message);
  }

  delete(message: Message): Observable<Message> {
    return this.http.post<Message>(`${this.API_URL}/delete`, message);
  }
}
