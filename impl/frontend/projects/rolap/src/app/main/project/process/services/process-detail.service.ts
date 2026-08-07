import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { EMPTY, catchError, filter, switchMap } from 'rxjs';

import { ProcessService } from '../../../../common/services/processes/process.service';
import { ProcessDetails, ProcessStatus } from '../models/process.model';
import { TimerService } from './timer.service';

@Injectable({
  providedIn: 'root',
})
export class ProcessDetailService {
  public readonly processDetailsSignal = signal<ProcessDetails | null>(null);
  public readonly isCalculatingSignal = signal<boolean>(false);
  public readonly processIdSignal = signal<number | null>(null);

  private processDetailsStatus = computed(() => this.processDetailsSignal()?.status ?? null);
  private processService = inject(ProcessService);
  private timerService = inject(TimerService);
  private refreshCountSignal = signal(0);
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.timerService
      .getAutoRefresh()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((autoRefresh) => {
        if (autoRefresh) {
          this.refreshCountSignal.update((prev) => prev + 1);
        }
      });

    effect(
      () => {
        const processId = this.processIdSignal();
        if (!processId) return;
        this.refreshCountSignal();

        this.setIsCalculating(true);
        this.processService.getProcess(processId).subscribe({
          next: (processDetails) => {
            this.setProcessDetails(processDetails);

            this.setIsCalculating(false);
          },
          error: () => {
            this.setIsCalculating(false);
          },
        });
      },
      { allowSignalWrites: true },
    );

    effect(
      () => {
        const processDetailsSignal = this.processDetailsSignal();
        const processIdSignal = this.processIdSignal();
        const processDetailsStatus = this.processDetailsStatus();

        if (!processDetailsSignal || !processIdSignal || !processDetailsStatus) return;
        if (processDetailsStatus !== ProcessStatus.stopped_clicked) return;

        this.processService
          .stopTask(processIdSignal)
          .pipe(
            switchMap((stopTaskResult) => {
              if (!stopTaskResult) return EMPTY;
              this.updateProcessDetailsSignalStatus(ProcessStatus.stopping);

              return this.processService.getProcess(processIdSignal);
            }),
            catchError((err) => {
              this.updateProcessDetailsSignalStatus(ProcessStatus.started);
              throw err;
            }),
            filter((processDetails) => !!processDetails),
            takeUntilDestroyed(this.destroyRef),
          )
          .subscribe(() => {
            this.updateProcessDetailsSignalStatus(ProcessStatus.stopped);
          });
      },
      { allowSignalWrites: true },
    );

    effect(
      () => {
        const processDetailsStatus = this.processDetailsStatus();
        if (processDetailsStatus !== ProcessStatus.stopped) return;
        this.timerService.refresh();
      },
      { allowSignalWrites: true },
    );
  }

  public setProcessDetails(processDetails: ProcessDetails) {
    this.processDetailsSignal.set(processDetails);
  }

  public setIsCalculating(isCalculating: boolean) {
    this.isCalculatingSignal.set(isCalculating);
  }

  public setProcessId(processId: number) {
    this.processIdSignal.set(processId);
  }

  public updateProcessDetailsSignalStatus(status: ProcessStatus) {
    this.processDetailsSignal.update(
      (prev) =>
        ({
          ...prev,
          status: status,
        } as ProcessDetails),
    );
  }
}
