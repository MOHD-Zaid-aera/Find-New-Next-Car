/* app.js - shared across all pages */

/* --- Theme --- */
(function () {
  var saved = localStorage.getItem("theme") || "light";
  document.body.classList.toggle("dark-theme", saved === "dark");
  var icon = document.querySelector(".theme-toggle-icon");
  if (icon) icon.textContent = saved === "dark" ? "\u2600\uFE0F" : "\uD83C\uDF19";
}());

var themeToggleBtn = document.getElementById("themeToggleBtn");
if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", function () {
    var isDark = document.body.classList.toggle("dark-theme");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    var icon = themeToggleBtn.querySelector(".theme-toggle-icon");
    if (icon) icon.textContent = isDark ? "\u2600\uFE0F" : "\uD83C\uDF19";
  });
}

/* --- Mobile menu --- */
var mobileMenuBtn = document.getElementById("mobileMenuBtn");
var navMenu = document.getElementById("navMenu");

if (mobileMenuBtn && navMenu) {
  mobileMenuBtn.addEventListener("click", function () {
    mobileMenuBtn.classList.toggle("active");
    navMenu.classList.toggle("active");
  });
  navMenu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      mobileMenuBtn.classList.remove("active");
      navMenu.classList.remove("active");
    });
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".site-header")) {
      mobileMenuBtn.classList.remove("active");
      navMenu.classList.remove("active");
    }
  });
}

/* --- Search toggle --- */
var searchToggleBtn = document.getElementById("searchToggleBtn");
var searchInput = document.getElementById("carSearch");

function initSearchToggle() {
  if (!searchToggleBtn || !searchInput) return;
  var searchWrapper = searchInput.closest(".nav-search");
  searchToggleBtn.addEventListener("click", function () {
    if (window.innerWidth <= 768) {
      searchWrapper && searchWrapper.classList.toggle("mobile-search-visible");
      searchInput.classList.toggle("mobile-search-active");
      if (searchWrapper && searchWrapper.classList.contains("mobile-search-visible")) {
        setTimeout(function () { searchInput.focus(); }, 100);
      }
    } else {
      searchInput.focus();
    }
  });
  searchInput.addEventListener("blur", function () {
    if (window.innerWidth <= 768) {
      searchWrapper && searchWrapper.classList.remove("mobile-search-visible");
      searchInput.classList.remove("mobile-search-active");
    }
  });
}

/* --- Reveal on scroll --- */
var revealObserver = null;

function initRevealAnimations() {
  var elements = Array.from(document.querySelectorAll(".reveal-on-scroll"));
  if (!elements.length) return;
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        } else {
          entry.target.classList.remove("is-visible");
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  }
  elements.forEach(function (el) {
    var delay = Number(el.dataset.delay || 0);
    el.style.transitionDelay = delay + "ms";
    if (el.classList.contains("reveal-initial")) {
      setTimeout(function () { el.classList.add("is-visible"); }, 180 + delay);
    } else {
      revealObserver.observe(el);
    }
  });
}

/* --- Car grid --- */
var carGrid     = document.getElementById("carGrid");
var brandFilter = document.getElementById("brandFilter");
var fuelFilter  = document.getElementById("fuelFilter");
var cars = [];

