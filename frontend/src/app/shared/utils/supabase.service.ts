// supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';
export interface ProfileInterface {
  id?: string;
  username: string;
  website: string;
  avatar_url: string;
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  public supabase: SupabaseClient;

  updateProfile(profile: ProfileInterface) {
    const update = {
      ...profile,
      updated_at: new Date(),
    };
  }

  constructor() {
    const SUPABASE_URL = environment.SUPABASE_DOUGHLEAP_URL;
    const SUPABASE_ANON_KEY = environment.SUPABASE_DOUGHLEAP_KEY;
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
}