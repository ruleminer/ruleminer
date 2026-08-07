export class QueueElement {
  name: string;
  status: string;
}

export class DownloadManager {
  private queue: QueueElement[] = [];

  constructor(private onAllReady: () => void) {}

  public submitQueueElement(name: string): void {
    this.queue.push({ name: name, status: 'pending' });
  }

  public updateQueueElementStatus(name: string, status: string): void {
    const queueElement = this.queue.find((element) => element.name === name);
    if (!queueElement) return;

    queueElement.status = status;

    if (this.allElementsDownloaded()) this.onAllReady();
  }

  public allElementsDownloaded(): boolean {
    return this.queue.every((element) => element.status === 'done');
  }
}
