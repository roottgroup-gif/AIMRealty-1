import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes property image URLs to ensure they point to the correct path
 * @param imageUrl - The image URL to normalize
 * @returns Properly formatted image URL
 */
export function normalizePropertyImageUrl(imageUrl: string): string {
  // Handle external URLs (http/https)
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // Handle URLs that already start with /
  if (imageUrl.startsWith('/')) {
    return imageUrl;
  }
  
  // Handle URLs that start with "uploads/" - strip and re-add with leading slash
  if (imageUrl.startsWith('uploads/')) {
    return `/${imageUrl}`;
  }
  
  // Handle bare filenames - add /uploads/ prefix
  return `/uploads/${imageUrl}`;
}
