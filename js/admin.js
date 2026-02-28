(function () {
  const pendingTable = document.getElementById("pendingTable");
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
    if (!pendingTable) return;
    const listings = window.noshahiStore.getCustomListings().filter((p) => p.status === "pending");
    const agents = window.noshahiStore.getUsers().filter((u) => u.role === "agent" && u.status === "pending");

    let html = "";

    // Render Agents first as they are high priority
    agents.forEach(a => {
      html += `
        <div class="p-4 bg-white border border-primary border-opacity-25 rounded-3 mb-4 shadow-sm">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <span class="badge bg-primary mb-2 px-3 py-2 rounded-pill">New Agent Registration</span>
              <h4 class="mb-1 fw-bold">${a.name}</h4>
              <p class="text-muted small mb-0"><i class="fa-solid fa-envelope me-2"></i>${a.email}</p>
              <p class="text-muted small mb-0"><i class="fa-solid fa-phone me-2"></i>${a.phone}</p>
            </div>
            <div class="text-end">
              <span class="badge bg-light text-dark border mb-1">${a.experience} Years Exp</span>
              <br>
              <span class="badge bg-light text-dark border">${a.specialty} Specialist</span>
            </div>
          </div>
          <div class="bg-light p-3 rounded-3 mb-3 border-start border-primary border-4">
             <div class="row g-2">
                <div class="col-6">
                  <small class="text-muted d-block">Agency</small>
                  <span class="fw-bold">${a.agency}</span>
                </div>
                <div class="col-6 text-end">
                  <small class="text-muted d-block">Operating City</small>
                  <span class="fw-bold">${a.city}</span>
                </div>
             </div>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-success w-100 py-2 fw-bold approve-agent" data-email="${a.email}"><i class="fa-solid fa-check me-2"></i>Verify & Approve Agent</button>
            <button class="btn btn-outline-danger py-2" title="Reject"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>`;
    });

    listings.forEach(p => {
      html += `
        <div class="p-3 bg-light rounded-3 d-flex justify-content-between align-items-center mb-2 shadow-sm">
          <div>
            <span class="badge bg-secondary mb-1">Property Listing</span>
            <p class="fw-bold mb-0">${p.title}</p>
            <small class="text-muted"><i class="fa-solid fa-location-dot me-1"></i>${p.city}</small>
          </div>
          <div class="actions d-flex gap-2">
            <button class="btn btn-success btn-sm ok" data-id="${p.id}"><i class="fa-solid fa-check me-1"></i>Approve</button>
            <button class="btn btn-danger btn-sm hold" data-id="${p.id}"><i class="fa-solid fa-xmark me-1"></i>Reject</button>
          </div>
        </div>`;
    });

    if (!html) html = "<p class='text-muted italic p-3 text-center'>No pending approvals in the queue.</p>";

    pendingTable.innerHTML = html;
    const modalQueue = document.getElementById("modalListingsQueue");
    if (modalQueue) modalQueue.innerHTML = html;

    // Listeners for listings
    document.querySelectorAll("button[data-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const status = btn.classList.contains("ok") ? "approved" : "rejected";
        setStatus(Number(btn.dataset.id), status);
      });
    });

    // Listeners for agent verification
    document.querySelectorAll(".approve-agent").forEach(btn => {
      btn.addEventListener("click", () => {
        const email = btn.dataset.email;
        const users = window.noshahiStore.getUsers();
        const user = users.find(u => u.email === email);
        if (user) {
          user.status = 'approved';
          window.noshahiStore.updateUser(user);
          window.noshahiAlert("Agent Verified", `${user.name} can now list properties.`, "success");
          if (pendingTable) renderPending();
  renderApprovedAgents();
        }
      });
    });
  }

  function renderApprovedAgents() {
    const directory = document.getElementById("agentDirectory");
    if (!directory) return;

    const agents = window.noshahiStore.getUsers().filter(u => u.role === 'agent' && u.status === 'approved');

    directory.innerHTML = agents.length
      ? agents.map(a => {
        // Prepare the info HTML string for the alert
        const infoHtml = `
          <div class='text-start mt-2'>
            <div class='d-flex justify-content-between mb-2 border-bottom pb-2'>
              <span class='text-muted small'>Phone</span>
              <span class='fw-bold text-dark'>${a.phone}</span>
            </div>
            <div class='d-flex justify-content-between mb-2 border-bottom pb-2'>
              <span class='text-muted small'>Experience</span>
              <span class='fw-bold text-dark'>${a.experience} Years</span>
            </div>
            <div class='d-flex justify-content-between'>
              <span class='text-muted small'>Specialty</span>
              <span class='fw-bold text-dark'>${a.specialty}</span>
            </div>
          </div>
        `.replace(/\s+/g, ' ').trim().replace(/'/g, "\\'");

        return `
        <div class="col-md-4">
          <div class="p-3 bg-white border rounded-4 shadow-sm h-100 transition-up">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h6 class="fw-bold mb-0 text-dark">${a.name}</h6>
              <span class="badge bg-success-subtle text-success border-0 rounded-pill px-3">Verified</span>
            </div>
            <div class="mb-3">
              <p class="small text-muted mb-1"><i class="fa-solid fa-building me-2"></i>${a.agency}</p>
              <p class="small text-muted mb-0"><i class="fa-solid fa-location-dot me-2"></i>${a.city}</p>
            </div>
            <div class="d-flex gap-2">
               <button class="btn btn-sm btn-light border w-100 fw-bold py-2" onclick="window.noshahiAlert('Partner Profile', '${infoHtml}', 'info')">
                 <i class="fa-solid fa-eye me-2"></i>Details
               </button>
               <a href="tel:${a.phone}" class="btn btn-sm btn-primary px-3 py-2">
                 <i class="fa-solid fa-phone"></i>
               </a>
            </div>
          </div>
        </div>`;
      }).join("")
      : "<div class='col-12 py-5 text-center text-muted border border-dashed rounded-4 bg-light'>No verified partners in the directory yet.</div>";
  }

  function renderStats() {
    if (!kpiListings) return;
    const total = window.noshahiStore.allListings().filter((x) => x.status !== "rejected").length;
    kpiListings.textContent = total;
  }

  if (locations) {
    locations.innerHTML = window.noshahiData.cities.map((c) => `<div class="city-card">${c}</div>`).join("");
  }

  function renderAdminLeads() {
    const list = document.getElementById("adminLeadList");
    const count = document.getElementById("adminLeadCount");
    if (!list) return;

    const leads = window.noshahiStore.getLeads().filter(l => l.agentEmail === "admin@noshahi.pk");
    if (count) count.textContent = leads.length;

    if (!leads.length) {
      list.innerHTML = `
        <div class="p-5 text-center text-muted border border-dashed rounded-4 bg-light">
          <i class="fa-solid fa-inbox fa-3x mb-3 opacity-25"></i>
          <p>No inquiries received yet.</p>
        </div>`;
      return;
    }

    list.innerHTML = leads.map(l => `
      <div class="p-3 bg-white border rounded-3 mb-2 shadow-sm">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h6 class="fw-bold mb-0">${l.name}</h6>
            <small class="text-muted"><i class="fa-solid fa-house-user me-1"></i>${l.propertyTitle} (Upcoming Project)</small>
          </div>
          <span class="badge ${l.status === 'new' ? 'bg-primary' : 'bg-success-subtle text-success border-0'} rounded-pill">
            ${l.status === 'new' ? 'New Inquiry' : 'Contacted'}
          </span>
        </div>
        <p class="small text-dark mb-3 border-start ps-2 py-1 bg-light">${l.message}</p>
        <div class="d-flex gap-2">
          ${l.status === 'new' ?
        `<button class="btn btn-sm btn-primary flex-grow-1 respond-lead" data-id="${l.id}">Mark Contacted</button>` :
        `<button class="btn btn-sm btn-light border flex-grow-1" disabled><i class="fa-solid fa-check me-1"></i>Contacted</button>`
      }
          <a href="tel:${l.phone || '03001234567'}" class="btn btn-sm btn-outline-secondary"><i class="fa-solid fa-phone"></i></a>
        </div>
      </div>
    `).join("");

    list.querySelectorAll(".respond-lead").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        const allLeads = window.noshahiStore.getLeads();
        const lead = allLeads.find(l => l.id === id);
        if (lead) {
          const reply = prompt(`Reply to ${lead.name}:`, `Hi ${lead.name}, thank you for your inquiry about ${lead.propertyTitle}. We will send you the project brochure shortly!`);
          if (reply) {
            lead.status = 'responded';
            lead.replyMessage = reply;
            window.noshahiStore.updateLead(lead);
            window.noshahiAlert("Status Updated", "Reply sent and lead marked as contacted.", "success");
            renderAdminLeads();
          }
        }
      });
    });
  }

  if (pendingTable) renderPending();
  renderApprovedAgents();
  renderStats();
  renderAdminLeads();
})();

