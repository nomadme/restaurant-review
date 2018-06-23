var cacheID = "restaurant-v1";
var staticCache = 'restaurant-static-cache';
var assetCache = 'restaurant-image-cache';
var allCaches = [staticCache, assetCache];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(cacheID).then(cache => {
      return cache.addAll([
        "/",
        "index.html",
        "restaurant.html",
        "css/styles.css",
        "data/restaurants.json",
        "js/",
        "js/dbhelper.js",
        "js/main.js",
        "js/restaurant_info.js",
        "js/register.js"
      ])
      .catch(error => {
        console.log("Cache failed: " + error);
      })
    })
  );
});

// cache images
imageCache = (request) => {
    var imageUrl = request.url.replace(/_\dx.jpg$/, '');

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
}

restaurantCache = (request) => {
    var restaurantID = request.url;

    return fetch(request);
}

self.addEventListener("fetch", event => {
    let cacheRequest = event.request;
    let requestUrl = new URL(event.request.url);


    // TODO: Get individual restaurants cache;
    // if (event.request.url.includes("restaurant.html")){
        // let restaurantID = event.request.url.match('/id.+/');

        // event.respondWith(restaurantCache(event.request));
        // return;
    // }

    if (requestUrl.origin === location.origin){
        if (requestUrl.pathname === '/'){

        }

        if (requestUrl.pathname.startsWith('/img/')){
            event.respondWith(imageCache(event.request));
            return;
        }
    }

    event.respondWith(
        caches.match(event.request).then(response => {
            if (response) return response;
            return fetch(event.request); // return the original request if the match doesn't found.
        }).catch(error => {
            return new Response('We are failed to load it from cache!')
        })
    )
})
