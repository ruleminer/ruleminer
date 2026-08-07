import { Visualisation3DHelper } from './visualisation-3d-helper';

export class Visualisation3DInterationHandlers {
  public interval: any;
  public visualisation3DHandler: Visualisation3DHelper = new Visualisation3DHelper();
  private previousCommand: string = '';

  public handleInteraction(action: string) {
    const commandsMatch: boolean = this.previousCommand === action;
    this.previousCommand = action;
    let interactionHandler: any;

    if (commandsMatch) {
      return;
    }

    switch (action) {
      case 'przybliż':
      case 'zoom-in':
        interactionHandler = () => {
          this.visualisation3DHandler.zoomIn();
        };
        break;
      case 'oddal':
      case 'zoom-out':
        interactionHandler = () => {
          this.visualisation3DHandler.zoomOut();
        };
        break;
      case 'x':
        interactionHandler = () => {
          this.visualisation3DHandler.aroundX();
        };
        break;
      case 'y':
        interactionHandler = () => {
          this.visualisation3DHandler.aroundY();
        };
        break;
      case 'z':
        interactionHandler = () => {
          this.visualisation3DHandler.aroundZ();
        };
        break;
      case 'stop':
        clearInterval(this.interval);
        this.interval = undefined;
        return;
      default:
        return;
    }

    this.interval && clearInterval(this.interval);
    this.interval = setInterval(() => {
      if (
        !this.visualisation3DHandler.visualizationData.chart ||
        !this.visualisation3DHandler.visualizationData.chart.layout
      ) {
        return;
      }
      this.visualisation3DHandler.visualizationData.currentCamera =
        this.visualisation3DHandler.visualizationData.chart.layout.scene.camera;
      interactionHandler();
    }, 50);
  }
}
