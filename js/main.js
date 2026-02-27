(function () {
  const data = window.noshahiData;
  const store = window.noshahiStore;

  const cityInput = document.getElementById("city");
  const cityToggle = document.getElementById("cityToggle");
  const cityOptions = document.getElementById("cityOptions");
  const areaSel = document.getElementById("area");
  const form = document.getElementById("search");
  if (!form) return;

  const listingGrid = document.getElementById("listingGrid");
  const projectsGrid = document.getElementById("projectsGrid");
  const cityGrid = document.getElementById("cityGrid");
  const blogGrid = document.getElementById("blogGrid");
  const count = document.getElementById("resultCount");

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
    const areas = cityName
      ? (data.punjabAreas[cityName] || ["Main City", "Model Town", "Cantt", "Satellite Town"])
      : allAreasFromListings();
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
  });

  document.addEventListener("click", (e) => {
    if (!cityOptions.contains(e.target) && e.target !== cityInput) {
      cityOptions.classList.remove("show");
    }
  });

  fillAreaOptions("");

  cityInput.addEventListener("input", () => {
    showCitySuggestions(cityInput.value);
    fillAreaOptions(cityInput.value);
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
        (p) => `<article class="card">
          <div class="thumb" style="background-image: url('https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80')">
            <div class="position-absolute top-0 end-0 p-3">
              <span class="badge ${p.featured ? "badge-verified" : "bg-dark bg-opacity-50"} text-white shadow-sm">
                ${p.featured ? '<i class="fa-solid fa-circle-check me-1"></i>Verified' : 'Standard'}
              </span>
            </div>
          </div>
          <div class="content">
            <h3 class="h5 mb-1 text-truncate">${p.title}</h3>
            <p class="text-muted small mb-2"><i class="fa-solid fa-location-dot me-1"></i>${p.city}, ${p.area}</p>
            <p class="price mb-3">${money(p.price)}</p>
            <div class="d-flex justify-content-between border-top pt-3">
              <div class="d-flex gap-3 text-muted small">
                <span><i class="fa-solid fa-bed me-1"></i>${p.beds || 0}</span>
                <span><i class="fa-solid fa-bath me-1"></i>${p.baths || 0}</span>
              </div>
              <span class="text-primary fw-bold small text-uppercase">${p.intent}</span>
            </div>
          </div>
        </article>`
      )
      .join("");
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
        <div class="card p-3 text-center shadow-sm hover-up border-0 bg-white clickable">
          <h4 class="h6 mb-0">${c}</h4>
          <p class="text-muted small mb-0">Explore Listings</p>
        </div>
      `).join("");
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

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = {
      city: lookupCity(cityInput.value),
      area: areaSel.value,
      type: document.getElementById("type").value,
      intent: document.getElementById("intent").value,
      min: Number(document.getElementById("priceMin").value || 0),
      max: Number(document.getElementById("priceMax").value || Number.MAX_SAFE_INTEGER)
    };

    const filtered = store
      .allListings()
      .filter((p) => p.status !== "rejected")
      .filter((p) => !f.city || p.city === f.city)
      .filter((p) => !f.area || p.area === f.area)
      .filter((p) => !f.type || p.type === f.type)
      .filter((p) => !f.intent || p.intent === f.intent)
      .filter((p) => p.price >= f.min && p.price <= f.max);

    renderListings(filtered);
  });

  renderListings(store.allListings().filter((p) => p.status !== "rejected"));
  renderStatic();
})();
