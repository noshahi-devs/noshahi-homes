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
    const list = window.noshahiStore.getCustomListings().filter((p) => p.status === "pending");

    pendingTable.innerHTML = list.length
      ? list
        .map(
          (p) => `<div class="p-3 bg-light rounded-3 d-flex justify-content-between align-items-center mb-2 shadow-sm">
            <div>
              <p class="fw-bold mb-0">${p.title}</p>
              <small class="text-muted"><i class="fa-solid fa-location-dot me-1"></i>${p.city}</small>
            </div>
            <div class="actions d-flex gap-2">
              <button class="btn btn-success btn-sm ok" data-id="${p.id}"><i class="fa-solid fa-check me-1"></i>Approve</button>
              <button class="btn btn-danger btn-sm hold" data-id="${p.id}"><i class="fa-solid fa-xmark me-1"></i>Reject</button>
            </div>
          </div>`
        )
        .join("")
      : "<p class='text-muted italic p-3'>No pending approvals in the queue.</p>";

    pendingTable.querySelectorAll("button[data-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const status = btn.classList.contains("ok") ? "approved" : "rejected";
        setStatus(Number(btn.dataset.id), status);
      });
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
