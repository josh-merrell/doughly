import {
  Component,
  Inject,
  Input,
  WritableSignal,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Log } from 'src/app/shared/state/shared-state';

@Component({
  selector: 'dl-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timeline.component.html',
})
export class TimelineComponent {
  @Input() logs!: Log[];

  public pastDay: WritableSignal<Log[]> = signal([]);
  public pastWeek: WritableSignal<Log[]> = signal([]);
  public pastMonth: WritableSignal<Log[]> = signal([]);

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit() {
    this.prepareLogs();
  }

  async prepareLogs() {
    await this.orderLogsByDate();

    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const weekAgo = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 7
    );
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // prepare past day logs
    let pastDayLogs = this.logs.filter((log) => {
      const logDate = new Date(log.logTime);
      return logDate >= todayStart;
    });
    pastDayLogs = this.cleanDates(pastDayLogs);
    this.pastDay.set(pastDayLogs);

    // prepare past week logs
    let pastWeekLogs = this.logs.filter((log) => {
      const logDate = new Date(log.logTime);
      return logDate < todayStart && logDate >= weekAgo;
    });
    pastWeekLogs = this.cleanDates(pastWeekLogs);
    this.pastWeek.set(pastWeekLogs);

    // prepare past month logs
    let pastMonthLogs = this.logs.filter((log) => {
      const logDate = new Date(log.logTime);
      return logDate < weekAgo && logDate >= monthStart;
    });
    pastMonthLogs = this.cleanDates(pastMonthLogs);
    this.pastMonth.set(pastMonthLogs);
  }

  async orderLogsByDate() {
    this.logs.sort((a, b) => {
      return new Date(b.logTime).getTime() - new Date(a.logTime).getTime();
    });
  }
  cleanDates(logs: Log[]) {
    const result: Log[] = [];
    logs.forEach((log) => {
      const date = new Date(log.logTime);
      log.displayLogTime = `${
        date.getMonth() + 1
      }/${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
      result.push(log);
    });
    return result;
  }
}
