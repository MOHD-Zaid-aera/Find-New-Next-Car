const productContent = document.getElementById('productContent');

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function getCarWaleUrl(car) {
  if (car.carWaleUrl) return car.carWaleUrl;
  return 'https://www.carwale.com/search?q=' + encodeURIComponent(car.brand + ' ' + car.model);
}

function renderOfferCards(car) {
  const offers = car.offers || [
    { platform: 'Official Website', price: car.price, url: car.buyUrl },
    { platform: 'CarWale', price: car.price, url: getCarWaleUrl(car) }
  ];
  return offers.map(o =>
    '<div class="offer-card">' +
      '<div class="offer-card-header">' +
        '<span class="offer-platform">' + o.platform + '</span>' +
        '<span class="offer-price">' + o.price + '</span>' +
      '</div>' +
      '<a class="btn btn-primary btn-offer" href="' + o.url + '" target="_blank" rel="noopener noreferrer">Buy on ' + o.platform + '</a>' +
    '</div>'
  ).join('');
}

function createDetailView(car, ratings) {
  const rangeLine = car.fuelType === 'Electric' ? 'Range: ' + car.range : 'Mileage: ' + car.mileage;
  const chargeLine = car.fuelType === 'Electric'
    ? '<div class="spec-item"><strong>Charging:</strong> ' + car.chargingTime + '</div>' : '';
  const tankLine = car.fuelType === 'Electric'
    ? '<p><strong>Battery Capacity:</strong> ' + (car.batteryCapacity || 'N/A') + '</p>'
    : '<p><strong>Fuel Tank:</strong> ' + (car.fuelTankCapacity || 'N/A') + '</p>';

  const carRatings = ratings.filter(r => Number(r.carId) === Number(car.id));
  const avg = carRatings.length
    ? (carRatings.reduce((s, i) => s + i.score, 0) / carRatings.length).toFixed(1)
    : car.rating;
  const reviewList = carRatings.length
    ? carRatings.map(item =>
        '<div class="review-item">' +
          '<strong>' + '★'.repeat(item.score) + '☆'.repeat(5 - item.score) + '</strong>' +
          '<p>' + (item.comment || 'No comment provided.') + '</p>' +
        '</div>'
      ).join('')
    : '<p class="review-empty">No ratings yet. Be the first to rate this car.</p>';

  return '<section class="product-main">' +
    '<div class="product-image">' +
      '<img src="' + car.imageUrl + '" alt="' + car.brand + ' ' + car.model + '" onerror="this.onerror=null;this.src=\'images/car-placeholder.svg\'" />' +
    '</div>' +
    '<div class="product-summary">' +
      '<div>' +
        '<p class="eyebrow">' + car.brand + '</p>' +
        '<h2>' + car.brand + ' ' + car.model + '</h2>' +
        '<p>' + car.description + '</p>' +
      '</div>' +
      '<div class="product-meta">' +
        '<div>' +
          '<p><strong>Price:</strong> ' + car.price + '</p>' +
          '<p><strong>' + rangeLine + '</strong></p>' +
          '<p><strong>Engine:</strong> ' + (car.cc || 'N/A') + '</p>' +
          tankLine +
          '<p><strong>Seats:</strong> ' + car.seats + '</p>' +
          '<p><strong>Fuel type:</strong> ' + car.fuelType + '</p>' +
        '</div>' +
        '<div class="detail-specs">' +
          '<div class="spec-item"><strong>Transmission:</strong> ' + car.transmission + '</div>' +
          '<div class="spec-item"><strong>Rating:</strong> ' + car.rating + ' / 5</div>' +
          chargeLine +
        '</div>' +
      '</div>' +
      '<div>' +
        '<h3>Pricing offers</h3>' +
        '<div class="offer-grid">' + renderOfferCards(car) + '</div>' +
      '</div>' +
      '<div class="rating-panel">' +
        '<h3>Rate this car</h3>' +
        '<div class="star-rating" data-car-id="' + car.id + '">' +
          '<button class="star-btn" data-score="1">★</button>' +
          '<button class="star-btn" data-score="2">★</button>' +
          '<button class="star-btn" data-score="3">★</button>' +
          '<button class="star-btn" data-score="4">★</button>' +
          '<button class="star-btn" data-score="5">★</button>' +
        '</div>' +
        '<textarea id="ratingComment" rows="3" placeholder="Share your experience"></textarea>' +
        '<button id="submitRating" class="btn btn-secondary">Submit Rating</button>' +
        '<p id="ratingStatus" class="contact-status"></p>' +
      '</div>' +
      '<div class="rating-summary">' +
        '<h3>Customer Ratings</h3>' +
        '<p><strong>' + avg + ' / 5</strong> based on ' + carRatings.length + ' review' + (carRatings.length === 1 ? '' : 's') + '</p>' +
        '<div class="review-list">' + reviewList + '</div>' +
      '</div>' +
    '</div>' +
  '</section>';
}