// Opens the Inbound Requests modal
function openInboundModal() {
  const modalEl = document.getElementById('inboundModal');
  if (!modalEl) {
    window.location.href = 'admin-inbound.html';
    return;
  }
  new bootstrap.Modal(modalEl).show();
}

// ============================================================
// CONTENT CONTROLS
// ============================================================

// ----- HELPERS -----
function getAdminBanners() {
  return JSON.parse(localStorage.getItem('noshahi_banners') || '[]');
}
function saveAdminBanners(banners) {
  localStorage.setItem('noshahi_banners', JSON.stringify(banners));
}
function getAdminBlogs() {
  return JSON.parse(localStorage.getItem('noshahi_blogs') || '[]');
}
function saveAdminBlogs(blogs) {
  localStorage.setItem('noshahi_blogs', JSON.stringify(blogs));
}
function getAdminPlans() {
  const defaults = [
    { name: 'Basic', price: 0, listings: 3, leads: 10 },
    { name: 'Pro', price: 4999, listings: 20, leads: 100 },
    { name: 'Enterprise', price: 14999, listings: 999, leads: 9999 },
  ];
  return JSON.parse(localStorage.getItem('noshahi_plans') || JSON.stringify(defaults));
}
function saveAdminPlans(plans) {
  localStorage.setItem('noshahi_plans', JSON.stringify(plans));
}

