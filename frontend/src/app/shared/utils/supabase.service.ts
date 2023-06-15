// supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {

  public client: SupabaseClient;

  constructor() {
    const SUPABASE_URL = environment.SUPABASE_DOUGHLEAP_URL;
    const SUPABASE_ANON_KEY = environment.SUPABASE_DOUGHLEAP_KEY;
    this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);  }
}