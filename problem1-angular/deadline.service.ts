import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

export interface DeadlineResponse {
  secondsLeft: number;
}

@Injectable({ providedIn: "root" })
export class DeadlineService {
  private readonly apiUrl = "/api/deadline";

  constructor(private readonly http: HttpClient) {}

  getDeadline(): Observable<DeadlineResponse> {
    // assuming API guarantees a response with correct shape
    return this.http.get<DeadlineResponse>(this.apiUrl);
  }
}
