const test = require('node:test');
const assert = require('node:assert/strict');

function buildCategorySummary(items) {
  const categories = new Map();

  for (const item of items) {
    const key = item.category || 'General';
    if (!categories.has(key)) {
      categories.set(key, []);
    }
    categories.get(key).push(item);
  }

  return Array.from(categories.entries()).map(([name, itemsInCategory]) => ({
    name,
    count: itemsInCategory.length,
    items: itemsInCategory
  }));
}

function getReminderUrgency(item) {
  if (!item || !item.reminder) return 'none';
  const lower = item.reminder.toLowerCase();
  if (lower.includes('urgent') || lower.includes('immediately') || lower.includes('today')) return 'high';
  if (lower.includes('soon') || lower.includes('before') || lower.includes('check')) return 'medium';
  return 'low';
}

test('groups inventory items by category', () => {
  const items = [
    { id: '1', category: 'Supplies', name: 'Paper' },
    { id: '2', category: 'Supplies', name: 'Pens' },
    { id: '3', category: 'Electronics', name: 'Dock' }
  ];

  const categorySummary = buildCategorySummary(items);

  assert.deepEqual(categorySummary, [
    { name: 'Supplies', count: 2, items: [items[0], items[1]] },
    { name: 'Electronics', count: 1, items: [items[2]] }
  ]);
});

test('maps reminder text to urgency levels', () => {
  assert.equal(getReminderUrgency({ reminder: 'Urgent: order before noon' }), 'high');
  assert.equal(getReminderUrgency({ reminder: 'Check stock before Friday' }), 'medium');
  assert.equal(getReminderUrgency({ reminder: 'Monitor weekly usage' }), 'low');
  assert.equal(getReminderUrgency({ reminder: '' }), 'none');
});
