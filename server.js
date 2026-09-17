const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const dataFile = path.join(__dirname, 'data', 'inventory.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readInventory() {
  const raw = fs.readFileSync(dataFile, 'utf8');
  return JSON.parse(raw);
}

function writeInventory(items) {
  fs.writeFileSync(dataFile, JSON.stringify(items, null, 2));
}

app.get('/api/items', (req, res) => {
  try {
    const items = readInventory();
    res.json(items);
  } catch (error) {
    console.error('Failed to read inventory:', error);
    res.status(500).json({ message: 'Unable to read inventory data' });
  }
});

app.post('/api/items', (req, res) => {
  try {
    const payload = req.body;
    const items = readInventory();
    const newItem = {
      id: payload.id || `${Date.now()}`,
      name: payload.name || 'New item',
      category: payload.category || 'General',
      quantity: Number(payload.quantity || 0),
      unit: payload.unit || 'units',
      reorderLevel: Number(payload.reorderLevel || 0),
      vendor: payload.vendor || 'Unknown supplier',
      productUrl: payload.productUrl || '#',
      lastUpdated: payload.lastUpdated || new Date().toISOString().slice(0, 10),
      reminder: payload.reminder || 'No reminder set'
    };

    items.push(newItem);
    writeInventory(items);
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Failed to create inventory item:', error);
    res.status(500).json({ message: 'Unable to add inventory item' });
  }
});

app.put('/api/items/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updated = req.body;
    const items = readInventory();
    const index = items.findIndex((item) => item.id === id);

    if (index === -1) {
      return res.status(404).json({ message: 'Item not found' });
    }

    items[index] = {
      ...items[index],
      ...updated,
      id,
      quantity: Number(updated.quantity ?? items[index].quantity),
      reorderLevel: Number(updated.reorderLevel ?? items[index].reorderLevel),
      lastUpdated: updated.lastUpdated || new Date().toISOString().slice(0, 10)
    };

    writeInventory(items);
    res.json(items[index]);
  } catch (error) {
    console.error('Failed to update inventory item:', error);
    res.status(500).json({ message: 'Unable to update inventory item' });
  }
});

app.delete('/api/items/:id', (req, res) => {
  try {
    const { id } = req.params;
    const items = readInventory();
    const filtered = items.filter((item) => item.id !== id);

    if (filtered.length === items.length) {
      return res.status(404).json({ message: 'Item not found' });
    }

    writeInventory(filtered);
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete inventory item:', error);
    res.status(500).json({ message: 'Unable to delete inventory item' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Stockroom running at http://localhost:${PORT}`);
});
