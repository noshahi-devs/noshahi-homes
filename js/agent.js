(function () {
  const noshahi = window.noshahiStore;
  const user = noshahi.getCurrentUser();
  if (!user || user.role !== 'agent') return;

  // 1. Approval Protection
  const agentFormSection = document.getElementById("agentForm")?.closest(".panel");
  if (user.status === 'pending' && agentFormSection) {
    agentFormSection.innerHTML = `
      <div class="text-center p-5">
        <i class="fa-solid fa-clock-rotate-left fa-4x text-warning mb-4"></i>
        <h3>Approval Pending</h3>
        <p class="text-muted">Welcome, <strong>${user.name}</strong>! Your agent account is currently under review by our Admin team. You will be able to list properties once approved.</p>
        <button class="btn btn-outline-primary mt-3" onclick="location.reload()">Check Status</button>
      </div>
    `;
    return;
  }

  // DOM Elements
  const form = document.getElementById("agentForm");
  const editForm = document.getElementById("editForm");
  const myListings = document.getElementById("myListings");
  const leadList = document.getElementById("leadList");
  const leadCount = document.getElementById("leadCount");

  // Analytics Elements
  const statActive = document.getElementById("statActive");
  const statViews = document.getElementById("statViews");
  const statLeads = document.getElementById("statLeads");
  const statConv = document.getElementById("statConv");
  const imgInput = document.getElementById("image");
  const imgPreviewContainer = document.getElementById("image-preview-container");
  const editImgInput = document.getElementById("editImage");
  const editImgPreview = document.getElementById("edit-image-preview");

  let currentNewImg = "";
  let currentEditImg = "";

  // File Handling
  function handleFileSelect(input, callback, previewElement) {
    const file = input.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        window.noshahiAlert("File Too Large", "Please select an image smaller than 2MB.", "warning");
        input.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        callback(base64);
        if (previewElement) {
          if (previewElement.tagName === 'IMG') {
            previewElement.src = base64;
            previewElement.classList.remove('d-none');
          } else {
            previewElement.innerHTML = `<img src="${base64}" class="img-fluid h-100 object-fit-cover w-100">`;
          }
        }
      };
      reader.readAsDataURL(file);
    }
  }

  imgInput.addEventListener("change", () => {
    handleFileSelect(imgInput, (data) => { currentNewImg = data; }, imgPreviewContainer);
  });

  editImgInput.addEventListener("change", () => {
    handleFileSelect(editImgInput, (data) => { currentEditImg = data; }, editImgPreview);
  });

  // Utilities
  const normalize = (v) => String(v || "").trim().toLowerCase();
  const lookupCity = (cityValue) => window.noshahiData.cities.find((c) => normalize(c) === normalize(cityValue)) || "";

  function renderStats() {
    const list = noshahi.getCustomListings().filter(p => p.agentEmail === user.email);
    const leads = noshahi.getLeads().filter(l => l.agentEmail === user.email);

    let totalViews = 0;
    list.forEach(p => totalViews += noshahi.getViews(p.id));

    statActive.textContent = list.filter(p => p.status === 'approved').length;
    statViews.textContent = totalViews > 1000 ? (totalViews / 1000).toFixed(1) + 'k' : totalViews;
    statLeads.textContent = leads.length;

    const conv = totalViews > 0 ? ((leads.length / totalViews) * 100).toFixed(1) : 0;
    statConv.textContent = conv + "%";
  }

  function renderLeads() {
    const leads = noshahi.getLeads().filter(l => l.agentEmail === user.email);
    leadCount.textContent = leads.length;

    if (!leads.length) {
      leadList.innerHTML = `
        <div class="p-5 text-center text-muted border border-dashed rounded-4 bg-light">
          <i class="fa-solid fa-inbox fa-3x mb-3 opacity-25"></i>
          <p>No inquiries from buyers yet.</p>
        </div>`;
      return;
    }

    leadList.innerHTML = leads.map(l => `
      <div class="p-3 bg-white border rounded-3 mb-2 shadow-sm">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h6 class="fw-bold mb-0">${l.name}</h6>
            <small class="text-muted"><i class="fa-solid fa-house-user me-1"></i>${l.propertyTitle}</small>
          </div>
          <span class="badge ${l.status === 'new' ? 'bg-primary' : 'bg-success-subtle text-success border-0'} rounded-pill">
            ${l.status === 'new' ? 'New Inquiry' : 'Responded'}
          </span>
        </div>
        <p class="small text-dark mb-3 border-start ps-2 py-1 bg-light">${l.message || 'Interested in this property.'}</p>
        <div class="d-flex gap-2">
          ${l.status === 'new' ?
        `<button class="btn btn-sm btn-primary flex-grow-1 respond-lead" data-id="${l.id}">Respond Now</button>` :
        `<button class="btn btn-sm btn-light border flex-grow-1" disabled><i class="fa-solid fa-check me-1"></i>Responded</button>`
      }
          <a href="tel:${l.phone || '03001234567'}" class="btn btn-sm btn-outline-secondary"><i class="fa-solid fa-phone"></i></a>
        </div>
      </div>
    `).join("");

    leadList.querySelectorAll(".respond-lead").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        const leads = noshahi.getLeads();
        const lead = leads.find(l => l.id === id);
        const reply = prompt(`Reply to ${lead.name}:`, `Hi ${lead.name}, thank you for your inquiry about ${lead.propertyTitle}. When would you like order a visit?`);
        if (reply) {
          lead.status = 'responded';
          lead.replyMessage = reply; // Save the reply to be shown to the buyer
          noshahi.updateLead(lead);
          window.noshahiAlert("Response Sent", `Your reply has been sent to ${lead.name}.`, "success");
          renderLeads();
        }
      });
    });
  }

  function renderMyListings() {
    const list = noshahi.getCustomListings().filter(p => p.agentEmail === user.email);

    if (!list.length) {
      myListings.innerHTML = "<div class='text-center p-5 text-muted bg-light rounded-4 border border-dashed'><p class='mb-0'>You haven't listed any properties yet.</p></div>";
      return;
    }

    myListings.innerHTML = list.map(p => `
      <div class="p-4 bg-white border rounded-4 shadow-sm mb-3">
        <div class="row g-3">
          <div class="col-md-3">
            <img src="${p.image || 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&q=80&w=400'}" 
                 class="img-fluid rounded-3 shadow-sm h-100 object-fit-cover" 
                 style="min-height: 120px;" 
                 alt="Property">
          </div>
          <div class="col-md-9">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div>
                <h5 class="fw-bold mb-1 text-dark">${p.title}</h5>
                <div class="d-flex gap-3 small text-muted">
                  <span><i class="fa-solid fa-location-dot me-1"></i>${p.area}, ${p.city}</span>
                  <span><i class="fa-solid fa-tag me-1"></i>${p.type}</span>
                </div>
              </div>
              <div class="text-end">
                <h5 class="text-primary fw-bold mb-1">PKR ${Number(p.price).toLocaleString()}</h5>
                <span class="badge ${p.status === 'approved' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'} border-0 px-3 rounded-pill">
                  ${p.status.toUpperCase()}
                </span>
              </div>
            </div>
            <div class="d-flex gap-2 mt-3">
              <button class="btn btn-sm btn-light border px-4 edit-listing fw-bold" data-id="${p.id}"><i class="fa-solid fa-pen-to-square me-2"></i>Edit</button>
              <button class="btn btn-sm btn-outline-danger px-4 delete-listing fw-bold" data-id="${p.id}"><i class="fa-solid fa-trash-can me-2"></i>Delete</button>
              <div class="ms-auto d-flex align-items-center text-muted small">
                <i class="fa-solid fa-eye me-1 text-primary"></i> ${noshahi.getViews(p.id)} views
              </div>
            </div>
          </div>
        </div>
      </div>
    `).join("");

    myListings.querySelectorAll(".delete-listing").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        if (confirm("Are you sure you want to delete this listing?")) {
          const filtered = noshahi.getCustomListings().filter(p => p.id !== id);
          noshahi.setCustomListings(filtered);
          renderMyListings();
          renderStats();
          window.noshahiAlert("Deleted", "Listing removed.", "success");
        }
      });
    });

    myListings.querySelectorAll(".edit-listing").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        const p = noshahi.getCustomListings().find(x => x.id === id);
        if (p) {
          document.getElementById("editId").value = p.id;
          document.getElementById("editTitle").value = p.title;
          document.getElementById("editCity").value = p.city;
          document.getElementById("editArea").value = p.area;
          document.getElementById("editPrice").value = p.price;
          document.getElementById("editType").value = p.type;
          currentEditImg = p.image || "";
          if (currentEditImg) {
            editImgPreview.src = currentEditImg;
            editImgPreview.classList.remove('d-none');
          } else {
            editImgPreview.classList.add('d-none');
          }
          document.getElementById("editStatus").value = p.status;
          new bootstrap.Modal(document.getElementById('editModal')).show();
        }
      });
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const cityVal = lookupCity(document.getElementById("city").value);
    if (!cityVal) {
      window.noshahiAlert("Required", "Select a valid city.", "warning");
      return;
    }

    const item = {
      id: Date.now(),
      agentEmail: user.email,
      title: document.getElementById("title").value.trim(),
      city: cityVal,
      area: document.getElementById("area").value.trim(),
      type: document.getElementById("type").value,
      intent: document.getElementById("intent").value,
      price: Number(document.getElementById("price").value),
      beds: Number(document.getElementById("beds").value || 0),
      baths: Number(document.getElementById("baths").value || 0),
      image: currentNewImg,
      phone: document.getElementById("phone").value.trim(),
      whatsapp: document.getElementById("whatsapp").value.trim(),
      featured: document.getElementById("featured").checked,
      status: "pending"
    };

    const list = noshahi.getCustomListings();
    list.unshift(item);
    noshahi.setCustomListings(list);
    form.reset();
    currentNewImg = "";
    imgPreviewContainer.innerHTML = '<i class="fa-solid fa-camera text-muted opacity-50"></i>';
    if (user.phone) {
      document.getElementById("phone").value = user.phone;
      document.getElementById("whatsapp").value = user.phone;
    }
    renderMyListings();
    renderStats();
    window.noshahiAlert("Success", "Listing submitted!", "success");
  });

  editForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = Number(document.getElementById("editId").value);
    const all = noshahi.getCustomListings();
    const idx = all.findIndex(x => x.id === id);
    if (idx >= 0) {
      all[idx].title = document.getElementById("editTitle").value.trim();
      all[idx].city = document.getElementById("editCity").value.trim();
      all[idx].area = document.getElementById("editArea").value.trim();
      all[idx].price = Number(document.getElementById("editPrice").value);
      all[idx].type = document.getElementById("editType").value;
      all[idx].image = currentEditImg;
      all[idx].status = document.getElementById("editStatus").value;
      noshahi.setCustomListings(all);
      bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
      renderMyListings();
      renderStats();
      window.noshahiAlert("Updated", "Listing saved.", "success");
    }
  });

  // Suggestion Engine
  const cityIn = document.getElementById("city");
  const cityOpts = document.getElementById("cityOptions");
  function renderCitySug(query) {
    const matches = window.noshahiData.cities.filter(c => normalize(c).includes(normalize(query))).slice(0, 10);
    cityOpts.innerHTML = matches.map(c => `<button type='button' class='list-group-item list-group-item-action' data-city='${c}'>${c}</button>`).join("");
    cityOpts.classList.toggle("show", matches.length > 0 && query.length > 0);
  }
  cityIn.addEventListener("input", (e) => renderCitySug(e.target.value));
  cityOpts.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-city]");
    if (btn) {
      cityIn.value = btn.dataset.city;
      cityOpts.classList.remove("show");
    }
  });

  // INITIALIZE
  if (user.phone) {
    document.getElementById("phone").value = user.phone;
    document.getElementById("whatsapp").value = user.phone;
  }

  // Demo Seed
  const currentLeads = noshahi.getLeads();
  if (!currentLeads.some(l => l.agentEmail === user.email)) {
    noshahi.saveLead({
      agentEmail: user.email,
      name: "Hamza Khan",
      propertyTitle: "Initial Villa Project",
      phone: "03221234567",
      message: "Interested in the layout plan. Please call."
    });
  }

  renderStats();
  renderMyListings();
  renderLeads();
})();
