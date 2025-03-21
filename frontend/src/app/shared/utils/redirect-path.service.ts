import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class RedirectPathService {
  private path: string | null = null;

  constructor(private router: Router) {}

  public setPath(path: string): void {
    // don't set if path is '/loading'
    if (path === '/loading') {
      return;
    }
    this.path = path;
  }

  public getPath(): string {
    return this.path || '/recipes/created'; // Default path if none is set
  }

  public clearPath(): void {
    this.path = null;
  }
}