function createCard(car) {
  if (!carGrid) return null;
  var card = document.createElement("article");
  card.className = "car-card reveal-on-scroll";

  var mileageLine = car.fuelType === "Electric"
    ? "Range: " + (car.range || "N/A")
    : "Mileage: " + (car.mileage || "N/A");
  var desc = car.description && car.description.length > 100
    ? car.description.slice(0, 100) + "..."
    : (car.description || "");
  var highlights = Array.isArray(car.highlights) ? car.highlights : [];
  var firstHighlight = highlights[0] ? "<li>" + highlights[0] + "</li>" : "";

  card.innerHTML =
    '<img src="' + car.imageUrl + '" alt="' + car.brand + " " + car.model +
    '" loading="lazy" onerror="this.onerror=null;this.src=\'images/car-placeholder.svg\'" />' +
    '<div class="car-card-header"><div>' +
      "<h3>" + car.brand + " " + car.model + "</h3>" +
      "<p>" + (car.segment || "") + " \u00B7 " + car.fuelType + "</p>" +
    "</div></div>" +
    '<div class="car-details car-summary">' +
      '<div class="car-meta">' +
        "<p><strong>Price:</strong> " + car.price + "</p>" +
        "<p><strong>" + mileageLine + "</strong></p>" +
      "</div>" +
      "<p>" + desc + "</p>" +
      '<ul class="highlights">' + firstHighlight + "</ul>" +
    "</div>";

  card.tabIndex = 0;
  function goTo() { window.location.href = "product.html?id=" + car.id; }
  card.addEventListener("click", goTo);
  card.addEventListener("keypress", function (e) { if (e.key === "Enter") goTo(); });
  return card;
}

function renderCars(list) {
  if (!carGrid) return;
  carGrid.innerHTML = "";
  if (!list.length) {
    carGrid.innerHTML = '<p class="empty-state">No cars match the selected filters.</p>';
    initRevealAnimations();
    return;
  }
  list.forEach(function (car) { var c = createCard(car); if (c) carGrid.appendChild(c); });
  initRevealAnimations();
}

function populateBrandFilter(list) {
  if (!brandFilter) return;
  var brands = Array.from(new Set(list.map(function (c) { return c.brand; }))).sort();
  brands.forEach(function (b) {
    var opt = document.createElement("option");
    opt.value = b; opt.textContent = b;
    brandFilter.appendChild(opt);
  });
}

function applyFilters() {
  if (!carGrid) return;
  var brand = brandFilter ? brandFilter.value : "all";
  var fuel  = fuelFilter  ? fuelFilter.value  : "all";
  var term  = searchInput ? searchInput.value.trim().toLowerCase() : "";
  var filtered = cars.filter(function (car) {
    var bm = brand === "all" || car.brand === brand;
    var fm = fuel  === "all" || car.fuelType === fuel;
    var sm = !term || [car.brand, car.model, car.description, car.segment, car.fuelType]
      .some(function (v) { return String(v || "").toLowerCase().includes(term); });
    return bm && fm && sm;
  });
  renderCars(filtered);
  if (term && filtered.length) {
    var first = carGrid.querySelector(".car-card");
    if (first) {
      first.classList.add("highlight-match");
      first.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(function () { first.classList.remove("highlight-match"); }, 2200);
    }
  }
}

async function loadCars() {
  if (!carGrid) return;
  try {
    var res = await fetch("/api/cars");
    cars = await res.json();
    populateBrandFilter(cars);
    renderCars(cars);
  } catch (err) {
    carGrid.innerHTML = '<p class="empty-state">Unable to load car data. Please try again.</p>';
    console.error("Failed to load cars:", err);
  }
}

if (brandFilter) brandFilter.addEventListener("change", applyFilters);
if (fuelFilter)  fuelFilter.addEventListener("change",  applyFilters);
if (searchInput) searchInput.addEventListener("input",   applyFilters);

/* --- Contact form --- */
function initContactForm() {
  var form   = document.getElementById("contactForm");
  var status = document.getElementById("contactStatus");
  if (!form || !status) return;
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    status.textContent = "Sending...";
    status.style.color = "var(--text)";
    try {
      var res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:    form.querySelector("[name='name']").value,
          email:   form.querySelector("[name='email']").value,
          message: form.querySelector("[name='message']").value
        })
      });
      var result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed");
      status.textContent = "Thanks! Your message was sent.";
      status.style.color = "#16a34a";
      form.reset();
    } catch (err) {
      status.textContent = "Unable to send. Please try again.";
      status.style.color = "#dc2626";
    }
  });
}

/* --- Init --- */
initSearchToggle();
initRevealAnimations();
loadCars();
initContactForm();
