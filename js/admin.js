(function () {
  const pendingTable = document.getElementById("pendingTable");
  if (!pendingTable) return;

  const kpiListings = document.getElementById("kpiListings");
  const locations = document.getElementById("locations");

  function setStatus(id, status) {
    const all = window.noshahiStore.getCustomListings();
    const index = all.findIndex((p) => p.id === id);
    if (index >= 0) {
      all[index].status = status;
      window.noshahiStore.setCustomListings(all);
      renderPending();
      renderStats();
    }
  }

  function renderPending() {
    const pending = window.noshahiStore.getCustomListings().filter((x) => x.status === "pending");

    pendingTable.innerHTML = pending.length
      ? pending
          .map(
            (p) => `<div class="listing-row">
      <div>
        <strong>${p.title}</strong>
        <p>${p.city} - ${p.area} | ${p.type} | PKR ${Number(p.price).toLocaleString("en-PK")}</p>
      </div>
      <div class="actions">
        <button class="ok" data-id="${p.id}" data-status="approved">Approve</button>
        <button class="hold" data-id="${p.id}" data-status="rejected">Reject</button>
      </div>
    </div>`
          )
          .join("")
      : "<p>No pending listing request.</p>";

    pendingTable.querySelectorAll("button[data-id]").forEach((btn) => {
      btn.addEventListener("click", () => setStatus(Number(btn.dataset.id), btn.dataset.status));
    });
  }

  function renderStats() {
    const total = window.noshahiStore.allListings().filter((x) => x.status !== "rejected").length;
    kpiListings.textContent = total;
  }

  locations.innerHTML = window.noshahiData.cities.map((c) => `<div class="city-card">${c}</div>`).join("");

  renderPending();
  renderStats();
})();
