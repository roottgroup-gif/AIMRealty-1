import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes property image URLs to ensure they point to the correct path
 * Supports both full URLs (from dynamic host) and relative paths
 * @param imageUrl - The image URL to normalize
 * @returns Properly formatted image URL
 */
export function normalizePropertyImageUrl(imageUrl: string): string {
  if (!imageUrl) return '';
  
  // Handle external full URLs (http/https) - return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Handle URLs that already start with / (relative paths)
  if (imageUrl.startsWith('/')) {
    return imageUrl;
  }
  
  // Handle URLs that start with "uploads/" - add leading slash
  if (imageUrl.startsWith('uploads/')) {
    return `/${imageUrl}`;
  }
  
  // Handle bare filenames - add /uploads/ prefix
  return `/uploads/${imageUrl}`;
}
