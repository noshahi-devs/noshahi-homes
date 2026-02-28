(function () {
  const article = document.getElementById("blogArticle");
  if (!article) return;

  const params = new URLSearchParams(window.location.search);
  const blogId = Number(params.get("id"));
  const blogs = window.noshahiData.blogs || [];
  const blog = blogs.find((b) => Number(b.id) === blogId);

  if (!blog) {
    article.innerHTML = `
      <div class="text-center py-5">
        <i class="fa-solid fa-circle-exclamation fa-3x text-warning mb-3"></i>
        <h2 class="h4 mb-2">Insight not found</h2>
        <p class="text-muted mb-4">This article may have been removed or the link is invalid.</p>
        <a href="index.html#blogs" class="btn btn-primary">Go Back to Insights</a>
      </div>
    `;
    return;
  }

  const dateLabel = blog.date || "";
  const readTime = blog.readTime || "";

  article.innerHTML = `
    <div class="mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
      <span class="badge bg-primary-subtle text-primary border-0">${blog.category || "Insights"}</span>
      <small class="text-muted">${dateLabel}${readTime ? ` • ${readTime}` : ""}</small>
    </div>
    <h1 class="h2 mb-3">${blog.title}</h1>
    <p class="text-muted mb-4"><i class="fa-solid fa-user-pen me-2"></i>${blog.author || "Noshahi Team"}</p>
    <div class="border-top pt-4">
      <p class="mb-0" style="line-height:1.9;">${blog.content || "No content available for this article."}</p>
    </div>
  `;
})();