// ----- HOMEPAGE BANNERS -----
function openBannersModal() {
  const modalEl = document.getElementById('bannersModal');
  if (!modalEl) {
    window.location.href = 'admin-content.html';
    return;
  }
  new bootstrap.Modal(modalEl).show();
  renderBanners();

  const addBtn = document.getElementById('addBannerBtn');
  if (!addBtn) return;

  addBtn.onclick = () => {
    const url = document.getElementById('bannerUrlInput').value.trim();
    if (!url) return;
    const banners = getAdminBanners();
    banners.push({ url, active: true, id: Date.now() });
    saveAdminBanners(banners);
    document.getElementById('bannerUrlInput').value = '';
    renderBanners();
    window.noshahiAlert('Banner Added', 'New banner saved. It will appear on the homepage.', 'success');
  };
}

function renderBanners() {
  const list = document.getElementById('bannerList');
  if (!list) return;
  const banners = getAdminBanners();
  if (!banners.length) {
    list.innerHTML = '<p class="text-muted text-center small py-3">No banners added yet.</p>';
    return;
  }
  list.innerHTML = banners.map(b => `
    <div class="d-flex align-items-center gap-3 p-2 border rounded-3 bg-light">
      <img src="${b.url}" alt="banner" style="width:80px;height:50px;object-fit:cover;border-radius:6px;"
        onerror="this.src='https://placehold.co/80x50?text=Error'">
      <div class="flex-grow-1 text-truncate small text-muted">${b.url}</div>
      <div class="form-check form-switch mb-0">
        <input class="form-check-input banner-toggle" type="checkbox" data-id="${b.id}" ${b.active ? 'checked' : ''}>
      </div>
      <button class="btn btn-sm btn-outline-danger del-banner" data-id="${b.id}"><i class="fa-solid fa-trash"></i></button>
    </div>
  `).join('');

  list.querySelectorAll('.banner-toggle').forEach(el => {
    el.addEventListener('change', () => {
      const banners = getAdminBanners();
      const b = banners.find(x => x.id == el.dataset.id);
      if (b) { b.active = el.checked; saveAdminBanners(banners); }
    });
  });

  list.querySelectorAll('.del-banner').forEach(btn => {
    btn.addEventListener('click', () => {
      let banners = getAdminBanners();
      banners = banners.filter(x => x.id != btn.dataset.id);
      saveAdminBanners(banners);
      renderBanners();
    });
  });
}

