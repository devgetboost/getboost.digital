import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type BlogCategory = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

export function useBlogCategories() {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from('blog_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    setCategories((data || []) as unknown as BlogCategory[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { categories, loading, refetch: fetch };
}
