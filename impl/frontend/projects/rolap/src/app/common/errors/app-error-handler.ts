import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { ErrorResponse } from '../interfaces/error-response.model';
import { NotifyService } from '../services/notify/notify.service';

@Injectable()
export class AppErrorHandler implements ErrorHandler {
  constructor(private translate: TranslateService, private notifyService: NotifyService) {}

  handleError(error: any) {
    if (error instanceof HttpErrorResponse) {
      const httpError: HttpErrorResponse = error;
      const httpErrorDetail = httpError.error as ErrorResponse;
      switch (httpErrorDetail.status_code) {
        case 400:
          this.handleHttpError(httpError, 'toast_messages.errors.http_errors.400');
          break;
        case 403:
          this.handleHttpError(httpError, 'toast_messages.errors.http_errors.403');
          break;
        case 404:
          this.handleHttpError(httpError, 'toast_messages.errors.http_errors.404');
          break;
        case 409:
          this.handleHttpError(httpError, 'toast_messages.errors.http_errors.409');
          break;
        case 500:
          this.handleHttpError(httpError, 'toast_messages.errors.http_errors.500');
          break;
        default:
          this.notifyService.showNotify(this.translate.instant('toast_messages.errors.default'), 'error');
          break;
      }
    } else {
      console.error(error);
    }
  }

  private handleHttpError(httpError: HttpErrorResponse, statusMessageKey: string) {
    const statusMessage = this.translate.instant(statusMessageKey);
    const message = this.getMessage(httpError, statusMessage);
    this.notifyService.showNotify(message, 'error');
  }

  /**
   * Returns an error message.
   *
   * @param httpError     - error response
   * @param statusMessage - default message for a given error code
   */
  private getMessage(httpError: HttpErrorResponse, statusMessage: string): string {
    const errorMsgId = (httpError.error as ErrorResponse).err_msg_id;
    const errorDetail = (httpError.error as ErrorResponse).detail as any;

    if (errorMsgId !== undefined) {
      const interpolateParams: any = {};
      if (errorDetail) {
        Object.keys(errorDetail).forEach((key) => {
          if (Array.isArray(errorDetail[key])) {
            //if error key is col_type and value is cat or num, then we need to translate it
            if (key === 'col_type' && (errorDetail[key] === 'cat' || errorDetail[key] === 'num')) {
              const translatedErrorDetail = errorDetail[key]
                .map((item: string) => {
                  return this.translate.instant(`data_upload.column_types.${item}`);
                })
                .join(', ');
              interpolateParams[key] = translatedErrorDetail;
            } else {
              //otherwise, just join the array from backend
              interpolateParams[key.replace(' ', '_')] = errorDetail[key].join(', ');
            }
          } else {
            if (key === 'col_type' && (errorDetail[key] === 'cat' || errorDetail[key] === 'num')) {
              interpolateParams[key] = this.translate.instant(`data_upload.column_types.${errorDetail[key]}`);
            } else {
              interpolateParams[key] = errorDetail[key];
            }
          }
        });
      }
      return this.translate.instant(`toast_messages.errors.server_messages.${errorMsgId}`, interpolateParams);
    }
    if (errorDetail !== undefined) return errorDetail;

    return statusMessage;
  }
}
