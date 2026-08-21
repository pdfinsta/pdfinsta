// ---- Auth guard ----
async function checkAuth() {
  const res = await fetch('/api/admin/session');
  const data = await res.json();
  if (!data.isAdmin) window.location.href = '/admin/login.html';
}
checkAuth();

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/api/admin/logout', { method: 'POST' });
  window.location.href = '/admin/login.html';
});

// ---- Tabs ----
document.querySelectorAll('.tab[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab[data-tab]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-products').style.display = btn.dataset.tab === 'products' ? 'block' : 'none';
    document.getElementById('tab-orders').style.display = btn.dataset.tab === 'orders' ? 'block' : 'none';
    if (btn.dataset.tab === 'orders') loadOrders();
  });
});

// ---- Products ----
const productModalBackdrop = document.getElementById('productModalBackdrop');
const productForm = document.getElementById('productForm');
const msgBox = document.getElementById('msgBox');

document.getElementById('addProductBtn').addEventListener('click', () => openProductModal());
document.getElementById('cancelModalBtn').addEventListener('click', () => closeProductModal());

function openProductModal(p) {
  document.getElementById('modalTitle').textContent = p ? 'Edit product' : 'Add product';
  document.getElementById('productId').value = p ? p._id : '';
  document.getElementById('title').value = p ? p.title : '';
  document.getElementById('description').value = p ? p.description : '';
  document.getElementById('price').value = p ? p.price : '';
  document.getElementById('category').value = p ? p.category : '';
  document.getElementById('pageCount').value = p && p.pageCount ? p.pageCount : '';
  document.getElementById('coverImage').value = p ? p.coverImage : '';
  document.getElementById('driveLink').value = p ? p.driveLink : '';
  productModalBackdrop.style.display = 'flex';
}
function closeProductModal() { productModalBackdrop.style.display = 'none'; productForm.reset(); }

productForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('productId').value;
  const payload = {
    title: document.getElementById('title').value.trim(),
    description: document.getElementById('description').value.trim(),
    price: Number(document.getElementById('price').value),
    category: document.getElementById('category').value.trim() || 'General',
    pageCount: document.getElementById('pageCount').value ? Number(document.getElementById('pageCount').value) : undefined,
    coverImage: document.getElementById('coverImage').value.trim(),
    driveLink: document.getElementById('driveLink').value.trim()
  };
  try {
    const res = await fetch(id ? `/api/admin/products/${id}` : '/api/admin/products', {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not save product');
    closeProductModal();
    loadProducts();
  } catch (err) {
    msgBox.innerHTML = `<div class="msg error">${err.message}</div>`;
  }
});

async function loadProducts() {
  const tbody = document.querySelector('#productsTable tbody');
  tbody.innerHTML = '<tr><td colspan="6">Loading…</td></tr>';
  const res = await fetch('/api/admin/products');
  const products = await res.json();
  if (!products.length) {
    tbody.innerHTML = '<tr><td colspan="6">No products yet. Click "Add product" to publish your first PDF.</td></tr>';
    return;
  }
  tbody.innerHTML = products.map(p => `
    <tr>
      <td><img src="${escapeAttr(p.coverImage)}" alt="" style="width:44px;height:44px;object-fit:cover;border-radius:4px;"></td>
      <td>${escapeHtml(p.title)}</td>
      <td>${escapeHtml(p.category || '')}</td>
      <td>৳${p.price}</td>
      <td><span class="pill ${p.active ? 'approved' : 'rejected'}">${p.active ? 'Active' : 'Hidden'}</span></td>
      <td style="white-space:nowrap;">
        <button class="btn btn-outline" style="padding:6px 10px;" data-edit="${p._id}">Edit</button>
        <button class="btn btn-outline" style="padding:6px 10px;" data-toggle="${p._id}" data-active="${p.active}">${p.active ? 'Hide' : 'Show'}</button>
        <button class="btn btn-outline" style="padding:6px 10px;color:var(--danger);" data-delete="${p._id}">Delete</button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', async () => {
    const p = products.find(x => x._id === btn.dataset.edit);
    openProductModal(p);
  }));
  tbody.querySelectorAll('[data-toggle]').forEach(btn => btn.addEventListener('click', async () => {
    const active = btn.dataset.active === 'true';
    await fetch(`/api/admin/products/${btn.dataset.toggle}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active })
    });
    loadProducts();
  }));
  tbody.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', async () => {
    if (!confirm('Delete this product permanently?')) return;
    await fetch(`/api/admin/products/${btn.dataset.delete}`, { method: 'DELETE' });
    loadProducts();
  }));
}

