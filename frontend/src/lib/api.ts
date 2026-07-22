const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

export async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${normalizedEndpoint}`;
  
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
      // Automatic retry once after 2.5 seconds (handles Render free tier cold-start wake up)
      if (!(options as any)?._isRetry) {
        console.warn(`[fetchAPI] Retrying connection to ${url} in 2.5s...`);
        await new Promise((r) => setTimeout(r, 2500));
        return fetchAPI<T>(endpoint, { ...options, _isRetry: true } as any);
      }
      throw new Error(`Unable to connect to backend server (${BASE_URL}). The server may be waking up from sleep — please wait 15 seconds and try again.`);
    }
    throw err;
  }
}
