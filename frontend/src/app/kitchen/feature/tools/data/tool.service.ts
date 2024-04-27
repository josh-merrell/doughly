import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, withLatestFrom } from 'rxjs';
import { Tool } from '../state/tool-state';
import { environment } from 'src/environments/environment';
import { Store } from '@ngrx/store';
import { selectTools } from '../state/tool-selectors';
import { IDService } from 'src/app/shared/utils/ID';
import { selectToolStocks } from '../../Inventory/feature/tool-inventory/state/tool-stock-selectors';

@Injectable({
  providedIn: 'root',
})
export class ToolService {
  private API_URL = `${environment.BACKEND}/tools`;
  public enhancedRows$ = new BehaviorSubject<Tool[]>([]);

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

  addStockTotals(tools: Tool[]): void {
    this.store.select(selectToolStocks).subscribe((toolStocks) => {
      const updatedTools = tools.map((tool) => {
        const matchingStocks = toolStocks.filter(
          (stock: any) => stock.toolID === tool.toolID
        );
        const totalStock = matchingStocks.reduce(
          (sum: number, stock: any) => sum + stock.quantity,
          0
        );

        return {
          ...tool,
          totalStock: totalStock,
        };
      });
      this.enhancedRows$.next(updatedTools);
    });
  }

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

  getTotalInStock(): Observable<number> {
    return this.store.select(selectToolStocks).pipe(
      withLatestFrom(this.rows$),
      map(([toolStocks, tools]) => {
        const inStock = tools.filter((tool) =>
          toolStocks.some((stock: any) => stock.toolID === tool.toolID)
        ).length;

        return inStock;
      })
    );
  }
}
