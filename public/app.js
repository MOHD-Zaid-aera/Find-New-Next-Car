const carGrid = document.getElementById('carGrid');
const brandFilter = document.getElementById('brandFilter');
const fuelFilter = document.getElementById('fuelFilter');
const searchInput = document.getElementById('carSearch');
let cars = [];

function createCard(car) {
  const card = document.createElement('article');
  card.className = 'car-card';
  const mileageLine = car.fuelType === 'Electric' ? `Range: ${car.range}` : `Mileage: ${car.mileage}`;
  const shortDescription = car.description.length > 100 ? `${car.description.slice(0, 100)}...` : car.description;
  const firstHighlight = car.highlights[0] ? `<li>${car.highlights[0]}</li>` : '';

  card.innerHTML = `
    <img src="${car.imageUrl}" alt="${car.brand} ${car.model}" loading="lazy" onerror="this.onerror=null;this.src='images/car-placeholder.svg'" />
    <div class="car-card-header">
      <div>
        <h3>${car.brand} ${car.model}</h3>
        <p>${car.segment} · ${car.fuelType}</p>
      </div>
    </div>
    <div class="car-details car-summary">
      <div class="car-meta">
        <p><strong>Price:</strong> ${car.price}</p>
        <p><strong>${mileageLine}</strong></p>
      </div>
      <p>${shortDescription}</p>
      <ul class="highlights">
        ${firstHighlight}
      </ul>
    </div>
  `;
  card.addEventListener('click', () => {
    window.location.href = `product.html?id=${car.id}`;
  });
  card.tabIndex = 0;
  card.addEventListener('keypress', event => {
    if (event.key === 'Enter') {
      window.location.href = `product.html?id=${car.id}`;
    }
  });
  return card;
}

function renderCars(list) {
  carGrid.innerHTML = '';
  if (!list.length) {
    carGrid.innerHTML = '<p class="empty-state">No cars match the selected filters.</p>';
    return;
  }

  list.forEach(car => carGrid.appendChild(createCard(car)));
}

function scrollToFirstMatch(list) {
  const searchTerm = (searchInput?.value || '').trim().toLowerCase();
  if (!searchTerm || !list.length) {
    return;
  }

  const firstCard = carGrid.querySelector('.car-card');
  if (!firstCard) {
    return;
  }

  firstCard.classList.add('highlight-match');
  firstCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

  window.setTimeout(() => {
    firstCard.classList.remove('highlight-match');
  }, 2200);
}

function populateBrandFilter(carsList) {
  const brands = [...new Set(carsList.map(car => car.brand))].sort();
  brands.forEach(brand => {
    const option = document.createElement('option');
    option.value = brand;
    option.textContent = brand;
    brandFilter.appendChild(option);
  });
}

function applyFilters() {
  const selectedBrand = brandFilter.value;
  const selectedFuel = fuelFilter.value;
  const searchTerm = (searchInput?.value || '').trim().toLowerCase();
  const filtered = cars.filter(car => {
    const brandMatch = selectedBrand === 'all' || car.brand === selectedBrand;
    const fuelMatch = selectedFuel === 'all' || car.fuelType === selectedFuel;
    const searchMatch = !searchTerm || [car.brand, car.model, car.description, car.segment, car.fuelType]
      .some(value => String(value).toLowerCase().includes(searchTerm));
    return brandMatch && fuelMatch && searchMatch;
  });

  renderCars(filtered);
  scrollToFirstMatch(filtered);
}

async function loadCars() {
  try {
    const response = await fetch('/api/cars');
    cars = await response.json();
    populateBrandFilter(cars);
    renderCars(cars);
  } catch (error) {
    carGrid.innerHTML = '<p class="empty-state">Unable to load car data. Please try again later.</p>';
    console.error('Failed to load cars:', error);
  }
}

brandFilter.addEventListener('change', applyFilters);
fuelFilter.addEventListener('change', applyFilters);
searchInput?.addEventListener('input', applyFilters);

loadCars();

function initContactForm() {
  const form = document.getElementById('contactForm');
  const status = document.getElementById('contactStatus');

  if (!form || !status) {
    return;
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    status.textContent = 'Sending...';
    status.style.color = '#111827';

    const formData = new FormData(form);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      message: formData.get('message')
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Submission failed');
      }

      status.textContent = 'Thanks! Your message was sent successfully.';
      status.style.color = '#16a34a';
      form.reset();
    } catch (error) {
      status.textContent = 'Unable to send your message. Please try again later.';
      status.style.color = '#dc2626';
      console.error('Contact submission error:', error);
    }
  });
}

initContactForm();
