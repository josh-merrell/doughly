import {
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { Observable, from, mergeMap } from 'rxjs';
import { createClient, Session } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';
import { throwError } from 'rxjs';

const SUPABASE_URL = environment.SUPABASE_DOUGHLEAP_URL;
const SUPABASE_ANON_KEY = environment.SUPABASE_DOUGHLEAP_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


export function authInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  return from(supabase.auth.getSession()).pipe(
    mergeMap((result: any) => {
      if (result) {
        const authReq = req.clone({
          headers: req.headers.set(
            'Authorization',
            `${result.data.session.access_token}`
          ),
        });
        return next(authReq);
      } else {
        console.log(`NO SESSION FOUND`)
        return throwError(new Error('No session found, unauthorized request'));
      }
    })
  );
}