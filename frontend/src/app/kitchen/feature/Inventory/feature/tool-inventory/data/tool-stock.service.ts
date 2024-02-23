import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, combineLatest, map } from 'rxjs';
const dayjs = require('dayjs');

import { environment } from 'src/environments/environment';
import { Store, select } from '@ngrx/store';
import { IDService } from 'src/app/shared/utils/ID';
import { ToolStock, ToolStockRow } from '../state/tool-stock-state';
import { selectToolStocks } from '../state/tool-stock-selectors';
import { selectTools } from 'src/app/kitchen/feature/tools/state/tool-selectors';
import { Tool } from 'src/app/kitchen/feature/tools/state/tool-state';

@Injectable({
  providedIn: 'root',
})
export class ToolStockService {
  private API_URL = `${environment.BACKEND}/toolStocks`;

  constructor(
    private http: HttpClient,
    private store: Store,
    private idService: IDService
  ) {}

  rows$: Observable<ToolStockRow[]> = combineLatest([
    this.store.pipe(select(selectToolStocks)),
    this.store.pipe(select(selectTools)),
  ]).pipe(
    map(([toolStocks, tools]: [ToolStock[], Tool[]]) => {
      return toolStocks.map((stock) => {
        const tool = tools.find((i) => i.toolID === stock.toolID);
        if (!tool) {
          return {
            toolStockID: 0,
            name: `ToolID:${stock.toolID} missing, can't get details for ToolStockID:${stock.toolStockID}`,
            brand: 'Unknown',
            quantity: 'Unknown',
          };
        }
        const quantity = `${stock.quantity}`;
        return {
          toolStockID: stock.toolStockID,
          name: tool.name,
          brand: tool.brand,
          quantity: quantity,
        };
      });
    })
  );

  getAll(): Observable<ToolStock[]> {
    return this.http.get<ToolStock[]>(this.API_URL);
  }

  getByID(toolStockID: number): Observable<ToolStock> {
    return this.http.get<ToolStock>(`${this.API_URL}/${toolStockID}`);
  }

  add(toolStock: ToolStock): Observable<ToolStock> {
    // copy toolStock object into new 'body' object, then add IDtype to it
    const IDtype = this.idService.getIDtype('toolStock');
    toolStock = {
      IDtype,
      ...toolStock,
    };
    return this.http.post<ToolStock>(this.API_URL, toolStock);
  }

  update(toolStock: ToolStock): Observable<ToolStock> {
    return this.http.patch<ToolStock>(
      `${this.API_URL}/${toolStock.toolStockID}`,
      toolStock
    );
  }

  delete(toolStockID: number): Observable<ToolStock> {
    return this.http.delete<ToolStock>(
      `${this.API_URL}/${toolStockID}`
    );
  }
}
