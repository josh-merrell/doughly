import { Injectable, WritableSignal, signal } from '@angular/core';
import {
  Glassfy,
  GlassfyOffering,
  GlassfyOfferings,
} from 'capacitor-plugin-glassfy';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  public offerings: WritableSignal<GlassfyOffering[]> = signal([]);
  constructor() {
    this.initGlassfy();
  }

  async initGlassfy() {
    try {
      await Glassfy.initialize({
        apiKey: environment.GLASSFY_ApiKey,
        watcherMode: false,
      });

      const offerings: GlassfyOfferings = await Glassfy.offerings();
      this.offerings.set(offerings.all);
    } catch (error) {
      console.error('Error initializing Glassfy: ', error);
    }
  }
}
