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

  checkAuthKey(key: string): Observable<any> {
    return this.http.get(`${this.base}/auth/check?key=${key}`);
  }

  loginWithPassword(phone: string, password: string): Observable<any> {
    return this.http.post(`${this.base}/auth/login`, { phone, password });
  }

  getMe(): Observable<any> {
    return this.http.get(`${this.base}/users/me`);
  }

  updateMe(data: any): Observable<any> {
    return this.http.patch(`${this.base}/users/me`, data);
  }

  // Groups
  listGroups(): Observable<any> {
    return this.http.get(`${this.base}/health/groups`);
  }

  // Criteria
  listCriteria(): Observable<any> {
    return this.http.get(`${this.base}/health/criteria`);
  }

  getUserCriteria(): Observable<any> {
    return this.http.get(`${this.base}/health/user-criteria`);
  }

  setUserCriterion(criterionId: string, value: string, measuredAt?: string): Observable<any> {
    const body: any = { criterion_id: criterionId, value };
    if (measuredAt) body['measured_at'] = measuredAt;
    return this.http.post(`${this.base}/health/user-criteria`, body);
  }

  resetCriteria(): Observable<any> {
    return this.http.delete(`${this.base}/health/user-criteria`);
  }

  getProgress(): Observable<any> {
    return this.http.get(`${this.base}/health/progress`);
  }

  getWeeklyRecommendations(): Observable<any> {
    return this.http.get(`${this.base}/health/weekly-recommendations`);
  }

  // Admin
  adminListRecommendations(criterionId?: string): Observable<any> {
    const params = criterionId ? `?criterion_id=${criterionId}` : '';
    return this.http.get(`${this.base}/admin/recommendations${params}`);
  }

  adminUpsertRecommendation(rec: any): Observable<any> {
    return this.http.post(`${this.base}/admin/recommendations`, rec);
  }

  adminDeleteRecommendation(id: string): Observable<any> {
    return this.http.delete(`${this.base}/admin/recommendations/${id}`);
  }

  adminUpsertCriterion(criterion: any): Observable<any> {
    return this.http.post(`${this.base}/admin/criteria`, criterion);
  }

  adminListAnalyses(): Observable<any> {
    return this.http.get(`${this.base}/admin/analyses`);
  }

  adminUpsertAnalysis(body: { id?: number; name: string; instruction: string }): Observable<any> {
    return this.http.post(`${this.base}/admin/analyses`, body);
  }

  adminDeleteAnalysis(id: number): Observable<any> {
    return this.http.delete(`${this.base}/admin/analyses/${id}`);
  }

  /** Multipart: form field `files` (PDF), optional `user_sex`. */
  importLabPdfs(files: File[], userSex?: string): Observable<any> {
    const fd = new FormData();
    for (const f of files) {
      fd.append('files', f, f.name);
    }
    if (userSex) {
      fd.append('user_sex', userSex);
    }
    return this.http.post(`${this.base}/health/lab-import`, fd);
  }

  confirmLabImport(pendingId: string, accept: boolean, userSex?: string): Observable<any> {
    return this.http.post(`${this.base}/health/lab-import/confirm`, {
      pending_id: pendingId,
      accept,
      user_sex: userSex || '',
    });
  }
}
