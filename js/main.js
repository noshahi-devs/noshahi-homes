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
    count.textContent = `${list.length} properties`;
    listingGrid.innerHTML = list
      .map(
        (p) => `<article class="card">
          <div class="thumb"></div>
          <div class="content">
            <span class="badge">${p.featured ? "Verified" : "Standard"}</span>
            <h3>${p.title}</h3>
            <p class="price">${money(p.price)}</p>
            <div class="meta"><span>${p.city} - ${p.area}</span><span>${p.type}</span></div>
            <div class="meta"><span>${p.intent}</span><span>${p.beds || 0} Bed | ${p.baths || 0} Bath</span></div>
          </div>
        </article>`
      )
      .join("");
  }

  function renderStatic() {
    projectsGrid.innerHTML = data.projects
      .map((p) => `<article class="card"><div class="content"><h3>${p.name}</h3><p>${p.city}</p><span class="badge">${p.units} Units</span></div></article>`)
      .join("");

    cityGrid.innerHTML = data.cities.slice(0, 12).map((c) => `<div class="city-card">${c}</div>`).join("");
    blogGrid.innerHTML = data.blogs
      .map((b) => `<article class="card"><div class="content"><h3>${b.title}</h3><p>${b.author}</p></div></article>`)
      .join("");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = {
      city: lookupCity(cityInput.value),
      area: areaSel.value,
      type: document.getElementById("type").value,
      intent: document.getElementById("intent").value,
      min: Number(document.getElementById("priceMin").value || 0),
      max: Number(document.getElementById("priceMax").value || Number.MAX_SAFE_INTEGER),
      beds: Number(document.getElementById("beds").value || 0)
    };

    const filtered = store
      .allListings()
      .filter((p) => p.status !== "rejected")
      .filter((p) => !f.city || p.city === f.city)
      .filter((p) => !f.area || p.area === f.area)
      .filter((p) => !f.type || p.type === f.type)
      .filter((p) => !f.intent || p.intent === f.intent)
      .filter((p) => p.price >= f.min && p.price <= f.max)
      .filter((p) => !f.beds || (p.beds || 0) >= f.beds);

    renderListings(filtered);
  });

  renderListings(store.allListings().filter((p) => p.status !== "rejected"));
  renderStatic();
})();
