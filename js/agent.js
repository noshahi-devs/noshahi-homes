(function () {
  const form = document.getElementById("agentForm");
  if (!form) return;

  const cityInput = document.getElementById("city");
  const cityToggle = document.getElementById("cityToggle");
  const cityOptions = document.getElementById("cityOptions");
  const areaInput = document.getElementById("area");
  const areaOptions = document.getElementById("areaOptions");
  const myListings = document.getElementById("myListings");
  const leadList = document.getElementById("leadList");

  const normalize = (v) => String(v || "").trim().toLowerCase();
  const lookupCity = (cityValue) => window.noshahiData.cities.find((c) => normalize(c) === normalize(cityValue)) || "";

  function renderCityOptions(query, forceOpen) {
    const q = normalize(query);
    const matches = window.noshahiData.cities.filter((c) => normalize(c).includes(q)).slice(0, q ? 10 : 20);
    cityOptions.innerHTML = matches.map((c) => `<button type="button" class="suggest-item list-group-item list-group-item-action" data-city="${c}">${c}</button>`).join("");
    cityOptions.classList.toggle("show", matches.length > 0 && (query.trim().length > 0 || !!forceOpen));
  }

  function renderAreaOptions(cityValue, areaQuery) {
    const cityName = lookupCity(cityValue);
    const areas = cityName
      ? (window.noshahiData.punjabAreas[cityName] || ["Main City", "Model Town", "Cantt", "Satellite Town"])
      : [];
    const q = normalize(areaQuery);
    const matches = areas.filter((a) => normalize(a).includes(q)).slice(0, 10);
    areaOptions.innerHTML = matches.map((a) => `<button type="button" class="suggest-item list-group-item list-group-item-action" data-area="${a}">${a}</button>`).join("");
    areaOptions.classList.toggle("show", matches.length > 0 && areaQuery.trim().length > 0);
  }

  cityInput.addEventListener("input", () => {
    renderCityOptions(cityInput.value);
    renderAreaOptions(cityInput.value, "");
    if (!lookupCity(cityInput.value)) areaInput.value = "";
  });

  if (cityToggle) {
    cityToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      if (cityOptions.classList.contains("show")) {
        cityOptions.classList.remove("show");
      } else {
        cityInput.focus();
        renderCityOptions("", true);
      }
    });
  }

  areaInput.addEventListener("input", () => {
    renderAreaOptions(cityInput.value, areaInput.value);
  });

  cityOptions.addEventListener("click", (e) => {
    const item = e.target.closest("[data-city]");
    if (!item) return;
    cityInput.value = item.dataset.city;
    cityOptions.classList.remove("show");
    areaInput.value = "";
    renderAreaOptions(cityInput.value, "");
  });

  areaOptions.addEventListener("click", (e) => {
    const item = e.target.closest("[data-area]");
    if (!item) return;
    areaInput.value = item.dataset.area;
    areaOptions.classList.remove("show");
  });

  document.addEventListener("click", (e) => {
    if (!cityOptions.contains(e.target) && e.target !== cityInput) {
      cityOptions.classList.remove("show");
    }
    if (!areaOptions.contains(e.target) && e.target !== areaInput) {
      areaOptions.classList.remove("show");
    }
  });

  function renderMyListings() {
    const list = window.noshahiStore.getCustomListings();
    myListings.innerHTML = list.length
      ? list
        .map(
          (p) => `<div class="p-3 bg-light rounded-3 d-flex justify-content-between align-items-center mb-2 shadow-sm border-0">
            <div>
              <p class="fw-bold mb-0">${p.title}</p>
              <small class="text-muted"><i class="fa-solid fa-money-bill-wave me-1"></i>PKR ${Number(p.price).toLocaleString("en-PK")}</small>
            </div>
            <span class="badge ${p.status === "pending" ? "badge-pending" : "badge-verified"} active">${p.status}</span>
          </div>`
        )
        .join("")
      : "<p class='text-muted small italic p-3'>No active listings in your inventory.</p>";
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const selectedCity = lookupCity(cityInput.value);
    if (!selectedCity) {
      alert("Please select a Punjab city from suggestions.");
      return;
    }

    const list = window.noshahiStore.getCustomListings();
    const item = {
      id: Date.now(),
      title: document.getElementById("title").value.trim(),
      city: selectedCity,
      area: document.getElementById("area").value.trim(),
      type: document.getElementById("type").value,
      intent: document.getElementById("intent").value,
      price: Number(document.getElementById("price").value),
      beds: Number(document.getElementById("beds").value || 0),
      baths: Number(document.getElementById("baths").value || 0),
      featured: document.getElementById("featured").checked,
      status: "pending"
    };

    list.unshift(item);
    window.noshahiStore.setCustomListings(list);
    form.reset();
    renderAreaOptions("", "");
    renderMyListings();
    alert("Listing submitted successfully! It is now pending admin approval.");
  });

  leadList.innerHTML = window.noshahiData.leads.map((lead) => `
    <li class="list-group-item d-flex justify-content-between align-items-center border-0 border-bottom px-0">
      <div class="ms-2 me-auto">
        <div class="fw-bold">New Lead: ${lead.split(":")[0]}</div>
        <small class="text-muted">Inquired about your listing</small>
      </div>
      <button class="btn btn-sm btn-outline-primary rounded-pill px-3">Reply</button>
    </li>
  `).join("");

  renderCityOptions("");
  renderAreaOptions("", "");
  renderMyListings();
})();
