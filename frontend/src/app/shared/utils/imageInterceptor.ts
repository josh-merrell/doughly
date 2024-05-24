import {
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
  HttpInterceptorFn,
  HttpContextToken,
} from '@angular/common/http';
import { Observable, from, mergeMap } from 'rxjs';
import { createClient, Session } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';
import { throwError } from 'rxjs';

const S3_URL = 'https://s3.us-west-2.amazonaws.com/dl.images';
const CDN_URL = 'https://d1fksulu953xbh.cloudfront.net';

export const imageInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  // Check if the request URL starts with the S3 URL
  if (req.url.startsWith(S3_URL)) {
    // Replace the S3 URL prefix with the CDN URL prefix
    const modifiedUrl = req.url.replace(S3_URL, CDN_URL);
    
    // Clone the request with the modified URL
    const modifiedReq = req.clone({ url: modifiedUrl });

    // Pass the modified request to the next handler
    return next(modifiedReq);
  }

  // If the URL does not start with the S3 URL, pass the original request to the next handler
  return next(req);
};
