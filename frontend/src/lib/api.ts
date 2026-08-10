const PRODUCTION_FALLBACK = 'https://qr-based-attendance-system-n65r.onrender.com';

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? PRODUCTION_FALLBACK : '')
).replace(/\/+$/, '');

export async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${normalizedEndpoint}`;
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  try {
    const response = await fetch(url, { ...options, headers });
    
    let data;
    try {
      data = await response.json();
    } catch (err) {
      data = { message: await response.text() };
    }
    
    if (!response.ok) {
      throw new Error(data.message || data.error || `API request failed (${response.status})`);
    }
    
    return data as T;
  } catch (err: any) {
    console.error(`[fetchAPI Error] URL: ${url}`, err);
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      const retryCount = (options as any)?._retryCount || 0;
      if (retryCount < 5) {
        const delay = Math.min(10000, (retryCount + 1) * 3000);
        console.warn(`[fetchAPI] Backend connection offline or waking up. Retrying (${retryCount + 1}/5) in ${delay / 1000}s...`);
        await new Promise((r) => setTimeout(r, delay));
        return fetchAPI<T>(endpoint, { ...options, _retryCount: retryCount + 1 } as any);
      }
      throw new Error(`Unable to connect to backend. Render free-tier server is waking up from sleep — please wait a few seconds and try again.`);
    }
    throw err;
  }
}
