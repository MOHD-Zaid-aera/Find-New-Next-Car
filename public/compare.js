/* compare.js - Enhanced side-by-side car comparison */
(function () {
  "use strict";

  var content = document.getElementById("compareContent");
  var emptyEl = document.getElementById("compareEmpty");
  var titleEl = document.getElementById("compareTitleCount");

  function getIds() {
    var raw = new URLSearchParams(window.location.search).get("ids") || "";
    return raw.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  }

  /* ── Parse a value into a number for comparison ── */
  function parseNum(val) {
    if (val === null || val === undefined) return null;
    var s = String(val).replace(/[^\d.]/g, "");
    var n = parseFloat(s);
    return isNaN(n) ? null : n;
  }

  /* Extract number from mileage/range strings like "17.4 kmpl" or "465 km" */
  function parseMileage(car) {
    var src = car.fuelType === "Electric" ? (car.range || "") : (car.mileage || "");
    return parseNum(src);
  }

  /* Extract price number from "Rs. 6.99 Lakh" style strings */
  function parsePrice(car) {
    var s = String(car.price || "").toLowerCase();
    var m = s.match(/([\d.]+)\s*(lakh|cr|crore)/i);
    if (m) {
      var n = parseFloat(m[1]);
      if (/cr/i.test(m[2])) n *= 100;
      return n;
    }
    return parseNum(car.price);
  }

  /* ── Determine winner index for each row ── */
  function winners(cars, getter, higherIsBetter) {
    var vals = cars.map(getter);
    var nums = vals.map(function (v) { return typeof v === "number" ? v : parseNum(v); });
    var valid = nums.filter(function (n) { return n !== null; });
    if (valid.length < 2) return vals.map(function () { return false; });
    var best = higherIsBetter
      ? Math.max.apply(null, valid)
      : Math.min.apply(null, valid);
    return nums.map(function (n) { return n !== null && n === best; });
  }

  /* ── Progress bar (% of max) ── */
  function progressBar(val, max, color) {
    if (!val || !max) return "";
    var pct = Math.min(100, Math.round((val / max) * 100));
    return '<div class="cmp-progress"><div class="cmp-progress-fill" style="width:' +
      pct + '%;background:' + color + '"></div></div>';
  }

  /* ── Fuel badge ── */
  function fuelBadge(f) {
    var map = { Electric: ["#16a34a","EV"], Petrol: ["#d97706","Petrol"],
                Diesel: ["#1d4ed8","Diesel"], CNG: ["#7c3aed","CNG"] };
    var pair = map[f] || ["#6b7280", f];
    return '<span class="cmp-fuel-badge" style="--fuel-color:' + pair[0] + '">' + pair[1] + "</span>";
  }

  /* ── Stars ── */
  function starBar(n) {
    var filled = Math.round(Number(n) || 0);
    var s = "";
    for (var i = 1; i <= 5; i++) {
      s += '<span class="cmp-star' + (i <= filled ? " cmp-star-on" : "") + '">\u2605</span>';
    }
    return '<div class="cmp-stars">' + s + '<span class="cmp-rating-num">' + n + '</span></div>';
  }

  /* ── Build column header cards ── */
  function buildHeaders(cars) {
    return cars.map(function (car, i) {
      var priceNum = parsePrice(car);
      var prices   = cars.map(parsePrice);
      var valid    = prices.filter(function (p) { return p !== null; });
      var minP     = valid.length ? Math.min.apply(null, valid) : null;
      var isBest   = priceNum !== null && minP !== null && priceNum === minP && valid.length > 1;
      return '<div class="cmp-col-head ' + (isBest ? "cmp-col-best" : "") + '">' +
        (isBest ? '<div class="cmp-best-banner">Best Value</div>' : '') +
        '<div class="cmp-col-img">' +
          '<img src="' + car.imageUrl + '" alt="' + car.brand + ' ' + car.model +
          '" onerror="this.onerror=null;this.src=\'images/car-placeholder.svg\'" loading="lazy" />' +
          '<div class="cmp-col-img-overlay"></div>' +
          fuelBadge(car.fuelType) +
        '</div>' +
        '<div class="cmp-col-info">' +
          '<p class="cmp-col-brand">' + car.brand + '</p>' +
          '<h3 class="cmp-col-name">' + car.model + '</h3>' +
          '<p class="cmp-col-price">' + car.price + '</p>' +
          '<a class="btn btn-primary cmp-detail-btn" href="product.html?id=' + car.id + '">View Details</a>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  /* ── Build spec rows ── */
  function buildRows(cars) {
    var mileages = cars.map(parseMileage);
    var maxMile  = Math.max.apply(null, mileages.filter(function (n) { return n !== null; }).concat([0]));
    var prices   = cars.map(parsePrice);
    var minPrice = Math.min.apply(null, prices.filter(function (n) { return n !== null; }).concat([Infinity]));

    var priceWin = winners(cars, parsePrice,             false); /* lower = better */
    var mileWin  = winners(cars, parseMileage,           true);
    var seatWin  = winners(cars, function (c) { return Number(c.seats); }, true);
    var rateWin  = winners(cars, function (c) { return Number(c.rating); }, true);

    var specs = [
      {
        label: "Segment",
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
        render: function (car) { return car.segment || "-"; },
        wins: null
      },
      {
        label: "Price",
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
        render: function (car) { return '<strong class="cmp-price-val">' + car.price + '</strong>'; },
        wins: priceWin, html: true
      },
      {
        label: "Fuel Type",
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 22V8l9-6 9 6v14"/><rect x="9" y="14" width="6" height="8"/></svg>',
        render: function (car) { return fuelBadge(car.fuelType); },
        wins: null, html: true
      },
      {
        label: "Transmission",
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5" cy="12" r="3"/><circle cx="19" cy="5" r="3"/><circle cx="19" cy="19" r="3"/><path d="M5 15v1a6 6 0 0 0 6 6h2M19 8v3"/></svg>',
        render: function (car) { return car.transmission || "-"; },
        wins: null
      },
      {
        label: "Seats",
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.38 3.46 16 2a4 4 0 0 1 .94 5.07l-3.1 4.66C11.83 13.14 11 15.06 11 17H9c0-2.42 1.06-4.73 2.89-6.31l3.1-4.67A6.02 6.02 0 0 0 20.38 3.46zM11 17a4 4 0 0 1-4 4H4v-2a4 4 0 0 1 4-4h3v2z"/></svg>',
        render: function (car) { return (car.seats || "-") + " Seats"; },
        wins: seatWin
      },
      {
        label: "Engine / CC",
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V3m-8 4V3m-4 8h1m14 0h1M9 11h6m-3 4v1"/></svg>',
        render: function (car) {
          return car.fuelType === "Electric" ? "Electric Motor" : (car.cc || "-");
        },
        wins: null
      },
      {
        label: "Mileage / Range",
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>',
        render: function (car) {
          var label = car.fuelType === "Electric" ? (car.range || "-") : (car.mileage || "-");
          var num = parseMileage(car);
          var bar = (num && maxMile) ? progressBar(num, maxMile, "#2563eb") : "";
          return '<span class="cmp-mile-label">' + label + '</span>' + bar;
        },
        wins: mileWin, html: true
      },
      {
        label: "Battery / Tank",
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="16" height="10" rx="2"/><path d="M22 11v2"/></svg>',
        render: function (car) {
          return car.fuelType === "Electric"
            ? (car.batteryCapacity || "-")
            : (car.fuelTankCapacity || "-");
        },
        wins: null
      },
      {
        label: "Rating",
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
        render: function (car) { return starBar(car.rating); },
        wins: rateWin, html: true
      },
    ];

    return specs.map(function (spec, ri) {
      var cells = cars.map(function (car, ci) {
        var isWinner = spec.wins && spec.wins[ci];
        var val = spec.render(car);
        return '<div class="cmp-cell' + (isWinner ? " cmp-cell-winner" : "") + '">' +
          (isWinner ? '<span class="cmp-win-tag">Best</span>' : '') +
          (spec.html ? val : escHtml(String(val))) +
        '</div>';
      }).join('');
      return '<div class="cmp-row" style="animation-delay:' + (ri * 60) + 'ms">' +
        '<div class="cmp-row-label">' +
          '<span class="cmp-row-icon">' + spec.icon + '</span>' +
          spec.label +
        '</div>' +
        '<div class="cmp-row-cells">' + cells + '</div>' +
      '</div>';
    }).join('');
  }

  function escHtml(s) {
    return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  async function load() {
    var ids = getIds();
    if (!ids.length || ids.length < 2) {
      if (emptyEl) emptyEl.style.display = "flex";
      return;
    }
    try {
      var res  = await fetch("/api/cars");
      var all  = await res.json();
      var cars = ids.map(function (id) {
        return all.find(function (c) { return String(c.id) === id; });
      }).filter(Boolean);

      if (cars.length < 2) {
        if (emptyEl) emptyEl.style.display = "flex";
        return;
      }

      if (titleEl) titleEl.textContent = "Comparing " + cars.length + " cars";

      var gridCols = "repeat(" + cars.length + ", 1fr)";

      var html =
        '<div class="cmp-container">' +
          '<div class="cmp-heads" style="grid-template-columns:' + gridCols + '">' +
            buildHeaders(cars) +
          '</div>' +
          '<div class="cmp-rows">' +
            buildRows(cars) +
          '</div>' +
        '</div>';

      if (content) {
        content.innerHTML = html;
        /* Animate rows in */
        setTimeout(function () {
          content.querySelectorAll(".cmp-row").forEach(function (row) {
            row.classList.add("cmp-row-visible");
          });
        }, 80);
      }
    } catch (err) {
      if (content) content.innerHTML = '<p class="empty-state">Could not load comparison. Please try again.</p>';
      console.error(err);
    }
  }

  load();
}());
