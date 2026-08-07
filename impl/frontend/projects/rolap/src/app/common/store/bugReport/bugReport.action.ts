import { createAction } from '@ngrx/store';

import { BugReportState, ScreenshotErrorsReasons } from './types';

export const setBugReportState = createAction('[BugReport] Set State', (newState: BugReportState) => ({
  newState,
}));

export const setBugReportDescription = createAction('[BugReport] Set description', (description: string) => ({
  description,
}));

export const setBugReportScreenshot = createAction('[BugReport] Set screenshot', (screenshot: string | null) => ({
  screenshot,
}));

export const setBugReportScreenshotError = createAction(
  '[BugReport] Set screenshot error',
  (error: ScreenshotErrorsReasons) => ({
    error,
  }),
);
