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

  listAnalysis(): Observable<any> {
    return this.http.get(`${this.base}/health/analysis`);
  }

  listCriteria(analysisId?: string): Observable<any> {
    const params = analysisId ? `?analysis_id=${analysisId}` : '';
    return this.http.get(`${this.base}/health/criteria${params}`);
  }

  getUserCriteria(): Observable<any> {
    return this.http.get(`${this.base}/health/user-criteria`);
  }

  setUserCriterion(criterionId: string, value: string): Observable<any> {
    return this.http.post(`${this.base}/health/user-criteria`, {
      criterion_id: criterionId,
      value,
    });
  }

  getProgress(): Observable<any> {
    return this.http.get(`${this.base}/health/progress`);
  }

  getRecommendations(): Observable<any> {
    return this.http.get(`${this.base}/health/recommendations`);
  }
}
