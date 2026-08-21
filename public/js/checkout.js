const params = new URLSearchParams(location.search);
const id = params.get('id');
let product = null;
let method = 'online';

const btnOnline = document.getElementById('btnOnline');
const btnManual = document.getElementById('btnManual');
const manualFields = document.getElementById('manualFields');
const submitBtn = document.getElementById('submitBtn');
const msgBox = document.getElementById('msgBox');

btnOnline.addEventListener('click', () => setMethod('online'));
btnManual.addEventListener('click', () => setMethod('manual'));

function setMethod(m) {
  method = m;
  btnOnline.classList.toggle('active', m === 'online');
  btnManual.classList.toggle('active', m === 'manual');
  manualFields.style.display = m === 'manual' ? 'block' : 'none';
  submitBtn.textContent = m === 'online' ? 'Continue to payment' : 'Submit payment details';
}

async function loadProduct() {
  if (!id) { showMsg('No product specified.', 'error'); return; }
  try {
    const res = await fetch(`/api/products/${id}`);
    if (!res.ok) throw new Error();
    product = await res.json();
    document.getElementById('productTitle').textContent = `Checkout — ${product.title}`;
    document.getElementById('productPrice').textContent = `৳${product.price}`;
    document.getElementById('manualAmount').textContent = product.price;
  } catch (err) {
    showMsg('This product could not be found.', 'error');
    submitBtn.disabled = true;
  }
}

function showMsg(text, kind) {
  msgBox.innerHTML = `<div class="msg ${kind}">${text}</div>`;
}

if (params.get('failed')) showMsg('Payment failed. Please try again.', 'error');
if (params.get('cancelled')) showMsg('Payment was cancelled.', 'error');

document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!product) return;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Please wait…';

  const buyerName = document.getElementById('buyerName').value.trim();
  const buyerEmail = document.getElementById('buyerEmail').value.trim();
  const buyerPhone = document.getElementById('buyerPhone').value.trim();

  try {
    if (method === 'online') {
      const res = await fetch('/api/orders/online', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: id, buyerName, buyerEmail, buyerPhone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not start payment');
      window.location.href = data.gatewayUrl;
    } else {
      const manualMethod = document.getElementById('manualMethod').value;
      const manualSender = document.getElementById('manualSender').value.trim();
      const manualTrxId = document.getElementById('manualTrxId').value.trim();
      if (!manualSender || !manualTrxId) {
        showMsg('Please fill in your sender number and transaction ID.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit payment details';
        return;
      }
      const res = await fetch('/api/orders/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: id, buyerName, buyerEmail, buyerPhone, manualMethod, manualSender, manualTrxId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not submit order');
      window.location.href = `/success.html?orderId=${data.orderId}&manual=1`;
    }
  } catch (err) {
    showMsg(err.message, 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = method === 'online' ? 'Continue to payment' : 'Submit payment details';
  }
});

loadProduct();
