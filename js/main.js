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
  const closeMapBtn = document.getElementById("closeMap");

  if (closeMapBtn) {
    closeMapBtn.addEventListener("click", () => {
      mapSection.classList.remove("show");
    });
  }

  const normalize = (v) => String(v || "").trim().toLowerCase();

  function lookupCity(cityValue) {
    const wanted = normalize(cityValue);
    return data.cities.find((c) => normalize(c) === wanted) || "";
  }

  // Area is now a text input

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
    triggerSearch();
  });

  // Reactive listeners
  areaSel.addEventListener("input", triggerSearch);
  typeSel.addEventListener("change", triggerSearch);
  priceInput.addEventListener("input", triggerSearch);

  document.addEventListener("click", (e) => {
    if (!cityOptions.contains(e.target) && e.target !== cityInput) {
      cityOptions.classList.remove("show");
    }
  });

  cityInput.addEventListener("input", () => {
    showCitySuggestions(cityInput.value);
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
        .map((p, idx) => `<article class="card project-card" data-idx="${idx}" style="cursor: pointer;">
          <div class="thumb" style="background-image: url('${p.image || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'}')"></div>
          <div class="content">
            <h3 class="h5 mb-1">${p.name}</h3>
            <p class="text-muted small mb-2"><i class="fa-solid fa-location-dot me-1"></i>${p.city}</p>
            <div class="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
              <span class="badge badge-verified">${p.units} Premium Units</span>
              <button class="btn btn-sm btn-outline-primary fw-bold">View Details</button>
            </div>
          </div>
        </article>`)
        .join("");

      projectsGrid.querySelectorAll(".project-card").forEach(card => {
        card.addEventListener("click", () => {
          const project = data.projects[Number(card.dataset.idx)];

          document.getElementById('projectModalTitle').textContent = project.name;
          document.getElementById('projectModalName').textContent = project.name;
          document.getElementById('projectModalCity').textContent = project.city;
          document.getElementById('projectModalUnits').textContent = project.units + ' Premium Units';
          document.getElementById('projectModalImage').style.backgroundImage = `url('${project.image || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'}')`;

          // Reset form state every time modal opens
          document.getElementById('projectInquiryForm').classList.remove('d-none');
          document.getElementById('projectInquirySuccess').classList.add('d-none');

          const inqBtn = document.getElementById('projectModalInquireBtn');
          // Removing old listeners
          const newInqBtn = inqBtn.cloneNode(true);
          inqBtn.parentNode.replaceChild(newInqBtn, inqBtn);

          newInqBtn.addEventListener('click', () => {
            const name = document.getElementById('inquiryName').value.trim();
            const email = document.getElementById('inquiryEmail').value.trim();
            const phone = document.getElementById('inquiryPhone').value.trim();
            const message = document.getElementById('inquiryMessage').value.trim();

            if (!name || !email) {
              window.noshahiAlert("Missing Info", "Please enter your name and email to send the request.", "warning");
              return;
            }

            // Save as a lead assigned to the admin
            store.saveLead({
              agentEmail: "admin@noshahi.pk",
              name: name,
              email: email,
              propertyTitle: project.name,
              phone: phone || "N/A",
              message: message || `I am interested in ${project.name} located in ${project.city}. Please send me more details.`
            });

            // Show success state inside the modal
            document.getElementById('projectInquiryForm').classList.add('d-none');
            document.getElementById('projectInquirySuccess').classList.remove('d-none');

            // Reset form fields
            document.getElementById('inquiryName').value = '';
            document.getElementById('inquiryEmail').value = '';
            document.getElementById('inquiryPhone').value = '';
            document.getElementById('inquiryMessage').value = '';
          });

          new bootstrap.Modal(document.getElementById('projectDetailsModal')).show();
        });
      });
    }

    if (cityGrid) {
      let showingAllCities = false;
      const seeMoreBtn = document.getElementById("seeMoreCitiesBtn");

      const renderCities = () => {
        const displayLimit = showingAllCities ? data.cities.length : 15;
        const citiesToShow = data.cities.slice(0, displayLimit);

        cityGrid.innerHTML = citiesToShow.map((c) => `
          <div class="card p-4 text-center shadow-sm hover-up border-0 bg-white clickable city-card" data-city="${c}">
            <h4 class="h5 mb-0">${c}</h4>
          </div>
        `).join("");

        cityGrid.querySelectorAll(".city-card").forEach(card => {
          card.addEventListener("click", (e) => {
            const cityName = card.dataset.city;
            window.location.href = `city-explore.html?city=${encodeURIComponent(cityName)}`;
          });
        });

        if (seeMoreBtn) {
          if (showingAllCities) {
            seeMoreBtn.innerHTML = `See Less <i class="fa-solid fa-chevron-up ms-1"></i>`;
          } else {
            seeMoreBtn.innerHTML = `See All ${data.cities.length} Cities <i class="fa-solid fa-chevron-down ms-1"></i>`;
          }
        }
      };

      if (seeMoreBtn) {
        seeMoreBtn.addEventListener("click", () => {
          showingAllCities = !showingAllCities;
          renderCities();
        });
      }

      renderCities();
    }

    if (blogGrid) {
      blogGrid.innerHTML = data.blogs
        .map((b) => `<article class="card">
          <div class="content">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="badge bg-primary-subtle text-primary border-0">${b.category || "Insights"}</span>
              <small class="text-muted">${b.date || ""}${b.readTime ? ` · ${b.readTime}` : ""}</small>
            </div>
            <h3 class="h5 mb-2">${b.title}</h3>
            <p class="text-muted small mb-0"><i class="fa-solid fa-user-pen me-2"></i>${b.author}</p>
            <a href="blog.html?id=${encodeURIComponent(b.id)}" class="btn btn-link px-0 text-primary fw-bold mt-2 text-decoration-none">Read Full Insight <i class="fa-solid fa-arrow-right ms-1"></i></a>
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

    const areaQuery = normalize(f.area);
    const filtered = store
      .allListings()
       .filter((p) => p.status === "approved") // Homepage usually shows only approved
      .filter((p) => !f.city || p.city === f.city)
      .filter((p) => {
        if (!areaQuery) return true;
        const pArea = normalize(p.area);
        const terms = areaQuery.split(/\s+/).filter(t => t.length > 2);
        return pArea.includes(areaQuery) || terms.some(t => pArea.includes(t));
      })
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