// ----- SUBSCRIPTION PLANS -----
function openPlansModal() {
  const modalEl = document.getElementById('plansModal');
  if (!modalEl) {
    window.location.href = 'admin-content.html';
    return;
  }
  new bootstrap.Modal(modalEl).show();
  renderPlans();
}

function renderPlans() {
  const plans = getAdminPlans();
  const tbody = document.getElementById('plansTableBody');
  if (!tbody) return;
  tbody.innerHTML = plans.map((p, i) => `
    <tr>
      <td><strong>${p.name}</strong></td>
      <td id="price_${i}">${p.price.toLocaleString()}</td>
      <td id="listings_${i}">${p.listings === 999 ? 'Unlimited' : p.listings}</td>
      <td id="leads_${i}">${p.leads === 9999 ? 'Unlimited' : p.leads}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary edit-plan" data-i="${i}">
          <i class="fa-solid fa-pen me-1"></i>Edit
        </button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.edit-plan').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.i);
      const plans = getAdminPlans();
      const p = plans[i];
      const newPrice = prompt(`New price for "${p.name}" plan (PKR/month):`, p.price);
      const newListings = prompt(`Max listings for "${p.name}" plan:`, p.listings);
      const newLeads = prompt(`Max leads for "${p.name}" plan:`, p.leads);
      if (newPrice !== null) {
        p.price = Number(newPrice) || p.price;
        p.listings = Number(newListings) || p.listings;
        p.leads = Number(newLeads) || p.leads;
        saveAdminPlans(plans);
        renderPlans();
        window.noshahiAlert('Plan Updated', `${p.name} plan saved.`, 'success');
      }
    });
  });
}

// ----- BLOG MODERATION -----
function openBlogsModal() {
  const modalEl = document.getElementById('blogsModal');
  if (!modalEl) {
    window.location.href = 'admin-content.html';
    return;
  }
  new bootstrap.Modal(modalEl).show();
  renderBlogPosts();

  const publishBtn = document.getElementById('publishBlogBtn');
  if (!publishBtn) return;

  publishBtn.onclick = () => {
    const title = document.getElementById('blogTitle').value.trim();
    const category = document.getElementById('blogCategory').value;
    const content = document.getElementById('blogContent').value.trim();
    if (!title || !content) {
      window.noshahiAlert('Missing Fields', 'Please enter a title and content.', 'warning');
      return;
    }
    const blogs = getAdminBlogs();
    blogs.unshift({ id: Date.now(), title, category, content, date: new Date().toLocaleDateString('en-PK') });
    saveAdminBlogs(blogs);
    document.getElementById('blogTitle').value = '';
    document.getElementById('blogContent').value = '';
    renderBlogPosts();
    window.noshahiAlert('Published!', `"${title}" is now live.`, 'success');
  };
}

function renderBlogPosts() {
  const list = document.getElementById('blogPostsList');
  if (!list) return;
  const blogs = getAdminBlogs();
  if (!blogs.length) {
    list.innerHTML = '<p class="text-muted text-center small py-3">No posts published yet.</p>';
    return;
  }
  list.innerHTML = blogs.map(b => `
    <div class="p-3 border rounded-3 bg-light">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <span class="badge bg-primary-subtle text-primary border-0 mb-1">${b.category}</span>
          <h6 class="fw-bold mb-0">${b.title}</h6>
          <small class="text-muted">${b.date}</small>
        </div>
        <button class="btn btn-sm btn-outline-danger del-blog" data-id="${b.id}"><i class="fa-solid fa-trash"></i></button>
      </div>
      <p class="small text-muted mt-2 mb-0 text-truncate">${b.content}</p>
    </div>
  `).join('');

  list.querySelectorAll('.del-blog').forEach(btn => {
    btn.addEventListener('click', () => {
      let blogs = getAdminBlogs();
      blogs = blogs.filter(x => x.id != btn.dataset.id);
      saveAdminBlogs(blogs);
      renderBlogPosts();
    });
  });
}


