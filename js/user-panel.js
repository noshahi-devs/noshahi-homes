(function () {
  const roleInfo = document.getElementById("roleInfo");
  if (!roleInfo) return;

  const savedList = document.getElementById("savedList");
  const alerts = document.getElementById("alerts");
  const roles = {
    Buyer: ["Search verified properties", "Save favorites", "Send WhatsApp/call inquiries"],
    Seller: ["Post property", "Track views and leads", "Upgrade to featured listing"],
    Agent: ["Manage listings", "Respond to clients quickly", "Analyze conversion"],
  };

  function renderRole(name) {
    roleInfo.innerHTML = `<p><strong>${name}</strong> workflow:</p><ul class="list">${roles[name]
      .map((x) => `<li>${x}</li>`)
      .join("")}</ul>`;
  }

  document.querySelectorAll("[data-role]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-role]").forEach((b) => {
        b.classList.remove("btn-primary", "active");
        b.classList.add("btn-secondary");
      });
      btn.classList.remove("btn-secondary");
      btn.classList.add("btn-primary", "active");
      renderRole(btn.dataset.role);
    });
  });

  function renderCart() {
    const cartIds = window.noshahiStore.getCart();
    const all = window.noshahiStore.allListings();
    const items = all.filter(p => cartIds.includes(p.id));

    if (items.length === 0) {
      savedList.innerHTML = '<div class="col-12 text-center p-5"><p class="text-muted">Your inquiry queue is empty. Explore properties and inquire about your favorites!</p><a href="index.html" class="btn btn-primary">Browse Properties</a></div>';
      return;
    }

    savedList.innerHTML = items
      .map((p) => `
        <div class="col-md-6">
          <div class="card p-3 shadow-sm border-0 h-100">
            <h5 class="mb-1 text-truncate">${p.title}</h5>
            <p class="text-muted small mb-3"><i class="fa-solid fa-location-dot me-1"></i>${p.city}</p>
            <div class="d-flex justify-content-between align-items-center">
              <span class="fw-bold text-primary">PKR ${Number(p.price).toLocaleString("en-PK")}</span>
              <button class="btn btn-sm btn-outline-danger remove-cart" data-id="${p.id}">Remove</button>
            </div>
          </div>
        </div>
      `).join("");

    // Add a purchase section
    savedList.insertAdjacentHTML("afterend", `
      <div id="purchaseAction" class="mt-4 p-4 bg-primary text-white rounded-4 shadow-lg text-center">
        <h4>Ready to secure your dream home?</h4>
        <p class="mb-4 opacity-75">Submit your formal inquiry and an agent will contact you within 24 hours.</p>
        <button id="btnPurchase" class="btn btn-light btn-lg px-5 fw-bold">Proceed to Purchase/Inquiry</button>
      </div>
    `);

    document.getElementById("btnPurchase").addEventListener("click", () => {
      const actionDiv = document.getElementById("purchaseAction");
      actionDiv.innerHTML = `
        <div class="py-3">
          <i class="fa-solid fa-circle-check fa-3x mb-3 text-white"></i>
          <h3>Inquiry Submitted!</h3>
          <p>Your request for ${items.length} units has been sent to our verified agents.</p>
          <button class="btn btn-outline-light mt-2" onclick="location.reload()">Back to Dashboard</button>
        </div>
      `;
      window.noshahiStore.clearCart();
    });

    savedList.querySelectorAll(".remove-cart").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        const cart = window.noshahiStore.getCart().filter(cid => cid !== id);
        localStorage.setItem("noshahi_cart", JSON.stringify(cart));
        location.reload();
      });
    });
  }

  const listings = window.noshahiStore.allListings().slice(0, 4);
  renderCart();

  alerts.innerHTML = window.noshahiData.leads.map((x) => `
    <div class="list-group-item border-0 px-0 py-3 border-bottom">
      <div class="d-flex w-100 justify-content-between">
        <h6 class="mb-1 fw-bold">${x.split(" asked")[0].split(" wants")[0].split(" requested")[0]}</h6>
        <small class="text-muted">Just now</small>
      </div>
      <p class="mb-1 text-muted small">${x}</p>
    </div>
  `).join("");
  renderRole("Buyer");
})();
