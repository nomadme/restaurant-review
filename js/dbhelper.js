/**
 * Common database helper functions.
 */
class DBHelper {

  static getPort() {
    return 1337; // Change this to your server port;
  }
  /**
   * Database URL.
   */
  static get DATABASE_URL() {
    return `http://localhost:${this.getPort()}/restaurants`;
  }

  static get REVIEW_URL() {
    return `http://localhost:${this.getPort()}/reviews`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback, id) {
    let fetchURL;

    if (!id) {
      fetchURL = DBHelper.DATABASE_URL;
    } else {
      fetchURL = DBHelper.DATABASE_URL + '/' + id;
    }

    if (!navigator.onLine)
    {
      console.log('Application is offline, loading local data...');
      DBHelper.queryDB().getAll()
        .then(allObjs => {
          return allObjs;
        })
    }

    fetch(fetchURL, {method: 'GET'})
      .then(response => {
        return response.json();
      })
      .then(res => {
          // save all data to db
          res.forEach(function (data) {
            DBHelper.fetchReviews(null, data.id)
              .then(reviews => {
                const restaurant = data;
                restaurant.reviews = reviews;
                DBHelper.queryDB().set(data.id, restaurant);
              })
          });
        return res;
      })
      .then(res => {
        callback(null, res);
      })
      .catch(err => {
        const error = (`Request failed. Returned status of ${err.status}`);
        callback(error, null);
      });
  }

  /*
   * Fetch all reviews
   */
  static fetchReviews(reviewID, restaurantID){
    let fetchURL;
    if (!reviewID && !restaurantID){
      fetchURL = this.REVIEW_URL;
    } else if (reviewID && !restaurantID) {
      fetchURL = this.REVIEW_URL + '/' + reviewID;
    } else if (!reviewID) {
      fetchURL = this.REVIEW_URL + '/?restaurant_id=' + restaurantID
    }

    return fetch(fetchURL, {method: 'GET'})
      .then(response => {

        if (response.ok) {
         return response.json();
        }
        return Promise.reject('We failed to get reviews');
      })
      .catch(err => {
        console.log('Request failed at ' + fetchURL)
      })
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    if (navigator.onLine){
      fetch(this.DATABASE_URL + '/' + id)
        .then(response => {
          return response.json();
        })
        .catch(error => {
          console.error(error);
          return;
        });
    }

    return this.queryDB().get(parseInt(id))
      .then(restaurant => {
        if (!restaurant){
          callback('Restaurant does not exist', null);
        }
        callback(null, restaurant);
      })
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.id}`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

  /**
   * @description Handle IndexDB
   * @type {Promise<DB>}
   */
  static startDB() {
    const dbPromise = idb.open('restaurants-data', 1, upgradeDB => {
      upgradeDB.createObjectStore('restaurants');
    });

    return dbPromise;
  }

  static queryDB(){
    const database = {
      getAll() {
        return DBHelper.startDB().then(db => {
          return db.transaction('restaurants')
            .objectStore('restaurants').getAll();
        })
      },
      get(key) {
        return DBHelper.startDB().then(db => {
          return db.transaction('restaurants')
            .objectStore('restaurants').get(key);
        });
      },
      set(key, val) {
        return DBHelper.startDB().then(db => {
          const tx = db.transaction('restaurants', 'readwrite');
          tx.objectStore('restaurants').put(val, key);
          return tx.complete;
        });
      },
      delete(key) {
        return DBHelper.startDB().then(db => {
          const tx = db.transaction('restaurants', 'readwrite');
          tx.objectStore('restaurants').delete(key);
          return tx.complete;
        });
      },
      clear() {
        return DBHelper.startDB().then(db => {
          const tx = db.transaction('restaurants', 'readwrite');
          tx.objectStore('restaurants').clear();
          return tx.complete;
        });
      },
      keys() {
        return DBHelper.startDB().then(db => {
          const tx = db.transaction('restaurants');
          const keys = [];
          const store = tx.objectStore('restaurants');

          // This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
          // openKeyCursor isn't supported by Safari, so we fall back
          (store.iterateKeyCursor || store.iterateCursor).call(store, cursor => {
            if (!cursor) return;
            keys.push(cursor.key);
            cursor.continue();
          });

          return tx.complete.then(() => keys);
        });
      }
    };

    return database;
  }

}
