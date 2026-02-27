(function () {
  const data = window.noshahiData;
  const store = window.noshahiStore;

  const cityInput = document.getElementById("city");
  const cityToggle = document.getElementById("cityToggle");
  const cityOptions = document.getElementById("cityOptions");
  const areaSel = document.getElementById("area");
  const typeSel = document.getElementById("type");
  const priceInput = document.getElementById("price");
  const form = document.getElementById("search");
  if (!form) return;

  const listingGrid = document.getElementById("listingGrid");
  const projectsGrid = document.getElementById("projectsGrid");
  const cityGrid = document.getElementById("cityGrid");
  const blogGrid = document.getElementById("blogGrid");
  const count = document.getElementById("resultCount");
  const mapSection = document.getElementById("map-section");
  const googleMap = document.getElementById("google-map");

  const normalize = (v) => String(v || "").trim().toLowerCase();

  function lookupCity(cityValue) {
    const wanted = normalize(cityValue);
    return data.cities.find((c) => normalize(c) === wanted) || "";
  }

  function allAreasFromListings() {
    return [...new Set(store.allListings().map((p) => p.area))].sort();
  }

  function fillAreaOptions(cityValue) {
    const cityName = lookupCity(cityValue);
    let areas = [];

    if (cityName) {
      // Merge standard areas with areas actually used in listings for this city
      const standard = data.punjabAreas[cityName] || ["Main City", "Cantt", "Model Town", "Satellite Town"];
      const fromListings = store.allListings()
        .filter(p => p.city === cityName && p.status === 'approved')
        .map(p => p.area);

      areas = [...new Set([...standard, ...fromListings])].filter(Boolean).sort();
    } else {
      areas = allAreasFromListings();
    }

    areaSel.innerHTML = '<option value="">Area</option>';
    areas.forEach((a) => areaSel.insertAdjacentHTML("beforeend", `<option>${a}</option>`));
  }

  function showCitySuggestions(query) {
    const q = normalize(query);
    const matches = data.cities.filter((c) => normalize(c).includes(q)).slice(0, q ? 10 : 20);
    cityOptions.innerHTML = matches.map((c) => `<button type="button" class="suggest-item list-group-item list-group-item-action" data-city="${c}">${c}</button>`).join("");
    cityOptions.classList.toggle("show", matches.length > 0 && query.trim().length > 0);
  }

  function openCityListAll() {
    showCitySuggestions("");
    cityOptions.classList.toggle("show", cityOptions.innerHTML.trim().length > 0);
  }

  cityOptions.addEventListener("click", (e) => {
    const item = e.target.closest("[data-city]");
    if (!item) return;
    cityInput.value = item.dataset.city;
    cityOptions.classList.remove("show");
    fillAreaOptions(cityInput.value);
    triggerSearch();
  });

  // Reactive listeners
  areaSel.addEventListener("focus", () => {
    if (cityInput.value) triggerSearch();
  });
  areaSel.addEventListener("change", triggerSearch);
  typeSel.addEventListener("change", triggerSearch);
  priceInput.addEventListener("input", triggerSearch);

  document.addEventListener("click", (e) => {
    if (!cityOptions.contains(e.target) && e.target !== cityInput) {
      cityOptions.classList.remove("show");
    }
  });

  fillAreaOptions("");

  cityInput.addEventListener("input", () => {
    showCitySuggestions(cityInput.value);
    fillAreaOptions(cityInput.value);
    triggerSearch();
  });

  if (cityToggle) {
    cityToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      if (cityOptions.classList.contains("show")) {
        cityOptions.classList.remove("show");
      } else {
        cityInput.focus();
        openCityListAll();
      }
    });
  }

  function money(v) {
    return `PKR ${Number(v).toLocaleString("en-PK")}`;
  }

  function renderListings(list) {
    if (!listingGrid) return;
    count.textContent = `${list.length} units available`;
    listingGrid.innerHTML = list
      .map(
        (p) => `<article class="card property-card" data-id="${p.id}">
          <div class="thumb" style="background-image: url('${p.image || 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'}')">
            <div class="position-absolute top-0 end-0 p-3">
              <span class="badge ${p.featured ? "badge-verified" : "bg-dark bg-opacity-50"} text-white shadow-sm">
                ${p.featured ? '<i class="fa-solid fa-circle-check me-1"></i>Verified' : 'Standard'}
              </span>
            </div>
          </div>
          <div class="content">
            <h3 class="h5 mb-1 text-truncate">${p.title}</h3>
            <p class="text-muted small mb-2"><i class="fa-solid fa-location-dot me-1"></i>${p.city}, ${p.area}</p>
            <p class="price mb-2">${money(p.price)}</p>
            <div class="d-flex justify-content-between align-items-center border-top pt-3">
              <div class="d-flex gap-2">
                <a href="tel:${p.phone || '03001234567'}" class="btn btn-sm btn-outline-secondary px-2 contact-action" title="Call Agent"><i class="fa-solid fa-phone"></i></a>
                <a href="https://wa.me/${p.whatsapp || '923001234567'}" target="_blank" class="btn btn-sm btn-outline-success px-2 contact-action" title="WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>
                <button class="btn btn-sm btn-outline-primary px-2 view-on-map" title="View on Map" data-city="${p.city}" data-area="${p.area}"><i class="fa-solid fa-map-location-dot"></i></button>
              </div>
              <button class="btn btn-sm btn-primary add-to-cart px-3" data-id="${p.id}">
                <i class="fa-solid fa-paper-plane me-1"></i>Inquire
              </button>
            </div>
          </div>
        </article>`
      )
      .join("");

    listingGrid.querySelectorAll(".property-card").forEach(card => {
      const id = Number(card.dataset.id);

      // Card click (anywhere not on buttons)
      card.addEventListener("click", (e) => {
        if (!e.target.closest('button') && !e.target.closest('a')) {
          store.incrementView(id);
        }
      });

      // Specific Actions
      card.querySelectorAll(".add-to-cart, .contact-action, .view-on-map").forEach(el => {
        el.addEventListener("click", () => store.incrementView(id));
      });

      card.querySelectorAll(".view-on-map").forEach(btn => {
        btn.addEventListener("click", () => {
          updateMap(btn.dataset.city, btn.dataset.area);
          window.scrollTo({ top: document.getElementById('search').offsetTop - 100, behavior: 'smooth' });
        });
      });

      // Inquiry logic
      const btn = card.querySelector(".add-to-cart");
      btn.addEventListener("click", () => {
        if (store.addToCart(id)) {
          btn.innerHTML = '<i class="fa-solid fa-check me-1"></i>Inquiry Added';
          btn.classList.replace("btn-primary", "btn-success");
          window.noshahiAlert("Success!", "Property added to your inquiry queue.", "success");
        } else {
          window.noshahiAlert("Notice", "Already in your portal!", "warning");
        }
      });
    });

  }

  function renderStatic() {
    if (projectsGrid) {
      projectsGrid.innerHTML = data.projects
        .map((p) => `<article class="card">
          <div class="thumb" style="background-image: url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80')"></div>
          <div class="content">
            <h3 class="h5 mb-1">${p.name}</h3>
            <p class="text-muted small mb-2"><i class="fa-solid fa-location-dot me-1"></i>${p.city}</p>
            <span class="badge badge-verified">${p.units} Premium Units</span>
          </div>
        </article>`)
        .join("");
    }

    if (cityGrid) {
      cityGrid.innerHTML = data.cities.slice(0, 8).map((c) => `
        <div class="card p-3 text-center shadow-sm hover-up border-0 bg-white clickable city-card" data-city="${c}">
          <h4 class="h6 mb-2">${c}</h4>
          <div class="city-quick-types d-flex justify-content-center gap-2 mt-2 opacity-0 transition-300">
            <button class="btn btn-xs btn-outline-primary py-0 px-2 small quick-filter" data-type="House" title="Houses in ${c}">H</button>
            <button class="btn btn-xs btn-outline-primary py-0 px-2 small quick-filter" data-type="Plot" title="Plots in ${c}">P</button>
            <button class="btn btn-xs btn-outline-primary py-0 px-2 small quick-filter" data-type="Commercial" title="Commercial in ${c}">C</button>
          </div>
        </div>
      `).join("");

      cityGrid.querySelectorAll(".city-card").forEach(card => {
        card.addEventListener("click", (e) => {
          const typeBtn = e.target.closest(".quick-filter");
          const cityName = card.dataset.city;
          let url = `city-explore.html?city=${encodeURIComponent(cityName)}`;

          if (typeBtn) {
            url += `&type=${encodeURIComponent(typeBtn.dataset.type)}`;
          }

          window.location.href = url;
        });
      });
    }

    if (blogGrid) {
      blogGrid.innerHTML = data.blogs
        .map((b) => `<article class="card">
          <div class="content">
            <h3 class="h5 mb-2">${b.title}</h3>
            <p class="text-muted small mb-0"><i class="fa-solid fa-user-pen me-2"></i>${b.author}</p>
            <a href="#" class="btn btn-link px-0 text-primary fw-bold mt-2 text-decoration-none">Read Full Insight <i class="fa-solid fa-arrow-right ms-1"></i></a>
          </div>
        </article>`)
        .join("");
    }
  }

  function updateMap(city, area) {
    if (!city) {
      if (mapSection) mapSection.classList.remove("show");
      return;
    }
    const query = `${area ? area + ', ' : ''}${city}, Pakistan`;
    if (googleMap) googleMap.src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
    if (mapSection) mapSection.classList.add("show");
  }

  function triggerSearch() {
    const f = {
      city: lookupCity(cityInput.value),
      area: areaSel.value,
      type: typeSel.value,
      max: Number(priceInput.value || Number.MAX_SAFE_INTEGER)
    };

    updateMap(f.city, f.area);

    const filtered = store
      .allListings()
      .filter((p) => p.status === "approved") // Homepage usually shows only approved
      .filter((p) => !f.city || p.city === f.city)
      .filter((p) => !f.area || p.area === f.area)
      .filter((p) => !f.type || p.type === f.type)
      .filter((p) => p.price <= f.max);

    renderListings(filtered);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    triggerSearch();
  });

  renderListings(store.allListings().filter((p) => p.status === "approved"));
  renderStatic();
})();
