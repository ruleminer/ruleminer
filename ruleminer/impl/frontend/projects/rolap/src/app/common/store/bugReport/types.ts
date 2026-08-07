export enum ScreenshotErrorsReasons {
  PERMISSION_DENIED = 'permission_denied',
  API_NOT_AVAILABLE = 'api_not_available',
  UNKNOWN = 'unknown',
}

export interface BugReportState {
  description: string | null;
  allow_contact: boolean;
  screenshot: string | null;
  screenshotError: ScreenshotErrorsReasons | null;
}
