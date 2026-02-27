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
      document.querySelectorAll("[data-role]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderRole(btn.dataset.role);
    });
  });

  const listings = window.noshahiStore.allListings().slice(0, 4);
  savedList.innerHTML = listings
    .map((p) => `<div class="listing-row"><span>${p.title} (${p.city})</span><span class="badge">${p.intent}</span></div>`)
    .join("");

  alerts.innerHTML = window.noshahiData.leads.map((x) => `<li>${x}</li>`).join("");
  renderRole("Buyer");
})();
