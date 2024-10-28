import NetworkRequestInfo from 'src/NetworkRequestInfo';

export function getWebviewRequest(data: NetworkRequestInfo) {
  const networkInfo = new NetworkRequestInfo(
    data.id,
    data.type,
    data.method,
    data.url
  );
  networkInfo.update(data);
  return networkInfo;
}

export function getWebviewNetworkInterceptor({
  ignoredUrls,
}: {
  ignoredUrls?: string[];
}) {
  const ignoredUrlsString = JSON.stringify(ignoredUrls);
  return `
 (function() {
     let nextXHRId = 0;
 
     function generateId() {
         return 'webview' + (++nextXHRId);
     }
 
     const ignoredUrls = ${ignoredUrlsString};

     function safePostMessage(data) {
       try {
           const url = data.url;
           
           if (ignoredUrls.some(ignoredUrl => url.includes(ignoredUrl))) {
               return;
           }
           
           data.webviewUrl = window.location.href;
           window.ReactNativeWebView.postMessage(JSON.stringify(data));
       } catch (error) {
           console.error('Failed to post message:', error);
       }
     }
 
     const oldFetch = fetch;
     const oldXHR = window.XMLHttpRequest.prototype.open;
 
     // Intercept fetch requests
     window.fetch = async function(input, init) {
         const url = typeof input === 'string' ? input : input.url;
         const method = init?.method || 'GET';
         const headers = init?.headers || {};
         const body = init?.body || '';
 
         const startTime = Date.now();
 
         try {
             const response = await oldFetch(input, init);
             const clonedResponse = response.clone();
             
             const responseBody = await clonedResponse.text();
             const status = response.status;
             const responseHeaders = response.headers;
 
             const endTime = Date.now();
             
             safePostMessage({
                 id: generateId(),
                 type: 'fetch',
                 url,
                 method,
                 status,
                 requestHeaders: headers,
                 responseHeaders: Object.fromEntries(Array.from(responseHeaders.entries())),
                 dataSent: body,
                 response: responseBody,
                 startTime,
                 endTime,
             });
 
             return response;
         } catch (error) {
             const endTime = Date.now();
             console.error('Fetch error:', error);
             
             safePostMessage({
                 id: generateId(),
                 type: 'fetch',
                 url,
                 method,
                 status: 403,
                 requestHeaders: headers,
                 responseHeaders: {},
                 dataSent: body,
                 response: 'Error: ' + error.message,
                 startTime,
                 endTime,
             });
 
             throw error;
         }
     };
 
     // Intercept XMLHttpRequests
     window.XMLHttpRequest.prototype.open = function(method, url) {
         const xhr = this;
         const startTime = Date.now();
 
         xhr.addEventListener('load', function() {
             const endTime = Date.now();
             const responseHeaders = xhr.getAllResponseHeaders();
 
             safePostMessage({
                 id: generateId(),
                 type: 'xhr',
                 url,
                 method,
                 status: xhr.status,
                 requestHeaders: xhr.requestHeaders || {},
                 responseHeaders: Object.fromEntries(responseHeaders.split('\\r\\n').filter(Boolean).map(line => line.split(': '))),
                 dataSent: xhr.dataSent || '',
                 response: xhr.responseText,
                 startTime,
                 endTime,
             });
         });
 
         xhr.addEventListener('error', function() {
             const endTime = Date.now();

             safePostMessage({
                 id: generateId(),
                 type: 'xhr',
                 url,
                 method,
                 status: 403,
                 requestHeaders: xhr.requestHeaders || {},
                 responseHeaders: {},
                 dataSent: xhr.dataSent || '',
                 response: 'XHR Error: Request failed',
                 startTime,
                 endTime,
             });
         });
 
         oldXHR.apply(this, arguments);
     };
 })();
 `;
}
