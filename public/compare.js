/* compare.js - side-by-side car comparison page */
(function () {
  var content = document.getElementById("compareContent");
  var emptyEl = document.getElementById("compareEmpty");

  function getIds() {
    var params = new URLSearchParams(window.location.search);
    var raw = params.get("ids") || "";
    return raw.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function badge(label, color) {
    return '<span class="cmp-badge" style="background:' + color + '">' + label + "</span>";
  }

  function stars(n) {
    var s = "";
    for (var i = 1; i <= 5; i++) {
      s += i <= Math.round(n) ? "\u2605" : "\u2606";
    }
    return s + " <small>(" + n + ")</small>";
  }

  function fuelColor(f) {
    var map = { Electric: "#16a34a", Petrol: "#d97706", Diesel: "#1d4ed8", CNG: "#7c3aed" };
    return map[f] || "#6b7280";
  }

  function buildRows(cars) {
    var specs = [
      { label: "Brand",        key: function (c) { return c.brand; } },
      { label: "Segment",      key: function (c) { return c.segment || "-"; } },
      { label: "Price",        key: function (c) { return '<strong class="cmp-price">' + c.price + "</strong>"; }, html: true },
      { label: "Fuel Type",    key: function (c) { return badge(c.fuelType, fuelColor(c.fuelType)); }, html: true },
      { label: "Transmission", key: function (c) { return c.transmission || "-"; } },
      { label: "Seats",        key: function (c) { return (c.seats || "-") + " seats"; } },
      { label: "Engine / CC",  key: function (c) { return c.cc || (c.fuelType === "Electric" ? "Electric Motor" : "-"); } },
      { label: "Mileage / Range", key: function (c) {
          return c.fuelType === "Electric"
            ? (c.range || "-") + " range"
            : (c.mileage || "-");
        }
      },
      { label: "Battery / Tank", key: function (c) {
          return c.fuelType === "Electric"
            ? (c.batteryCapacity || "-")
            : (c.fuelTankCapacity || "-");
        }
      },
      { label: "Charging",     key: function (c) { return c.chargingTime || (c.fuelType === "Electric" ? "-" : "N/A"); } },
      { label: "Rating",       key: function (c) { return stars(c.rating); }, html: true },
    ];

    return specs.map(function (spec) {
      var cells = cars.map(function (car) {
        var val = spec.key(car);
        var cell = '<td class="cmp-cell">' + (spec.html ? val : escHtml(String(val))) + "</td>";
        return cell;
      }).join("");
      return "<tr><th class=\"cmp-label\">" + spec.label + "</th>" + cells + "</tr>";
    }).join("");
  }

  function escHtml(s) {
    return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  function buildHeads(cars) {
    return cars.map(function (car) {
      return '<th class="cmp-head">' +
        '<div class="cmp-card-img-wrap">' +
          '<img src="' + car.imageUrl + '" alt="' + car.brand + " " + car.model +
          '" onerror="this.onerror=null;this.src=\'images/car-placeholder.svg\'" />' +
        "</div>" +
        '<p class="cmp-car-brand">' + car.brand + "</p>" +
        '<h3 class="cmp-car-name">' + car.brand + " " + car.model + "</h3>" +
        '<a class="btn btn-primary cmp-view-btn" href="product.html?id=' + car.id + '">View Details</a>' +
      "</th>";
    }).join("");
  }

  async function load() {
    var ids = getIds();
    if (!ids.length || ids.length < 2) {
      if (emptyEl) emptyEl.style.display = "block";
      return;
    }
    try {
      var res  = await fetch("/api/cars");
      var all  = await res.json();
      var cars = ids.map(function (id) {
        return all.find(function (c) { return String(c.id) === id; });
      }).filter(Boolean);

      if (cars.length < 2) {
        if (emptyEl) emptyEl.style.display = "block";
        return;
      }

      var colWidth = Math.floor(75 / cars.length);

      var html =
        '<div class="cmp-wrap">' +
          '<div class="cmp-table-scroll">' +
            '<table class="cmp-table">' +
              "<colgroup>" +
                '<col style="width:25%">' +
                cars.map(function () { return '<col style="width:' + colWidth + '%">'; }).join("") +
              "</colgroup>" +
              "<thead><tr>" +
                '<th class="cmp-label-head">Specification</th>' +
                buildHeads(cars) +
              "</tr></thead>" +
              "<tbody>" + buildRows(cars) + "</tbody>" +
            "</table>" +
          "</div>" +
        "</div>";

      if (content) content.innerHTML = html;
    } catch (err) {
      if (content) content.innerHTML = '<p class="empty-state">Could not load comparison. Please try again.</p>';
      console.error(err);
    }
  }

  load();
}());
