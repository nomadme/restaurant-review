importScripts('/js/idb.js');

const version = '0.2.3';
let cacheName = `restaurant-v${version}`;
let assetCache = 'restaurant-image-cache';

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(cacheName)
      .then(cache => {
        return cache.addAll([
          "/",
          "/restaurant.html",
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

  // skip review url
  if (requestUrl.pathname.startsWith('/reviews/') || requestUrl.pathname.startsWith('/restaurants')){
    return;
  }

  if (requestUrl.pathname.startsWith('/img/')){
    event.respondWith(imageCache(event.request));
    return;
  }

  if (event.request.method === 'POST'){
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

// when go live, process the data queue
self.addEventListener('sync', event => {
  if (event.tag === 'outbox') {
    event.waitUntil(
      // process all the data
      idb.open('restaurant-outbox')
        .then(db => {
          return db.transaction('outbox').objectStore('outbox').getAll();
        })
        .then(data => {
          return  Promise.all(data.map(item => {
            return fetch(`http://localhost:1337/restaurants/${item.restaurantId}/`, {
              method: 'POST',
              body: JSON.stringify(item)
            })
              .then(res => {
                return res.json();
              })
              .then(res => {
                idb.open('restaurant-outbox').then(db => {
                  const database = db.transaction('outbox', "readwrite");
                  database.objectStore('outbox').delete(item.id);
                  return database.complete;
                })
              })
              .catch(err => {
                console.log('Got problem on fetching data while after sync: ', err);
              })
          }))
        })
        .catch(err => {
          console.error('Having some problem when opening db: ', err);
        })
    );
  }
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