/* ─── HORIZONTAL RECOMMENDATION CAROUSEL ─── */
function createRecommendationGrid(currentCar, allCars) {
  const others = allCars.filter(c => String(c.id) !== String(currentCar.id));
  const same = others.filter(c => c.segment === currentCar.segment || c.brand === currentCar.brand);
  const diff = others.filter(c => c.segment !== currentCar.segment && c.brand !== currentCar.brand);
  const picks = [...same.slice(0, 4), ...diff].slice(0, 10);
  if (!picks.length) return '';

  const cards = picks.map((c, i) => {
    const metaLine = c.fuelType === 'Electric'
      ? 'Range: ' + (c.range || 'N/A')
      : 'Mileage: ' + (c.mileage || 'N/A');
    const isSim = c.segment === currentCar.segment || c.brand === currentCar.brand;
    const badge = isSim
      ? '<span class="rec-badge rec-badge--same">Similar</span>'
      : '<span class="rec-badge rec-badge--diff">Explore</span>';

    return '<div class="rec-card" data-car-id="' + c.id + '" data-delay="' + (i * 70) + '" tabindex="0" role="button" aria-label="View ' + c.brand + ' ' + c.model + '">' +
      '<div class="rec-img-wrap">' +
        '<img src="' + c.imageUrl + '" alt="' + c.brand + ' ' + c.model + '" onerror="this.onerror=null;this.src=\'images/car-placeholder.svg\'" loading="lazy" />' +
        badge +
      '</div>' +
      '<div class="rec-body">' +
        '<p class="rec-brand">' + c.brand + '</p>' +
        '<h4 class="rec-name">' + c.brand + ' ' + c.model + '</h4>' +
        '<div class="rec-specs">' +
          '<span class="rec-spec">⛽ ' + c.fuelType + '</span>' +
          '<span class="rec-spec">🪑 ' + c.seats + ' Seats</span>' +
          '<span class="rec-spec">📍 ' + metaLine + '</span>' +
          '<span class="rec-spec">⭐ ' + c.rating + '</span>' +
        '</div>' +
        '<div class="rec-footer">' +
          '<span class="rec-price">' + c.price + '</span>' +
          '<span class="rec-arrow">View →</span>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');

  return '<section class="rec-section">' +
    '<div class="rec-header">' +
      '<div class="rec-title-row">' +
        '<div>' +
          '<p class="rec-eyebrow">You might also like</p>' +
          '<h3 class="rec-title">Recommended Cars</h3>' +
        '</div>' +
        '<div class="rec-nav">' +
          '<button class="rec-btn rec-prev" id="recPrev" aria-label="Scroll left">&#8592;</button>' +
          '<button class="rec-btn rec-next" id="recNext" aria-label="Scroll right">&#8594;</button>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="rec-track-wrap">' +
      '<div class="rec-track" id="recTrack">' + cards + '</div>' +
    '</div>' +
  '</section>';
}

function bindRecommendationEvents() {
  const track = document.getElementById('recTrack');
  const prevBtn = document.getElementById('recPrev');
  const nextBtn = document.getElementById('recNext');
  if (!track) return;

  /* Staggered reveal */
  track.querySelectorAll('.rec-card').forEach(card => {
    const delay = parseInt(card.getAttribute('data-delay')) || 0;
    setTimeout(() => card.classList.add('rec-visible'), delay);
  });

  /* Scroll amount = card width + gap */
  const scrollBy = () => {
    const card = track.querySelector('.rec-card');
    return card ? card.offsetWidth + 16 : 280;
  };

  if (prevBtn) prevBtn.addEventListener('click', () => {
    track.scrollBy({ left: -scrollBy() * 2, behavior: 'smooth' });
  });
  if (nextBtn) nextBtn.addEventListener('click', () => {
    track.scrollBy({ left: scrollBy() * 2, behavior: 'smooth' });
  });

  /* Update arrow disabled state */
  function updateArrows() {
    if (!prevBtn || !nextBtn) return;
    prevBtn.disabled = track.scrollLeft <= 0;
    nextBtn.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
  }
  track.addEventListener('scroll', updateArrows, { passive: true });
  updateArrows();

  /* Click to navigate */
  track.addEventListener('click', navigateToRecommendation);
  track.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigateToRecommendation(e); }
  });
}

