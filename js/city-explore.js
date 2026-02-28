(function () {
  const data = window.noshahiData;
  const store = window.noshahiStore;

  // Get parameters from URL
  const params = new URLSearchParams(window.location.search);
  const currentCity = params.get('city') || "Lahore";
  const initialType = params.get('type') || "All";

  const cityNameHeader = document.getElementById("cityNameHeader");
  const listingGrid = document.getElementById("cityListingGrid");
  const resultCount = document.getElementById("cityResultCount");
  const typeButtons = document.querySelectorAll(".type-filter");
  const maxPriceInput = document.getElementById("cityMaxPrice");
  const applyBtn = document.getElementById("applyCityFilters");
  const cityMapContainer = document.getElementById("city-map-container");
  const cityGoogleMap = document.getElementById("city-google-map");

  // State
  let selectedType = initialType;

  function init() {
    cityNameHeader.textContent = currentCity;
    document.getElementById("listingTitle").textContent = `Available Properties in ${currentCity}`;



    // Set initial active button
    typeButtons.forEach(btn => {
      if (btn.dataset.type === initialType) {
        btn.classList.add("btn-primary", "text-white");
        btn.classList.remove("btn-outline-secondary");
      }
    });

    renderListings();
  }

  function renderListings() {
    const maxPrice = Number(maxPriceInput.value) || Infinity;
    const listings = store.allListings().filter(p => {
      const cityMatch = p.city.toLowerCase() === currentCity.toLowerCase();
      const typeMatch = selectedType === "All" || p.type === selectedType;
      const priceMatch = p.price <= maxPrice;
      const statusMatch = p.status !== "rejected";
      return cityMatch && typeMatch && priceMatch && statusMatch;
    });

    resultCount.textContent = `${listings.length} units available`;

    if (listings.length === 0) {
      listingGrid.innerHTML = `
        <div class="col-12 text-center p-5">
          <i class="fa-solid fa-house-circle-exclamation fa-4x mb-3 text-muted"></i>
          <p class="text-muted">No listings found matching your filters in ${currentCity}.</p>
        </div>
      `;
      return;
    }

    listingGrid.innerHTML = listings
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
            <p class="price mb-3">PKR ${Number(p.price).toLocaleString("en-PK")}</p>
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

    // Re-attach listeners
    listingGrid.querySelectorAll(".property-card").forEach(card => {
      const id = Number(card.dataset.id);

      // Card click
      card.addEventListener("click", (e) => {
        if (!e.target.closest('button') && !e.target.closest('a')) {
          store.incrementView(id);
        }
      });

      // Actions
      card.querySelectorAll(".add-to-cart, .contact-action, .view-on-map").forEach(el => {
        el.addEventListener("click", () => store.incrementView(id));
      });

      card.querySelectorAll(".view-on-map").forEach(btn => {
        btn.addEventListener("click", () => {
          updateCityMap(btn.dataset.city, btn.dataset.area);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      });

      // Inquiry
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

  // Event Listeners
  typeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      typeButtons.forEach(b => {
        b.classList.remove("btn-primary", "text-white");
        b.classList.add("btn-outline-secondary");
      });
      btn.classList.remove("btn-outline-secondary");
      btn.classList.add("btn-primary", "text-white");
      selectedType = btn.dataset.type;
      renderListings();
    });
  });

  applyBtn.addEventListener("click", renderListings);

  function updateCityMap(city, area) {
    if (!city) return;
    const query = `${area ? area + ', ' : ''}${city}, Pakistan`;
    if (cityGoogleMap) cityGoogleMap.src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
    if (cityMapContainer) cityMapContainer.style.display = "block";
  }

  init();
})();


