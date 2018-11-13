let restaurant;
let map;

/**
 * @description Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * @description Get current restaurant from page URL.
 * @param callback
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    let error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * @description Create restaurant HTML and add it to the webpage
 * @param restaurant
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.alt = restaurant.name + ' image';
  image.src = DBHelper.imageUrlForRestaurant(restaurant) + '.jpg';

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  const review = document.getElementById('restaurant_id');
  review.value = restaurant.id;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();

};

/**
 * @description Create restaurant operating hours HTML table and add it to the webpage.
 * @param operatingHours
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * @description Create all reviews HTML and add them to the webpage.
 * @param reviews
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * @description Add recent review to the webpage.
 * @param review
 */
addNewReview = (review) => {
  const ul = document.getElementById('reviews-list');
  ul.appendChild(createReviewHTML(review));
};

/**
 * @description Create review HTML and add it to the webpage.
 * @param review
 * @return {HTMLLIElement}
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const title = document.createElement('ul');
  title.classList.add('review-title');
  li.appendChild(title);

  const name = document.createElement('li');
  name.innerHTML = review.name;
  title.appendChild(name);

  const date = document.createElement('li');
  let dateFormat = new Date(review.createdAt);
  date.innerHTML = dateFormat.getMonth() + '/' + dateFormat.getDate() + '/' + dateFormat.getFullYear();
  title.appendChild(date);

  const content = document.createElement('div');
  content.classList.add('review-content');
  li.appendChild(content);

  const staring = document.createElement('ul');
  staring.className = 'star-rating';

  for (let i=0; i<5; i++){
    const star = document.createElement('li');
    star.className = 'icon-star';
    staring.appendChild(star);
  }

  for (let i=0; i<review.rating; i++){
    staring.children[i].className += ' selected';
  }

  content.appendChild(staring);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  content.appendChild(comments);

  return li;
};

/**
 * @description Add restaurant name to the breadcrumb navigation menu
 * @param restaurant
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.querySelector('#breadcrumb ul');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  const attr = document.createAttribute("aria-current");
  attr.value = "page";
  li.setAttributeNode(attr);
  breadcrumb.appendChild(li);
}

/**
 * @description Get a parameter by name from page URL.
 * @param name
 * @param url
 * @return {*}
 */
getParameterByName = (name, url) => {
  if (!url) url = window.location.href;

  name = name.replace(/[\[\]]/g, '\\$&');

  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
  let results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';

  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

mouseAction = element => {
  element.addEventListener('mouseenter', event => {
    if (event.target.classList.contains('selected')){
      return event.target.classList.remove('selected')
    }
    event.target.className += ' selected';
  })
};

(function () {
  let form = document.getElementById('reviews-form');
  let stars = form.querySelectorAll('li');

  stars.forEach(star => {
    mouseAction(star);
  });

  const submitButton = document.getElementById('submit-review');
  let reviewerName = document.getElementById('name');
  let restaurantID = document.getElementById('restaurant_id');
  let comments = document.getElementById('comments');
  let rating = document.getElementById('rating');
  let review = {};

  // submit review
  submitButton.addEventListener('click', event => {
    review.name = reviewerName.value;
    review.restaurant_id = parseInt(restaurantID.value);
    review.comments = comments.value;
    review.rating = parseInt(rating.options[rating.selectedIndex].value);

    let request = new Request('http://localhost:1337/reviews', {
      method: 'POST',
      body: JSON.stringify(review)
    });

    console.log('Sending transaction');

    fetch(request)
      .then(response => {
        return response.json();
      })
      .then(recentReview => {
        addNewReview(recentReview);

        self.restaurant.reviews.push(recentReview);

        // DBHelper.queryDB()
        //   .set(self.restaurant.id, )
      })
      .catch(error => {
      console.error(error);
    });
  })

})();