// ---- Orders ----
async function loadOrders() {
  const tbody = document.querySelector('#ordersTable tbody');
  tbody.innerHTML = '<tr><td colspan="7">Loading…</td></tr>';
  const res = await fetch('/api/admin/orders');
  const orders = await res.json();
  if (!orders.length) {
    tbody.innerHTML = '<tr><td colspan="7">No orders yet.</td></tr>';
    return;
  }
  tbody.innerHTML = orders.map(o => `
    <tr>
      <td class="mono">${o.orderId}</td>
      <td>${escapeHtml(o.productTitle)}</td>
      <td>${escapeHtml(o.buyerName)}<br><span style="color:var(--ink-soft);font-size:0.8rem;">${escapeHtml(o.buyerEmail)}</span></td>
      <td>${o.paymentMethod}</td>
      <td>৳${o.amount}</td>
      <td><span class="pill ${o.status}">${o.status}</span></td>
      <td>${o.paymentMethod === 'manual' && o.status === 'pending' ? `<button class="btn btn-outline" style="padding:6px 10px;" data-review="${o._id}">Review</button>` : ''}</td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-review]').forEach(btn => btn.addEventListener('click', () => {
    const o = orders.find(x => x._id === btn.dataset.review);
    openOrderModal(o);
  }));
}

const orderModalBackdrop = document.getElementById('orderModalBackdrop');
function openOrderModal(o) {
  document.getElementById('orderModalBody').innerHTML = `
    <h2>Review manual payment</h2>
    <p class="order-id-tag">${o.orderId}</p>
    <table style="box-shadow:none; margin-bottom:16px;">
      <tr><th>Product</th><td>${escapeHtml(o.productTitle)}</td></tr>
      <tr><th>Amount</th><td>৳${o.amount}</td></tr>
      <tr><th>Buyer</th><td>${escapeHtml(o.buyerName)} (${escapeHtml(o.buyerEmail)}, ${escapeHtml(o.buyerPhone || '')})</td></tr>
      <tr><th>Method</th><td>${escapeHtml(o.manualMethod || '')}</td></tr>
      <tr><th>Sender number</th><td>${escapeHtml(o.manualSender || '')}</td></tr>
      <tr><th>Transaction ID</th><td class="mono">${escapeHtml(o.manualTrxId || '')}</td></tr>
    </table>
    <p class="hint" style="margin-bottom:14px;">Verify this Transaction ID in your bKash/Nagad app before approving.</p>
    <div style="display:flex; gap:10px;">
      <button class="btn btn-outline" id="closeOrderModal" style="flex:1;">Close</button>
      <button class="btn btn-outline" id="rejectOrder" style="flex:1;color:var(--danger);">Reject</button>
      <button class="btn btn-primary" id="approveOrder" style="flex:1;">Approve</button>
    </div>
  `;
  orderModalBackdrop.style.display = 'flex';
  document.getElementById('closeOrderModal').addEventListener('click', () => orderModalBackdrop.style.display = 'none');
  document.getElementById('approveOrder').addEventListener('click', async () => {
    await fetch(`/api/admin/orders/${o._id}/approve`, { method: 'POST' });
    orderModalBackdrop.style.display = 'none';
    loadOrders();
  });
  document.getElementById('rejectOrder').addEventListener('click', async () => {
    await fetch(`/api/admin/orders/${o._id}/reject`, { method: 'POST' });
    orderModalBackdrop.style.display = 'none';
    loadOrders();
  });
}

function escapeHtml(s) { return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function escapeAttr(s) { return escapeHtml(s); }

loadProducts();
