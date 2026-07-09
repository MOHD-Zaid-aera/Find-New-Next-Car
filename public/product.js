const productContent = document.getElementById('productContent');

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function getCarWaleUrl(car) {
  if (car.carWaleUrl) {
    return car.carWaleUrl;
  }
  const searchTerm = `${car.brand} ${car.model}`.trim();
  return `https://www.carwale.com/search?q=${encodeURIComponent(searchTerm)}`;
}

function renderOfferCards(car) {
  const offers = car.offers || [
    { platform: 'Official Website', price: car.price, url: car.buyUrl },
    { platform: 'CarWale', price: car.price, url: getCarWaleUrl(car) }
  ];

  return offers.map(offer => `
    <div class="offer-card">
      <div class="offer-card-header">
        <span class="offer-platform">${offer.platform}</span>
        <span class="offer-price">${offer.price}</span>
      </div>
      <a class="btn btn-primary btn-offer" href="${offer.url}" target="_blank" rel="noopener noreferrer">Buy on ${offer.platform}</a>
    </div>
  `).join('');
}

function createDetailView(car, ratings) {
  const rangeLine = car.fuelType === 'Electric' ? `Range: ${car.range}` : `Mileage: ${car.mileage}`;
  const chargeLine = car.fuelType === 'Electric' ? `<div class="spec-item"><strong>Charging:</strong> ${car.chargingTime}</div>` : '';
  const tankLine = car.fuelType === 'Electric' ? `<p><strong>Battery Capacity:</strong> ${car.batteryCapacity || 'N/A'}</p>` : `<p><strong>Fuel Tank:</strong> ${car.fuelTankCapacity || 'N/A'}</p>`;
  const carRatings = ratings.filter(r => Number(r.carId) === Number(car.id));
  const averageRating = carRatings.length
    ? (carRatings.reduce((sum, item) => sum + item.score, 0) / carRatings.length).toFixed(1)
    : car.rating;
  const reviewList = carRatings.length
    ? carRatings.map(item => `
        <div class="review-item">
          <strong>${'★'.repeat(item.score)}${'☆'.repeat(5 - item.score)}</strong>
          <p>${item.comment || 'No comment provided.'}</p>
        </div>
      `).join('')
    : '<p class="review-empty">No ratings yet. Be the first to rate this car.</p>';

  return `
    <section class="product-main">
      <div class="product-image">
        <img src="${car.imageUrl}" alt="${car.brand} ${car.model}" onerror="this.onerror=null;this.src='images/car-placeholder.svg'" />
      </div>
      <div class="product-summary">
        <div>
          <p class="eyebrow">${car.brand}</p>
          <h2>${car.brand} ${car.model}</h2>
          <p>${car.description}</p>
        </div>
        <div class="product-meta">
          <div>
            <p><strong>Price:</strong> ${car.price}</p>
            <p><strong>${rangeLine}</strong></p>
            <p><strong>Engine:</strong> ${car.cc || 'N/A'}</p>
            ${tankLine}
            <p><strong>Seats:</strong> ${car.seats}</p>
            <p><strong>Fuel type:</strong> ${car.fuelType}</p>
          </div>
          <div class="detail-specs">
            <div class="spec-item"><strong>Transmission:</strong> ${car.transmission}</div>
            <div class="spec-item"><strong>Rating:</strong> ${car.rating} / 5</div>
            ${chargeLine}
          </div>
        </div>
        <div>
          <h3>Pricing offers</h3>
          <div class="offer-grid">
            ${renderOfferCards(car)}
          </div>
        </div>
        <div class="rating-panel">
          <h3>Rate this car</h3>
          <div class="star-rating" data-car-id="${car.id}">
            <button class="star-btn" data-score="1">★</button>
            <button class="star-btn" data-score="2">★</button>
            <button class="star-btn" data-score="3">★</button>
            <button class="star-btn" data-score="4">★</button>
            <button class="star-btn" data-score="5">★</button>
          </div>
          <textarea id="ratingComment" rows="3" placeholder="Share your experience"></textarea>
          <button id="submitRating" class="btn btn-secondary">Submit Rating</button>
          <p id="ratingStatus" class="contact-status"></p>
        </div>
        <div class="rating-summary">
          <h3>Customer Ratings</h3>
          <p><strong>${averageRating} / 5</strong> based on ${carRatings.length} review${carRatings.length === 1 ? '' : 's'}</p>
          <div class="review-list">${reviewList}</div>
        </div>
      </div>
    </section>
  `;
}

async function loadProduct() {
  const id = getQueryParam('id');
  if (!id) {
    productContent.innerHTML = '<p>Car not found. Please go back to the home page.</p>';
    return;
  }

  try {
    const [carsResponse, ratingsResponse] = await Promise.all([
      fetch('/api/cars'),
      fetch('/api/ratings')
    ]);
    const cars = await carsResponse.json();
    const ratings = await ratingsResponse.json();
    const car = cars.find(item => String(item.id) === id);

    if (!car) {
      productContent.innerHTML = '<p>Car not found. Please go back to the home page.</p>';
      return;
    }

    productContent.innerHTML = createDetailView(car, ratings);
    bindRatingEvents(car.id);
  } catch (error) {
    productContent.innerHTML = '<p>Unable to load car details right now. Please try again later.</p>';
    console.error('Failed to load product:', error);
  }
}

function bindRatingEvents(carId) {
  const stars = Array.from(document.querySelectorAll('.star-btn'));
  const submitButton = document.getElementById('submitRating');
  const commentBox = document.getElementById('ratingComment');
  const status = document.getElementById('ratingStatus');
  let selectedScore = 0;

  stars.forEach(star => {
    star.addEventListener('click', () => {
      selectedScore = Number(star.dataset.score);
      stars.forEach(item => item.classList.remove('active'));
      stars.slice(0, selectedScore).forEach(item => item.classList.add('active'));
    });
  });

  submitButton?.addEventListener('click', async () => {
    if (!selectedScore) {
      status.textContent = 'Please choose a star rating.';
      status.style.color = '#dc2626';
      return;
    }

    status.textContent = 'Submitting...';
    status.style.color = '#111827';

    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carId, score: selectedScore, comment: commentBox.value })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to save rating');

      status.textContent = 'Thank you! Your rating has been added.';
      status.style.color = '#16a34a';
      commentBox.value = '';
      selectedScore = 0;
      stars.forEach(item => item.classList.remove('active'));
      loadProduct();
    } catch (error) {
      status.textContent = 'Unable to save your rating.';
      status.style.color = '#dc2626';
      console.error(error);
    }
  });
}

loadProduct();
