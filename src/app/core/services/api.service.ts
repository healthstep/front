import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  browserChallenge(): Observable<any> {
    return this.http.post(`${this.base}/auth/browser-challenge`, {});
  }

  getMe(): Observable<any> {
    return this.http.get(`${this.base}/users/me`);
  }

  updateMe(data: any): Observable<any> {
    return this.http.patch(`${this.base}/users/me`, data);
  }

  getCriteria(): Observable<any> {
    return this.http.get(`${this.base}/health/criteria`);
  }

  getLabTests(): Observable<any> {
    return this.http.get(`${this.base}/health/lab-tests`);
  }

  getDashboard(): Observable<any> {
    return this.http.get(`${this.base}/health/dashboard`);
  }

  createNumericEvent(data: any): Observable<any> {
    return this.http.post(`${this.base}/health/events/numeric`, data);
  }

  createBooleanEvent(data: any): Observable<any> {
    return this.http.post(`${this.base}/health/events/boolean`, data);
  }

  createMarkDoneEvent(data: any): Observable<any> {
    return this.http.post(`${this.base}/health/events/mark-done`, data);
  }
}
