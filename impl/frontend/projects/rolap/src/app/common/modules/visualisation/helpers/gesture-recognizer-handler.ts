import { HAND_CONNECTIONS } from '@mediapipe/hands';
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';

export const createGestureRecognizer = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm',
  );
  const gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: 'assets/gestures/gesture_recognizer.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numHands: 1,
  });

  return gestureRecognizer;
};

export class GestureRecognitionResponse {
  public categoryName: string;
  public score: number;
  public categoryScore: number;
}

interface Gesture {
  translation: string;
  value: string;
}

interface GestureDictionary {
  [key: string]: Gesture;
}

export class GestureRecognizerHandler {
  public static gestures: GestureDictionary = {
    zoom_in: {
      translation: 'przybliż',
      value: 'zoom-in',
    },
    zoom_out: {
      translation: 'oddal',
      value: 'zoom-out',
    },
    Around_X: {
      translation: 'obróć wokół osi X',
      value: 'x',
    },
    Around_Y: {
      translation: 'obrót wokół osi Y',
      value: 'y',
    },
    Around_Z: {
      translation: 'obrót wokół osi Z',
      value: 'z',
    },
    none: {
      translation: 'stop',
      value: 'stop',
    },
  };

  private gestureRecognizer: GestureRecognizer;
  private lastVideoTime = -1;
  private webcamRunning: boolean = false;

  private video: any;
  private canvasElement: any;
  private canvasCtx: any;
  private results: any;
  private chart: any;
  private executed: boolean = false;
  private currentStream: any;

  constructor(
    private onGesturesEnabled: (() => void)[] = [],
    private onGesturesStopped: (() => void)[] = [],
    private onGesturesFeedback: ((response: GestureRecognitionResponse) => void)[] = [],
  ) {
    createGestureRecognizer().then((gestureRecognizer) => {
      this.gestureRecognizer = gestureRecognizer;
    });
  }

  public init(): void {
    this.canvasElement = document.getElementById('output-canvas');
    this.chart = document.getElementById('plot');

    this.canvasCtx = this.canvasElement.getContext('2d');
    this.video = document.getElementById('webcam');
  }

  public isWebCamSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  public stopWebCam(): void {
    this.webcamRunning = false;
    this.executed = false;
    this.predictWebcam();
    this.onGesturesStopped.forEach((x) => x());

    if (this.currentStream) {
      this.currentStream.getTracks().forEach((track: any) => track.stop());
      this.currentStream = null;
    }
  }

  public toggleWebCam(): void {
    if (this.webcamRunning) {
      this.stopWebCam();
      return;
    }

    if (!this.gestureRecognizer) {
      alert('Please wait for gestureRecognizer to load');
      return;
    }

    this.webcamRunning = true;
    this.onGesturesEnabled.forEach((x) => x());
    this.executed && this.predictWebcam();

    if (!this.executed) {
      // getUsermedia parameters
      const constraints = {
        video: true,
      };
      // activate the webcam stream
      navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        this.video.srcObject = stream;
        this.video.addEventListener('loadeddata', () => {
          this.predictWebcam();
        });
        this.currentStream = stream;
      });
      this.executed = true;
    }
  }

  async predictWebcam() {
    //call this function again to keep predicting when the browser is ready
    if (this.webcamRunning) {
      const nowInMs = Date.now();
      if (this.video.currentTime !== this.lastVideoTime) {
        this.lastVideoTime = this.video.currentTime;
        this.results = this.gestureRecognizer.recognizeForVideo(this.video, nowInMs);
      }
      this.canvasCtx.save();
      this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
      //set the size of the canvas and video element
      this.canvasElement.height = this.video.videoHeight * 0.7;
      this.video.height = this.video.videoHeight * 0.7;
      this.canvasElement.width = this.video.videoWidth * 0.7;
      this.video.width = this.video.videoWidth * 0.7;

      //draw hand landmarks
      if (this.results.landmarks) {
        for (const landmarks of this.results.landmarks) {
          (window as any).drawConnectors(this.canvasCtx, landmarks, HAND_CONNECTIONS, {
            color: '#dbe2eb',
            lineWidth: 5,
          });
          (window as any).drawLandmarks(this.canvasCtx, landmarks, { color: '#131720', lineWidth: 2 });
        }
      }

      // result action based on recognized gesture
      if (this.results.gestures.length > 0) {
        const categoryName = this.results.gestures[0][0].categoryName;

        this.onGesturesFeedback.forEach((x) => {
          if (categoryName in GestureRecognizerHandler.gestures) {
            const response = {
              categoryName: GestureRecognizerHandler.gestures[categoryName].value ?? 'none',
              score: this.results.gestures[0][0].score,
              categoryScore: parseFloat(this.results.gestures[0][0].score) * 100,
            } as GestureRecognitionResponse;
            x(response);
          }
        });
      } else {
        this.onGesturesFeedback.forEach((x) => {
          const response = {
            categoryName: 'none',
          } as GestureRecognitionResponse;
          x(response);
        });
      }
      window.requestAnimationFrame(() => {
        this.predictWebcam();
      });
    } else {
      //clear the hand landmark drawing when the prediction is turned off
      this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    }
  }
}
