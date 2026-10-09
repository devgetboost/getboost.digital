import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes a URL path to ensure consistency
 * - Lowercase path
 * - Consistent encoding
 * - Collapses the redundant `/pt` prefix (PT is the default and owns the bare path)
 * - Preserves market prefixes (`/br`, `/en`) because they are different content
 * - Removes trailing slash (except for root)
 */
export function normalizePath(path: string): string {
  if (!path) return "/";
  
  try {
    // Basic cleaning: lowercase and remove trailing slash
    let cleaned = path.toLowerCase().trim();
    
    // Remove query params and hashes for comparison if needed
    cleaned = cleaned.split('?')[0].split('#')[0];
    
    // R1C7: market prefixes are meaningful and must survive normalization.
    // `/br/solucoes` and `/solucoes` are different markets, not spellings of the
    // same URL. Stripping them here made every prefixed route redirect back to
    // the bare path and destroyed market targeting. Only the retired `/pt`
    // prefix (PT is the default and owns the bare path) is collapsed.
    cleaned = cleaned.replace(/^\/(pt)(\/|$)/, '/');
    
    // Ensure starts with slash
    if (!cleaned.startsWith('/')) cleaned = `/${cleaned}`;
    
    // Remove trailing slash if not just "/"
    if (cleaned.length > 1 && cleaned.endsWith('/')) {
      cleaned = cleaned.slice(0, -1);
    }
    
    return cleaned || "/";
  } catch (e) {
    return path;
  }
}

