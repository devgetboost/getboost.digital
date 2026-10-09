import { useState, useEffect, useCallback } from 'react';
import { listCategories, type CategoryLocalizationRow, type CategoryRow } from '@/lib/adminContent';

/**
 * R1C8 — content categories for the admin surfaces.
 *
 * Reads the Clean V1 `content_categories` + `content_category_localizations`
 * tables. The retired `blog_categories` table (keyless name/slug rows) is gone
 * from the admin; category identity is now the stable `key`, and the display
 * name comes from the PT localization, falling back to any available one.
 */
export type BlogCategory = {
  id: string;
  key: string;
  name: string;
  slug: string;
  sort_order: number;
};

const preferredLocalization = (
  localizations: CategoryLocalizationRow[],
): CategoryLocalizationRow | null => {
  if (localizations.length === 0) return null;
  return (
    localizations.find((l) => l.market === 'PT') ??
    localizations.find((l) => l.market === 'BR') ??
    localizations.find((l) => l.market === 'INTL') ??
    localizations[0]
  );
};

export function toBlogCategory(
  category: CategoryRow,
  localizations: CategoryLocalizationRow[],
): BlogCategory {
  const loc = preferredLocalization(localizations);
  return {
    id: category.id,
    key: category.key,
    name: loc?.name ?? category.key,
    slug: loc?.slug ?? category.key,
    sort_order: category.sort_order,
  };
}

export function useBlogCategories() {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const rows = await listCategories();
      setCategories(rows.map((r) => toBlogCategory(r.category, r.localizations)));
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { categories, loading, refetch: fetch };
}
