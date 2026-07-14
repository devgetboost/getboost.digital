import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes a URL path to ensure consistency
 * - Lowercase path
 * - Consistent encoding
 * - Strips language prefixes (/en, /es, /pt)
 * - Removes trailing slash (except for root)
 */
export function normalizePath(path: string): string {
  if (!path) return "/";
  
  try {
    // Basic cleaning: lowercase and remove trailing slash
    let cleaned = path.toLowerCase().trim();
    
    // Remove query params and hashes for comparison if needed
    cleaned = cleaned.split('?')[0].split('#')[0];
    
    // Remove language prefixes
    cleaned = cleaned.replace(/^\/(pt|en|es)(\/|$)/, '/');
    
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

