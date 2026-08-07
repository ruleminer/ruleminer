import { Injectable } from '@angular/core';

import { ScreenshotErrorsReasons } from '../../../store/bugReport/types';
import { DisplayMediaOptions, ScreenshotError } from './types';

@Injectable({
  providedIn: 'root',
})
export class ScreenshotService {
  public checkIfScreenshotIsAvailable(): boolean {
    return !!navigator.mediaDevices?.getDisplayMedia;
  }

  public async takeScreenshot(): Promise<string> {
    if (!this.checkIfScreenshotIsAvailable()) {
      throw new ScreenshotError(ScreenshotErrorsReasons.API_NOT_AVAILABLE);
    }
    try {
      const canvas: HTMLCanvasElement = document.createElement('canvas');
      const context: CanvasRenderingContext2D | null = canvas.getContext('2d');
      const video: HTMLVideoElement = document.createElement('video');

      if (context === null) throw new Error('Canvas or context is not defined');

      const options: DisplayMediaOptions = {
        selfBrowserSurface: 'include',
        preferCurrentTab: true,
      };
      const captureStream: MediaStream = await navigator.mediaDevices.getDisplayMedia(options);
      video.srcObject = captureStream;
      await video.play();
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      await video.pause();
      captureStream.getTracks().forEach((track) => track.stop());
      return canvas.toDataURL('image/png');
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        throw new ScreenshotError(ScreenshotErrorsReasons.PERMISSION_DENIED);
      }
      throw new ScreenshotError(ScreenshotErrorsReasons.UNKNOWN);
    }
  }
}
