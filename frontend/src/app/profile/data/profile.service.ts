import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, withLatestFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Store } from '@ngrx/store';
import { IDService } from 'src/app/shared/utils/ID';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private API_URL = `${environment.BACKEND}/persons`;
}
