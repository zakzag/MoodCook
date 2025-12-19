
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { config } from './config';

const app = express();
app.use(cors() as any);
app.use(express.json() as any);

// MongoDB Schemas
const DishSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  preparationTime: { type: Number, default: 0 },
  cookingTime: { type: Number, default: 0 },
  category: String,
  imageUrl: String,
  ingredients: [String]
});

const SiteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true }
});

const DishModel = mongoose.model('Dish', DishSchema);
const SiteModel = mongoose.model('Site', SiteSchema);

// Database Connection
mongoose.connect(config.mongodb.uri)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// API Routes
app.get('/api/dishes', async (req, res) => {
  try {
    const dishes = await DishModel.find();
    res.json(dishes);
  } catch (e) {
    res.status(500).json({ error: 'Database fetch failed' });
  }
});

app.post('/api/dishes', async (req, res) => {
  try {
    const dish = new DishModel(req.body);
    await dish.save();
    res.status(201).json(dish);
  } catch (e) {
    res.status(400).json({ error: 'Invalid dish data' });
  }
});

app.delete('/api/dishes/:id', async (req, res) => {
  try {
    await DishModel.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (e) {
    res.status(404).json({ error: 'Dish not found' });
  }
});

app.get('/api/sites', async (req, res) => {
  const sites = await SiteModel.find();
  res.json(sites);
});

app.post('/api/sites', async (req, res) => {
  const site = new SiteModel(req.body);
  await site.save();
  res.status(201).json(site);
});

app.delete('/api/sites/:id', async (req, res) => {
  await SiteModel.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

const PORT = config.api.port;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
