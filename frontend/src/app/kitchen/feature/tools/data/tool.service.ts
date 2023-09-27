import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Tool } from '../state/tool-state';
import { environment } from 'src/environments/environment';
import { Store } from '@ngrx/store';
import { selectTools } from '../state/tool-selectors';
import { IDService } from 'src/app/shared/utils/ID';

@Injectable({
  providedIn: 'root',
})
export class ToolService {
  private API_URL = `${environment.BACKEND}/tools`;

  constructor(
    private http: HttpClient,
    private store: Store,
    private idService: IDService
  ) {}

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
    const body = {
      IDtype: this.idService.getIDtype('tool'),
      name: tool.name,
      brand: tool.brand,
    };
    return this.http.post<Tool>(this.API_URL, body);
  }

  delete(toolID: number): Observable<Tool> {
    return this.http.delete<Tool>(`${this.API_URL}/${toolID}`);
  }

  update(tool: Tool): Observable<Tool> {
    return this.http.patch<Tool>(`${this.API_URL}/${tool.toolID}`, tool);
  }
}
