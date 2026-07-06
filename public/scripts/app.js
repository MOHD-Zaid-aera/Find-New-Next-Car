const carGrid = document.getElementById('carGrid');
const brandFilter = document.getElementById('brandFilter');
const fuelFilter = document.getElementById('fuelFilter');
let cars = [];

function createCard(car) {
  const card = document.createElement('article');
  card.className = 'car-card';
  const mileageLine = car.fuelType === 'Electric' ? `Range: ${car.range}` : `Mileage: ${car.mileage}`;
  const chargeLine = car.fuelType === 'Electric' ? `<div class="spec-item">Charging: ${car.chargingTime}</div>` : '';
  card.innerHTML = `
    <img src="${car.imageUrl}" alt="${car.brand} ${car.model}" loading="lazy" onerror="this.onerror=null;this.src='images/car-placeholder.svg'" />
    <div class="car-card-header">
      <div>
        <h3>${car.brand} ${car.model}</h3>
        <p>${car.segment} · ${car.transmission} · ${car.fuelType}</p>
      </div>
      <img src="${car.logoUrl}" alt="${car.brand} logo" class="car-logo" loading="lazy" onerror="this.onerror=null;this.src='images/car-placeholder.svg'" />
    </div>
    <div class="car-details">
      <div class="car-meta">
        <p><strong>Price:</strong> ${car.price}</p>
        <p><strong>${mileageLine}</strong></p>
        <p><strong>Seats:</strong> ${car.seats}</p>
        <p><strong>Rating:</strong> ${car.rating} / 5</p>
      </div>
      <p>${car.description}</p>
      <div class="car-specs">
        <div class="spec-item">Fuel: ${car.fuelType}</div>
        <div class="spec-item">Transmission: ${car.transmission}</div>
        ${chargeLine}
      </div>
      <ul class="highlights">
        ${car.highlights.map(item => `<li>${item}</li>`).join('')}
      </ul>
    </div>
  `;
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
  const filtered = cars.filter(car => {
    const brandMatch = selectedBrand === 'all' || car.brand === selectedBrand;
    const fuelMatch = selectedFuel === 'all' || car.fuelType === selectedFuel;
    return brandMatch && fuelMatch;
  });
  renderCars(filtered);
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

loadCars();
