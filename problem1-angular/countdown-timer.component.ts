import { Component, ChangeDetectionStrategy } from "@angular/core";
import { Observable, timer, of } from "rxjs";
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
    const loading: CountdownState = { secondsLeft: null, error: false };
    const error: CountdownState = { secondsLeft: null, error: true };

    this.state$ = this.deadlineService.getDeadline().pipe(
      switchMap((response) => {
        const deadlineMs = Date.now() + response.secondsLeft * 1000;
        return timer(0, 1000).pipe(
          map(() => ({
            secondsLeft: Math.max(
              0,
              Math.round((deadlineMs - Date.now()) / 1000),
            ),
            error: false,
          })),
          takeWhile((s) => s.secondsLeft > 0, true),
        );
      }),
      catchError((err) => {
        console.error("Failed to load deadline:", err);
        return of(error);
      }),
      startWith(loading),
    );
  }
}