function navigateToRecommendation(e) {
  const card = e.target.closest('[data-car-id]');
  if (!card) return;
  const id = card.getAttribute('data-car-id');
  const main = document.querySelector('main');
  if (main) {
    main.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
    main.style.opacity = '0';
    main.style.transform = 'translateY(14px)';
  }
  setTimeout(() => { window.location.href = 'product.html?id=' + id; }, 360);
}

/* ─── LOAD ─── */
async function loadProduct() {
  const id = getQueryParam('id');
  if (!id) { productContent.innerHTML = '<p>Car not found.</p>'; return; }
  try {
    const [carsRes, ratingsRes] = await Promise.all([fetch('/api/cars'), fetch('/api/ratings')]);
    const cars = await carsRes.json();
    const ratings = await ratingsRes.json();
    const car = cars.find(item => String(item.id) === id);
    if (!car) { productContent.innerHTML = '<p>Car not found.</p>'; return; }
    productContent.innerHTML = createDetailView(car, ratings) + createRecommendationGrid(car, cars);
    bindRatingEvents(car.id);
    bindRecommendationEvents();
  } catch (err) {
    productContent.innerHTML = '<p>Unable to load car details. Please try again.</p>';
    console.error(err);
  }
}

function bindRatingEvents(carId) {
  const stars = Array.from(document.querySelectorAll('.star-btn'));
  const submitBtn = document.getElementById('submitRating');
  const commentBox = document.getElementById('ratingComment');
  const status = document.getElementById('ratingStatus');
  let selectedScore = 0;

  stars.forEach(star => {
    star.addEventListener('click', () => {
      selectedScore = Number(star.dataset.score);
      stars.forEach(s => s.classList.remove('active'));
      stars.slice(0, selectedScore).forEach(s => s.classList.add('active'));
    });
  });

  submitBtn && submitBtn.addEventListener('click', async () => {
    if (!selectedScore) { status.textContent = 'Please choose a star rating.'; status.style.color = '#dc2626'; return; }
    status.textContent = 'Submitting...'; status.style.color = '#111827';
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carId, score: selectedScore, comment: commentBox.value })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed');
      status.textContent = 'Thank you! Your rating has been added.'; status.style.color = '#16a34a';
      commentBox.value = ''; selectedScore = 0;
      stars.forEach(s => s.classList.remove('active'));
      loadProduct();
    } catch (err) {
      status.textContent = 'Unable to save your rating.'; status.style.color = '#dc2626';
      console.error(err);
    }
  });
}

loadProduct();