export async function onRequest(context) {
  const { request, params } = context;
  const path = params.path ? params.path.join('/') : '';
  const targetUrl = `https://router.huggingface.co/${path}`;

  const headers = new Headers(request.headers);
  headers.set('Host', 'router.huggingface.co');

  const response = await fetch(targetUrl, {
    method: request.method,
    headers: headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
  });

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}