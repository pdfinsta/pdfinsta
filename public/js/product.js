const params = new URLSearchParams(location.search);
const id = params.get('id');

async function load() {
  const content = document.getElementById('content');
  if (!id) { content.innerHTML = '<div class="empty">No product specified.</div>'; return; }

  try {
    const res = await fetch(`/api/products/${id}`);
    if (!res.ok) throw new Error();
    const p = await res.json();

    content.innerHTML = `
      <div class="product-detail">
        <div class="cover-wrap">
          <img src="${escapeAttr(p.coverImage)}" alt="${escapeAttr(p.title)}">
        </div>
        <div>
          <span class="cat">${escapeHtml(p.category || 'General')}</span>
          <h1>${escapeHtml(p.title)}</h1>
          <div class="badge-row">
            <span class="badge">PDF Download</span>
            ${p.pageCount ? `<span class="badge">${p.pageCount} pages</span>` : ''}
            <span class="badge">Instant delivery after payment</span>
          </div>
          <p style="color:var(--ink-soft); font-size:1rem;">${escapeHtml(p.description)}</p>
          <div class="price-block">
            <span class="amount">৳${p.price}</span>
            <span class="label">one-time · BDT</span>
          </div>
          <a class="btn btn-primary btn-block" href="/checkout.html?id=${p._id}">Buy this PDF</a>
        </div>
      </div>
    `;
  } catch (err) {
    content.innerHTML = '<div class="empty">This title could not be found.</div>';
  }
}

function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function escapeAttr(s) { return escapeHtml(s); }

load();
