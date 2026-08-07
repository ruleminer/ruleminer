import { createReducer, on } from '@ngrx/store';

import {
  setBugReportDescription,
  setBugReportScreenshot,
  setBugReportScreenshotError,
  setBugReportState,
} from './bugReport.action';
import { BugReportState } from './types';

const initialState: BugReportState = {
  description: null,
  allow_contact: false,
  screenshot: null,
  screenshotError: null,
};

export const bugReportReducer = createReducer(
  initialState,
  on(setBugReportState, (state, { newState }) => ({ ...newState })),
  on(setBugReportDescription, (state, { description }) => ({ ...state, description })),
  on(setBugReportScreenshot, (state, { screenshot }) => ({ ...state, screenshot })),
  on(setBugReportScreenshotError, (state, { error }) => ({ ...state, screenshotError: error })),
);
