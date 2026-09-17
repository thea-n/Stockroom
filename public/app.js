const inventoryBody = document.getElementById('inventory-body');
const categoryList = document.getElementById('category-list');
const itemForm = document.getElementById('item-form');
const formPanel = document.getElementById('form-panel');
const formTitle = document.getElementById('form-title');
const newItemBtn = document.getElementById('new-item-btn');
const cancelBtn = document.getElementById('cancel-btn');
const totalItemsEl = document.getElementById('total-items');
const lowStockEl = document.getElementById('low-stock');
const reminderCountEl = document.getElementById('reminder-count');

let inventory = [];

function getReminderUrgency(item) {
  if (!item || !item.reminder || !item.reminder.trim()) return 'none';
  const text = item.reminder.toLowerCase();

  if (text.includes('urgent') || text.includes('immediately') || text.includes('today')) {
    return 'high';
  }

  if (text.includes('soon') || text.includes('before') || text.includes('check')) {
    return 'medium';
  }

  return 'low';
}

function formatQty(item) {
  return `${item.quantity} ${item.unit}`;
}

function buildCategorySummary(items) {
  const categories = new Map();

  items.forEach((item) => {
    const key = item.category || 'General';
    if (!categories.has(key)) {
      categories.set(key, []);
    }
    categories.get(key).push(item);
  });

  return Array.from(categories.entries()).map(([name, itemsInCategory]) => ({
    name,
    count: itemsInCategory.length,
    items: itemsInCategory
  }));
}

function renderCategorySidebar() {
  const summary = buildCategorySummary(inventory);
  categoryList.innerHTML = '';

  summary.forEach((category) => {
    const listItem = document.createElement('li');
    listItem.className = 'category-item';

    const top = document.createElement('div');
    top.className = 'category-header';
    top.innerHTML = `
      <span>${category.name}</span>
      <span class="category-count">${category.count}</span>
    `;

    const itemList = document.createElement('ul');
    itemList.className = 'category-items';

    category.items.forEach((item) => {
      const reminder = getReminderUrgency(item);
      const row = document.createElement('li');
      row.innerHTML = `
        <span>${item.name}</span>
        <span class="reminder-badge ${reminder}"><span class="reminder-dot ${reminder}"></span>${reminder}</span>
      `;
      itemList.appendChild(row);
    });

    listItem.append(top, itemList);
    categoryList.appendChild(listItem);
  });
}

function renderSummary() {
  totalItemsEl.textContent = inventory.length;
  lowStockEl.textContent = inventory.filter((item) => item.quantity <= item.reorderLevel).length;
  reminderCountEl.textContent = inventory.filter((item) => item.reminder && item.reminder.trim()).length;
}

function renderInventory() {
  inventoryBody.innerHTML = '';

  inventory.forEach((item) => {
    const row = document.createElement('tr');
    const lowStock = item.quantity <= item.reorderLevel;
    const reminder = getReminderUrgency(item);

    row.innerHTML = `
      <td>
        <strong>${item.name}</strong>
      </td>
      <td>${item.category}</td>
      <td>
        <span class="stock-pill ${lowStock ? 'low' : ''}">${formatQty(item)}</span>
      </td>
      <td>${item.vendor}</td>
      <td>
        <span class="reminder-status ${reminder}"><span class="reminder-dot ${reminder}"></span>${reminder === 'none' ? 'No reminder' : reminder}</span>
      </td>
      <td>
        ${item.productUrl && item.productUrl !== '#' ? `<a class="link-button" href="${item.productUrl}" target="_blank" rel="noreferrer">View</a>` : '—'}
      </td>
      <td>
        <div class="action-group">
          <button class="action-btn" type="button" data-action="edit" data-id="${item.id}">Edit</button>
          <button class="action-btn delete" type="button" data-action="delete" data-id="${item.id}">Delete</button>
        </div>
      </td>
    `;

    inventoryBody.appendChild(row);
  });

  renderSummary();
  renderCategorySidebar();
}

function resetForm() {
  itemForm.reset();
  document.getElementById('item-id').value = '';
  formTitle.textContent = 'Add inventory item';
  formPanel.classList.add('hidden');
}

function populateForm(item) {
  document.getElementById('item-id').value = item.id;
  document.getElementById('name').value = item.name;
  document.getElementById('category').value = item.category;
  document.getElementById('quantity').value = item.quantity;
  document.getElementById('unit').value = item.unit;
  document.getElementById('reorderLevel').value = item.reorderLevel;
  document.getElementById('vendor').value = item.vendor;
  document.getElementById('productUrl').value = item.productUrl;
  document.getElementById('reminder').value = item.reminder;
  formTitle.textContent = 'Edit inventory item';
  formPanel.classList.remove('hidden');
}

async function loadInventory() {
  const response = await fetch('/api/items');
  inventory = await response.json();
  renderInventory();
}

async function saveItem(event) {
  event.preventDefault();

  const itemId = document.getElementById('item-id').value;
  const payload = {
    name: document.getElementById('name').value,
    category: document.getElementById('category').value,
    quantity: Number(document.getElementById('quantity').value),
    unit: document.getElementById('unit').value,
    reorderLevel: Number(document.getElementById('reorderLevel').value),
    vendor: document.getElementById('vendor').value,
    productUrl: document.getElementById('productUrl').value,
    reminder: document.getElementById('reminder').value,
    lastUpdated: new Date().toISOString().slice(0, 10)
  };

  const method = itemId ? 'PUT' : 'POST';
  const url = itemId ? `/api/items/${itemId}` : '/api/items';

  await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  resetForm();
  await loadInventory();
}

async function handleInventoryAction(event) {
  const target = event.target.closest('[data-action]');
  if (!target) return;

  const { action, id } = target.dataset;

  if (action === 'edit') {
    const item = inventory.find((entry) => entry.id === id);
    if (item) populateForm(item);
    return;
  }

  if (action === 'delete') {
    if (!window.confirm('Delete this item?')) return;
    await fetch(`/api/items/${id}`, { method: 'DELETE' });
    await loadInventory();
  }
}

newItemBtn.addEventListener('click', () => {
  formPanel.classList.remove('hidden');
  formTitle.textContent = 'Add inventory item';
  itemForm.reset();
  document.getElementById('item-id').value = '';
});

cancelBtn.addEventListener('click', resetForm);
itemForm.addEventListener('submit', saveItem);
inventoryBody.addEventListener('click', handleInventoryAction);

loadInventory();
