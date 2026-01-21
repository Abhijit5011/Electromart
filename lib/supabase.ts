
import { createClient } from '@supabase/supabase-js';

// These are placeholders. In a real environment, the actual Supabase project
// would be used. For this generator, we assume the environment provides them.
const supabaseUrl = 'https://uzjaomdsjuirpbduikbz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6amFvbWRzanVpcnBiZHVpa2J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NjIxNjcsImV4cCI6MjA4NDQzODE2N30.UTHEk5vyUtdZbH1LUIe9JjrDcYebAU1QUMYGsA-Y_kw';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper for image URLs from storage
export const getImageUrl = (path: string) => {
  if (path.startsWith('http')) return path;
  return `${supabaseUrl}/storage/v1/object/public/products/${path}`;
};
