const version = '0.2.0';
let cacheName = `restaurant-v${version}`;
let assetCache = 'restaurant-image-cache';

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(cacheName)
      .then(cache => {
        return cache.addAll([
          "/",
          "/restaurant.html",
          "/restaurants",
          "/css/styles.css",
          "/js/idb.js",
          "/js/dbhelper.js",
          "/js/main.js",
          "/js/restaurant_info.js",
          "/manifest.json",
          "/sw.js"
        ])
      .catch(error => {
          console.log("Cache failed: " + error);
      })
    })
  );
});

self.addEventListener('fetch', event => {
  let requestUrl = new URL(event.request.url);

  if (requestUrl.pathname.startsWith('/img/')){
    event.respondWith(imageCache(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response =>{
      return response || fetch(event.request)
        .then(fetchRes => {
          return caches.open(cacheName)
            .then(cache => {
              cache.put(event.request, fetchRes.clone());
              return fetchRes;
            });
        })
        .catch(error => {
          if (requestUrl.pathname.startsWith('/img/')){
            return caches.match('/img/na.png');
          }
          return new Response('No internet connection',{
            status: 404,
            statusText: "No internet."
          });
        });
    })
  );
});

// cache images
imageCache = (request) => {
  let imageUrl = request.url.replace(/_\dx.jpg$/, '');

  // return images from the "assetCache" cache if they
  // are in there. If not fetch from the cache.
  return caches.open(assetCache).then(cache => {
    return cache.match(imageUrl).then(response => {
      if (response) return response;
      return fetch(request).then(networkResponse => {
        // send copy of the response to the cache.
        cache.put(imageUrl, networkResponse.clone());
        return networkResponse;
      });
    })
  })
};
