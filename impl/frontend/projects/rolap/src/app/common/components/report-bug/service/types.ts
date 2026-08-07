import { BugReportState, ScreenshotErrorsReasons } from '../../../store/bugReport/types';

export class ScreenshotError extends Error {
  private _reason: ScreenshotErrorsReasons;

  constructor(reason: ScreenshotErrorsReasons = ScreenshotErrorsReasons.UNKNOWN) {
    let message: string;
    switch (reason) {
      case ScreenshotErrorsReasons.PERMISSION_DENIED:
        message = 'Permission denied';
        break;
      case ScreenshotErrorsReasons.API_NOT_AVAILABLE:
        message = 'API not available';
        break;
      default:
        message = 'Unknown error';
    }
    super(message);
    this._reason = reason;
  }

  public get reason(): ScreenshotErrorsReasons {
    return this._reason;
  }
}

export type BugReport = BugReportState;

export interface BugReportResponse {
  description: string;
  screenshot: string;
  allow_contact: boolean;
}

export interface DisplayMediaOptions extends DisplayMediaStreamOptions {
  selfBrowserSurface: 'include' | 'exclude';
  preferCurrentTab: boolean;
}
