import { Camera } from '../interfaces/camera';
import { Visualisation3DData } from '../interfaces/visualisation-3d-data';

export class Visualisation3DHelper {
  public visualizationData: Visualisation3DData;

  constructor() {
    this.visualizationData = {
      interval: null,
      axisTitles: null,
      plotType: '',
      webcamRunning: null,
      plotExists: false,
      currentCamera: {
        eye: {
          x: 1.25,
          y: 1.25,
          z: 1.25,
        },
      },
      zoomFactor: 0.99, //0.96;
      rotationAngle: (Math.PI / 180) * 1,
      chart: null,
    };
  }

  /*
        Function to zoom in the plot
    */
  public zoomIn(): void {
    const newCamera = {
      eye: {
        x: this.visualizationData.currentCamera.eye.x * this.visualizationData.zoomFactor,
        y: this.visualizationData.currentCamera.eye.y * this.visualizationData.zoomFactor,
        z: this.visualizationData.currentCamera.eye.z * this.visualizationData.zoomFactor,
      },
    };
    this.relayout(newCamera, this.visualizationData.plotType);
  }

  /* 
        Function to zoom out the plot
    */
  public zoomOut(): void {
    const newCamera = {
      eye: {
        x: this.visualizationData.currentCamera.eye.x / this.visualizationData.zoomFactor,
        y: this.visualizationData.currentCamera.eye.y / this.visualizationData.zoomFactor,
        z: this.visualizationData.currentCamera.eye.z / this.visualizationData.zoomFactor,
      },
    };
    this.relayout(newCamera, this.visualizationData.plotType);
  }

  /*
        Rotate the plot around the X-axis.
        Computes the new eye position after rotation around the X-axis.
    */
  public aroundX(): void {
    const newCamera = {
      //
      eye: {
        x: this.visualizationData.currentCamera.eye.x,
        y:
          this.visualizationData.currentCamera.eye.y * Math.cos(this.visualizationData.rotationAngle) -
          this.visualizationData.currentCamera.eye.z * Math.sin(this.visualizationData.rotationAngle),
        z:
          this.visualizationData.currentCamera.eye.y * Math.sin(this.visualizationData.rotationAngle) +
          this.visualizationData.currentCamera.eye.z * Math.cos(this.visualizationData.rotationAngle),
      },
    };
    this.relayout(newCamera, this.visualizationData.plotType);
  }

  /*
        Rotate the plot around the Y-axis.
        Computes the new eye position after rotation around the Y-axis.
    */
  public aroundY(): void {
    const newCamera = {
      eye: {
        x:
          this.visualizationData.currentCamera.eye.x * Math.cos(this.visualizationData.rotationAngle) +
          this.visualizationData.currentCamera.eye.z * Math.sin(this.visualizationData.rotationAngle),
        y: this.visualizationData.currentCamera.eye.y,
        z:
          this.visualizationData.currentCamera.eye.x * -Math.sin(this.visualizationData.rotationAngle) +
          this.visualizationData.currentCamera.eye.z * Math.cos(this.visualizationData.rotationAngle),
      },
    };
    this.relayout(newCamera, this.visualizationData.plotType);
  }

  private relayout(newCamera: Camera, plotType: string): void {
    switch (plotType) {
      case 'scatter':
        this.relayoutPlot2D(newCamera);
        break;
      case 'scatter3d':
        this.relayoutPlot(newCamera);
        break;
    }
  }

  /*
        Rotate the plot around the Z-axis.
        Computes the new eye position after rotation around the Z-axis.
    */
  public aroundZ(): void {
    const newCamera = {
      eye: {
        x:
          this.visualizationData.currentCamera.eye.x * Math.cos(this.visualizationData.rotationAngle) -
          this.visualizationData.currentCamera.eye.y * Math.sin(this.visualizationData.rotationAngle),
        y:
          this.visualizationData.currentCamera.eye.x * Math.sin(this.visualizationData.rotationAngle) +
          this.visualizationData.currentCamera.eye.y * Math.cos(this.visualizationData.rotationAngle),
        z: this.visualizationData.currentCamera.eye.z,
      },
    };
    this.relayoutPlot(newCamera);
  }

  /*
        Function to change the layout of the plot for interactive plot manipulation
    */
  private relayoutPlot(newCamera: Camera): void {
    (window as any).Plotly.relayout('plot', {
      scene: {
        xaxis: { title: this.visualizationData.axisTitles[0] },
        yaxis: { title: this.visualizationData.axisTitles[1] },
        zaxis: { title: this.visualizationData.axisTitles[2] },
        camera: newCamera,
      },
    });
  }

  /*
        Function to change the layout of the 2D plot for interactive plot manipulation
    */
  private relayoutPlot2D(newCamera: Camera): void {
    (window as any).Plotly.relayout('plot', {
      scene: {
        dragmode: false,
        xaxis: { title: this.visualizationData.axisTitles[0] },
        yaxis: { title: this.visualizationData.axisTitles[1] },
        zaxis: { title: '', showticklabels: false },
        camera: {
          up: { x: 0, y: 1, z: 0 },
          center: { x: 0, y: 0, z: 0 },
          eye: newCamera.eye,
        },
        perspective: 'ortographic',
      },
    });
  }
}
