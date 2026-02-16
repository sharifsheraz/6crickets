import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface DeadlineResponse {
  secondsLeft: number;
}

@Injectable({ providedIn: "root" })
export class DeadlineService {
  private readonly apiUrl = "/api/deadline";

  constructor(private readonly http: HttpClient) {}

  getDeadline(): Observable<DeadlineResponse> {
    return this.http.get<DeadlineResponse>(this.apiUrl).pipe(
      map((res: DeadlineResponse) => ({
        secondsLeft: Math.max(0, Math.floor(Number(res?.secondsLeft) || 0)),
      })),
    );
  }
}
