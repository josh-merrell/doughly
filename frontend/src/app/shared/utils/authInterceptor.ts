import {
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { createClient, Session } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';

const SUPABASE_URL = environment.SUPABASE_DOUGHLEAP_URL;
const SUPABASE_ANON_KEY = environment.SUPABASE_DOUGHLEAP_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


export function authInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  const session = supabase.auth.getSession();
  if (session) {
    const authReq = req.clone({
      headers: req.headers.set(
        'Authorization',
        `${session}`
      ),
    });
    return next(authReq);
  } else {
    return next(req);
  }
}