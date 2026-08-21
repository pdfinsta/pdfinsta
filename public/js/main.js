let allProducts = [];
let activeFilter = { q: '' };

async function loadProducts() {
  const grid = document.getElementById('grid');
  const count = document.getElementById('count');
  try {
    const res = await fetch('/api/products');
    allProducts = await res.json();
    applyFilterAndRender();
  } catch (err) {
    grid.innerHTML = '<div class="empty">Could not load the catalog. Please refresh.</div>';
    count.textContent = '';
  }
}

// Word-level match: the product shows up if ANY word from the search
// matches (or is contained in) any word of the title/category.
function matchesQuery(product, query) {
  if (!query) return true;
  const queryWords = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!queryWords.length) return true;

  const titleWords = (product.title || '').toLowerCase().split(/\s+/).filter(Boolean);
  const catWords = (product.category || '').toLowerCase().split(/\s+/).filter(Boolean);
  const haystackWords = titleWords.concat(catWords);

  return queryWords.some(qw =>
    haystackWords.some(hw => hw.includes(qw) || qw.includes(hw))
  );
}

function applyFilterAndRender() {
  const grid = document.getElementById('grid');
  const count = document.getElementById('count');
  const heading = document.getElementById('catalogHeading');

  let list = allProducts;
  if (activeFilter.q) {
    list = list.filter(p => matchesQuery(p, activeFilter.q));
  }

  if (heading) heading.textContent = activeFilter.q ? `Results for "${activeFilter.q}"` : 'Books';

  if (!allProducts.length) {
    grid.innerHTML = '<div class="empty">No titles published yet. Check back soon.</div>';
    count.textContent = '0 titles';
    return;
  }
  if (!list.length) {
    grid.innerHTML = '<div class="empty">No titles match that search. Try another keyword.</div>';
    count.textContent = '0 titles';
    return;
  }

  count.textContent = `${list.length} title${list.length > 1 ? 's' : ''}`;
  grid.innerHTML = list.map(renderCard).join('');
}

function renderCard(p) {
  return `
    <a class="card" href="/product.html?id=${p._id}">
      <div class="stamp"><span class="cur">৳</span><span class="amt">${p.price}</span></div>
      <div class="cover"><img src="${escapeAttr(p.coverImage)}" alt="${escapeAttr(p.title)}" loading="lazy"></div>
      <div class="body">
        <span class="cat">${escapeHtml(p.category || 'General')}</span>
        <h3>${escapeHtml(p.title)}</h3>
        <p class="desc">${escapeHtml(truncate(p.description, 90))}</p>
      </div>
    </a>
  `;
}

function truncate(s, n) { return s && s.length > n ? s.slice(0, n).trim() + '…' : (s || ''); }
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function escapeAttr(s) { return escapeHtml(s); }

// Search bar — updates results live as you type, and on submit
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');

if (searchForm) {
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    activeFilter.q = searchInput.value.trim();
    applyFilterAndRender();
    document.getElementById('catalog').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

if (searchInput) {
  searchInput.addEventListener('input', () => {
    activeFilter.q = searchInput.value.trim();
    applyFilterAndRender();
  });
}

loadProducts();
