export function sanitizeInput(input: string): string {
    // Remove potential HTML/script tags
    return input
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: URLs
        .replace(/onerror=/gi, '')
        .replace(/onload=/gi, '')
        .trim();
}