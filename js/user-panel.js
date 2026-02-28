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

      // Get current user (buyer)
      const currentUser = window.noshahiStore.getCurrentUser() || { name: "Guest User", email: "guest@example.com", phone: "03000000000" };

      // Generate a lead for each item in the cart
      items.forEach(item => {
        window.noshahiStore.saveLead({
          buyerEmail: currentUser.email,
          agentEmail: item.agentEmail || "admin@noshahi.pk", // Fallback if no agent is set
          name: currentUser.name,
          propertyTitle: item.title,
          propertyId: item.id,
          phone: currentUser.phone || "03000000000",
          message: `I am highly interested in purchasing ${item.title} located in ${item.city}, ${item.area}. Please contact me.`
        });
      });

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

  const currentUser = window.noshahiStore.getCurrentUser();
  const currentEmail = currentUser ? currentUser.email : "guest@example.com";

  // Get leads specifically for this buyer
  const myLeads = window.noshahiStore.getLeads().filter(l => l.buyerEmail === currentEmail);

  if (myLeads.length === 0) {
    alerts.innerHTML = `
      <div class="list-group-item border-0 p-4 text-center text-muted bg-light rounded-3 mt-2">
        <i class="fa-solid fa-bell-slash fa-2x mb-2 opacity-50"></i>
        <p class="small mb-0">No recent activity. Inquire about a property to get started!</p>
      </div>
    `;
  } else {
    // Sort leads to show newest first
    myLeads.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    alerts.innerHTML = myLeads.map((x) => `
      <div class="list-group-item border-0 px-0 py-3 border-bottom">
        <div class="d-flex w-100 justify-content-between">
          <h6 class="mb-1 fw-bold text-truncate" style="max-width: 70%;">${x.propertyTitle}</h6>
          <span class="badge ${x.status === 'responded' ? 'bg-success' : 'bg-secondary'} rounded-pill" style="font-size: 0.65rem;">
            ${x.status === 'responded' ? 'Reply Received' : 'Pending Response'}
          </span>
        </div>
        <p class="mb-2 text-muted small">You inquired about this property.</p>
        ${x.status === 'responded' && x.replyMessage ? `
          <div class="bg-success-subtle p-3 rounded-3 mt-2 border border-success-subtle">
            <div class="d-flex gap-2">
              <i class="fa-solid fa-reply text-success mt-1"></i>
              <div>
                <span class="d-block small fw-bold text-success mb-1">Agent Reply:</span>
                <p class="small text-dark mb-0">${x.replyMessage}</p>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `).join("");
  }

  renderRole("Buyer");
})();
