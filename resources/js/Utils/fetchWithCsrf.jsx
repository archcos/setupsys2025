export async function fetchWithCsrf(url, options = {}) {
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  const headers = {
    'Content-Type': 'application/json',
    'X-CSRF-TOKEN': token,
    ...options.headers,
  };

  return await fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin', // Important for Laravel session cookies
  });
}
