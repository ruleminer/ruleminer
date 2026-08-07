export const SPEECH_ACTIONS = ['przybliż', 'oddal', 'x', 'y', 'zet', 'stop'];
export const SPEECH_GRAMMAR = `#JSGF V1.0; grammar actions; public <action> = ${SPEECH_ACTIONS.join(' | ')};`;
export interface SpeechRecognitionResponse {
  action: string;
  confidence: number;
  success: boolean;
  errMessage: string;
}

export class SpeechRecognitionHandler {
  private SpeechRecognition: any;
  private SpeechGrammarList: any;
  private SpeechRecognitionEvent: any;

  private recognition: any;
  private speechRecognitionList: any;

  private enabled: boolean = false;

  constructor(
    private onSpeechEnabled: (() => void)[] = [],
    private onSpeechStopped: (() => void)[] = [],
    private onSpeechFeedback: ((response: SpeechRecognitionResponse) => void)[] = [],
  ) {}

  public init(): void {
    this.SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.SpeechGrammarList = (window as any).SpeechGrammarList || (window as any).webkitSpeechGrammarList;
    this.SpeechRecognitionEvent =
      (window as any).SpeechRecognitionEvent || (window as any).webkitSpeechRecognitionEvent;

    this.recognition = new this.SpeechRecognition();
    this.speechRecognitionList = new this.SpeechGrammarList();

    this.recognition.grammars = this.speechRecognitionList;
    this.recognition.continuous = true;
    this.recognition.lang = 'pl-PL';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    this.setupSpeechRecognitionHandlers();
  }

  public toggleSpeechRecognition(): void {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.recognition.start();
      this.onSpeechEnabled.forEach((callback) => callback());
    } else {
      this.recognition.stop();
    }
  }

  public stopSpeechRecognition(): void {
    this.enabled = false;
    this.recognition.stop();
  }

  public turnOffSpeechRecognition(): void {
    this.enabled = false;
    this.recognition.stop();
  }

  private setupSpeechRecognitionHandlers(): void {
    this.recognition.onend = () => {
      this.onSpeechStopped.forEach((callback) => callback());
    };

    this.recognition.onnomatch = () => {
      this.onSpeechFeedback.forEach((callback) =>
        callback({
          action: '',
          confidence: 0,
          success: false,
          errMessage: "I didn't recognise that command.",
        }),
      );
    };

    this.recognition.onerror = (event: any) => {
      this.onSpeechFeedback.forEach((callback) =>
        callback({
          action: '',
          confidence: 0,
          success: false,
          errMessage: `Error occurred in recognition:  ${event.error}`,
        }),
      );
    };

    this.recognition.onresult = (event: any) => {
      const action = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
      const confidence = event.results[event.results.length - 1][0].confidence * 100;

      this.onSpeechFeedback.forEach((callback) =>
        callback({
          action,
          confidence,
          success: true,
          errMessage: '',
        }),
      );
    };
  }
}
