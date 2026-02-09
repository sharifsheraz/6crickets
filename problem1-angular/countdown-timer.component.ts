import { Component, ChangeDetectionStrategy } from "@angular/core";
import { Observable, interval, of } from "rxjs";
import {
  switchMap,
  map,
  startWith,
  catchError,
  takeWhile,
} from "rxjs/operators";
import { DeadlineService } from "./deadline.service";

interface CountdownState {
  secondsLeft: number | null;
  error: boolean;
}

/**
 * Countdown timer that fetches deadline from API
 * and updates every second.
 */
@Component({
  selector: "app-countdown-timer",
  template: `
    <div class="countdown-timer" role="timer">
      @if (state$ | async; as state) {
        @if (state.error) {
          <span class="error" role="alert"> Error loading deadline </span>
        } @else if (state.secondsLeft === null) {
          <span class="loading" aria-label="Loading countdown timer">
            Loading...
          </span>
        } @else {
          <span
            class="countdown"
            aria-label="Time remaining"
            aria-live="polite"
          >
            Seconds left to deadline: {{ state.secondsLeft }}
          </span>
        }
      }
    </div>
  `,
  styles: [
    `
      .countdown-timer {
        font-family: system-ui, sans-serif;
        font-size: 1rem;
        line-height: 1.5;
        padding: 0.75rem 1rem;
        min-height: 3rem;
        display: flex;
        align-items: center;
      }

      .countdown {
        font-weight: 500;
        color: #2d3748;
      }

      .loading {
        color: #718096;
        font-style: italic;
      }

      .error {
        color: #e53e3e;
        font-weight: 500;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountdownTimerComponent {
  readonly state$: Observable<CountdownState>;

  constructor(private readonly deadlineService: DeadlineService) {
    this.state$ = this.deadlineService.getDeadline().pipe(
      switchMap((response) =>
        interval(1000).pipe(
          map((tick) => ({
            secondsLeft: Math.max(0, response.secondsLeft - tick - 1),
            error: false,
          })),
          takeWhile((state) => state.secondsLeft > 0, true),
          startWith({
            secondsLeft: Math.max(0, response.secondsLeft),
            error: false,
          }),
        ),
      ),
      catchError((err) => {
        console.error("Failed to load deadline:", err);
        return of({ secondsLeft: null, error: true });
      }),
      startWith({ secondsLeft: null, error: false }),
    );
  }
}
