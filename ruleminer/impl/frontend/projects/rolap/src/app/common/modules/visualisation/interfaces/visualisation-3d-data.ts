import { Camera } from './camera';

export interface Visualisation3DData {
  interval: any;
  axisTitles: any;
  plotType: string;
  webcamRunning: any;
  plotExists: boolean;
  currentCamera: Camera;
  zoomFactor: number;
  rotationAngle: number;
  chart: any;
}
