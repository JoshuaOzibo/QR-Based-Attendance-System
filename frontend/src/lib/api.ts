// With Vite proxy, we no longer need the BASE_URL locally for development, 
// but we keep it for production environments
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Ensure endpoint starts with a slash
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${normalizedEndpoint}`;
  
  // Simple LocalStorage token auth
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(url, { ...options, headers });
  
  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = { message: await response.text() };
  }
  
  if (!response.ok) {
    throw new Error(data.message || data.error || 'API request failed');
  }
  
  return data as T;
}
