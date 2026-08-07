import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class BlobErrorHttpInterceptor implements HttpInterceptor {
  public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((err) => {
        if (err instanceof HttpErrorResponse && err.error instanceof Blob && err.error.type === 'application/json') {
          return this.handleBlobError(err);
        }
        throw err;
      }),
    );
  }

  private handleBlobError(err: HttpErrorResponse) {
    return new Promise<any>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: Event) => {
        try {
          const errMsg = JSON.parse((<any>e.target).result);
          reject(
            new HttpErrorResponse({
              error: errMsg,
              headers: err.headers,
              status: err.status,
              statusText: err.statusText,
            }),
          );
        } catch (e) {
          reject(err);
        }
      };
      reader.onerror = (e) => {
        reject(err);
      };
      reader.readAsText(err.error);
    });
  }
}
