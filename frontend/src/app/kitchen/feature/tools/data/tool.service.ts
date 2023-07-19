import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Tool } from '../state/tool-state';
import { environment } from 'src/environments/environment';
import { Store } from '@ngrx/store';
import { selectTools } from '../state/tool-selectors';

@Injectable({
  providedIn: 'root',
})
export class ToolService {
  private API_URL = `${environment.BACKEND}/tools`;

  constructor(private http: HttpClient, private store: Store) {}

  rows$: Observable<Tool[]> = this.store.select(selectTools).pipe(
    map((tools: Tool[]) => {
      return tools.map((tool: Tool) => {
        return {
          toolID: tool.toolID,
          name: tool.name,
          brand: tool.brand,
        };
      });
    })
  );

  getAll(): Observable<Tool[]> {
    return this.http.get<Tool[]>(this.API_URL);
  }

  getByID(toolID: number): Observable<Tool> {
    return this.http.get<Tool>(`${this.API_URL}/${toolID}`);
  }

  add(tool: Tool): Observable<Tool> {
    return this.http.post<Tool>(this.API_URL, tool);
  }

  delete(toolID: number): Observable<Tool> {
    return this.http.delete<Tool>(`${this.API_URL}/${toolID}`);
  }

  update(tool: Tool): Observable<Tool> {
    return this.http.patch<Tool>(
      `${this.API_URL}/${tool.toolID}`,
      tool
    );
  }
}
