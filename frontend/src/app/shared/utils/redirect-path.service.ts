import { Injectable, WritableSignal, signal } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class RedirectPathService {
  private defaultPath = '/recipes/created';
  private path: WritableSignal<string> = signal('');
  private targetModal: WritableSignal<string> = signal('');
  public sharedUrl: WritableSignal<string> = signal('');

  constructor(private router: Router) {}

  public setPath(path: string): void {
    // don't set if path is '/loading'
    if (path === '/loading') {
      return;
    }
    console.log(`RedirectPathService: Setting path to ${path}`);
    this.path.set(path);
  }

  public setTargetModal(targetModal: string): void {
    console.log(`RedirectPathService: Setting target modal to ${targetModal}`);
    this.targetModal.set(targetModal);
  }

  public getTargetModal(): string {
    return this.targetModal();
  }

  public getPath(): string {
    const result = this.path() || this.defaultPath; // Default path if none is set
    this.path.set(this.defaultPath);
    return result; // Default path if none is set
  }

  public resetPath(): void {
    console.log('RedirectPathService: Resetting path');
    this.path.set(this.defaultPath);
    this.targetModal.set('');
  }
}
