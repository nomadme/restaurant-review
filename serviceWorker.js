var cacheID = "restaurant-001";

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(cacheID).then(cache => {
      return cache.addAll([
        // "/",
        // "/index.html"
      ])
      .catch(error => {
        console.log("Cache failed: " + error);
      })
    })
  );
});