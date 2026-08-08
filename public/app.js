// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navMenu = document.getElementById('navMenu');

if (mobileMenuBtn && navMenu) {
  mobileMenuBtn.addEventListener('click', () => {
    mobileMenuBtn.classList.toggle('active');
    navMenu.classList.toggle('active');
  });

  // Close menu when a link is clicked
  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenuBtn.classList.remove('active');
      navMenu.classList.remove('active');
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.site-header')) {
      mobileMenuBtn.classList.remove('active');
      navMenu.classList.remove('active');
    }
  });
}

const carGrid = document.getElementById('carGrid');
const brandFilter = document.getElementById('brandFilter');
const fuelFilter = document.getElementById('fuelFilter');
const searchInput = document.getElementById('carSearch');
const searchToggleBtn = document.getElementById('searchToggleBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');
let cars = [];
let revealObserver = null;

function initThemeToggle() {
  if (!themeToggleBtn) {
    return;
  }

  const savedTheme = localStorage.getItem('theme') || 'light';
  document.body.classList.toggle('dark-theme', savedTheme === 'dark');
  themeToggleBtn.querySelector('.theme-toggle-icon').textContent = savedTheme === 'dark' ? '☀️' : '🌙';

  themeToggleBtn.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggleBtn.querySelector('.theme-toggle-icon').textContent = isDark ? '☀️' : '🌙';
  });
}

function applyStoredTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.body.classList.toggle('dark-theme', savedTheme === 'dark');
  const toggleIcon = document.querySelector('.theme-toggle-icon');
  if (toggleIcon) {
    toggleIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
  }
}

function initSearchToggle() {
  if (!searchToggleBtn || !searchInput) {
    return;
  }

  const searchWrapper = searchInput.closest('.nav-search');

  searchToggleBtn.addEventListener('click', () => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      searchWrapper?.classList.toggle('mobile-search-visible');
      searchInput.classList.toggle('mobile-search-active');
      if (searchWrapper?.classList.contains('mobile-search-visible')) {
        setTimeout(() => searchInput.focus(), 100);
      }
      return;
    }

    searchInput.focus();
  });

  searchInput.addEventListener('blur', () => {
    if (window.innerWidth <= 768) {
      searchWrapper?.classList.remove('mobile-search-visible');
      searchInput.classList.remove('mobile-search-active');
    }
  });
}

function createCard(car) {
  if (!carGrid) {
    return null;
  }

  const card = document.createElement('article');
  card.className = 'car-card reveal-on-scroll';
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

function initRevealAnimations() {
  const revealElements = Array.from(document.querySelectorAll('.reveal-on-scroll'));
  if (!revealElements.length) {
    return;
  }

  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        } else {
          entry.target.classList.remove('is-visible');
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    });
  }

  revealElements.forEach((element) => {
    const delay = Number(element.dataset.delay || 0);
    element.style.transitionDelay = `${delay}ms`;

    if (element.classList.contains('reveal-initial')) {
      setTimeout(() => {
        element.classList.add('is-visible');
      }, 180 + delay);
    } else {
      revealObserver.observe(element);
    }
  });
}

function renderCars(list) {
  if (!carGrid) {
    return;
  }

  carGrid.innerHTML = '';
  if (!list.length) {
    carGrid.innerHTML = '<p class="empty-state">No cars match the selected filters.</p>';
    initRevealAnimations();
    return;
  }

  list.forEach(car => carGrid.appendChild(createCard(car)));
  initRevealAnimations();
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
  if (!brandFilter) {
    return;
  }

  const brands = [...new Set(carsList.map(car => car.brand))].sort();
  brands.forEach(brand => {
    const option = document.createElement('option');
    option.value = brand;
    option.textContent = brand;
    brandFilter.appendChild(option);
  });
}

function applyFilters() {
  if (!carGrid || !brandFilter || !fuelFilter || !searchInput) {
    return;
  }

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
  if (!carGrid) {
    return;
  }

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

if (brandFilter) {
  brandFilter.addEventListener('change', applyFilters);
}

if (fuelFilter) {
  fuelFilter.addEventListener('change', applyFilters);
}

if (searchInput) {
  searchInput.addEventListener('input', applyFilters);
}

applyStoredTheme();
initThemeToggle();
initSearchToggle();
initRevealAnimations();
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
