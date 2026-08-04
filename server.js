const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const defaultPort = Number(process.env.PORT) || 4000;
const contactsFile = path.join(__dirname, 'data', 'contacts.json');
const ratingsFile = path.join(__dirname, 'data', 'ratings.json');
const carsFile = path.join(__dirname, 'data', 'cars.json');
const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'nowarise';
const sessions = new Map();

function normalizeFuelType(value) {
  const normalized = String(value || '').trim().toLowerCase();

  if (['ev', 'electric', 'electric vehicle'].includes(normalized)) {
    return 'Electric';
  }

  if (['petrol', 'gasoline'].includes(normalized)) {
    return 'Petrol';
  }

  if (['cng', 'compressed natural gas'].includes(normalized)) {
    return 'CNG';
  }

  if (['diesel'].includes(normalized)) {
    return 'Diesel';
  }

  return value || 'Petrol';
}

function loadCars() {
  try {
    const cars = fs.existsSync(carsFile)
      ? JSON.parse(fs.readFileSync(carsFile, 'utf8'))
      : [];

    return cars.map(car => ({
      ...car,
      fuelType: normalizeFuelType(car.fuelType)
    }));
  } catch (error) {
    console.error('Failed to load cars:', error);
    return [];
  }
}

function saveCars(cars) {
  fs.writeFileSync(carsFile, JSON.stringify(cars, null, 2), 'utf8');
}

function getSessionToken(req) {
  const cookieHeader = req.headers.cookie || '';
  const cookie = cookieHeader
    .split(';')
    .map(item => item.trim())
    .find(item => item.startsWith('admin_session='));

  return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
}

function requireAdmin(req, res, next) {
  const token = getSessionToken(req);
  if (token && sessions.has(token)) {
    return next();
  }

  if (req.method === 'GET') {
    return res.redirect('/login.html');
  }

  return res.status(401).json({ error: 'Unauthorized' });
}

app.use(cors());
app.use(express.json());

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (username === adminUsername && password === adminPassword) {
    const token = crypto.randomBytes(24).toString('hex');
    sessions.set(token, { username });
    res.setHeader('Set-Cookie', `admin_session=${token}; HttpOnly; Path=/; SameSite=Lax`);
    return res.json({ success: true });
  }

  return res.status(401).json({ error: 'Invalid username or password.' });
});

app.post('/api/logout', (req, res) => {
  const token = getSessionToken(req);
  if (token) {
    sessions.delete(token);
  }

  res.setHeader('Set-Cookie', 'admin_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
  return res.json({ success: true });
});

app.get('/api/cars', (req, res) => {
  res.json(loadCars());
});

app.get('/login', (req, res) => {
  res.redirect('/login.html');
});

app.get('/admin', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin.html', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.post('/api/cars', requireAdmin, (req, res) => {
  const car = req.body;
  if (!car?.brand || !car?.model || !car?.price || !car?.fuelType || !car?.description) {
    return res.status(400).json({ error: 'Brand, model, price, fuel type, and description are required.' });
  }

  try {
    const currentCars = loadCars();
    const newCar = {
      id: car.id || Date.now(),
      brand: car.brand,
      model: car.model,
      price: car.price,
      fuelType: normalizeFuelType(car.fuelType),
      transmission: car.transmission || 'Manual',
      seats: Number(car.seats) || 5,
      mileage: car.mileage || 'N/A',
      rating: Number(car.rating) || 4.0,
      segment: car.segment || 'New',
      imageUrl: car.imageUrl || 'images/car-placeholder.svg',
      description: car.description,
      launchCategory: car.launchCategory || car.fuelType,
      buyUrl: car.buyUrl || '#',
      highlights: Array.isArray(car.highlights)
        ? car.highlights
        : String(car.highlights || '')
            .split(',')
            .map(item => item.trim())
            .filter(Boolean),
      ...car
    };

    currentCars.push(newCar);
    saveCars(currentCars);

    res.status(201).json({ success: true, car: newCar });
  } catch (error) {
    console.error('Failed to save car:', error);
    res.status(500).json({ error: 'Unable to save car at this time.' });
  }
});

app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const newContact = {
    id: Date.now(),
    name,
    email,
    message,
    submittedAt: new Date().toISOString()
  };

  try {
    const currentData = fs.existsSync(contactsFile)
      ? JSON.parse(fs.readFileSync(contactsFile, 'utf8'))
      : [];

    currentData.push(newContact);
    fs.writeFileSync(contactsFile, JSON.stringify(currentData, null, 2), 'utf8');

    res.status(201).json({ success: true, contact: newContact });
  } catch (error) {
    console.error('Failed to save contact:', error);
    res.status(500).json({ error: 'Unable to save contact at this time.' });
  }
});

app.get('/api/ratings', (req, res) => {
  try {
    const ratings = fs.existsSync(ratingsFile)
      ? JSON.parse(fs.readFileSync(ratingsFile, 'utf8'))
      : [];
    res.json(ratings);
  } catch (error) {
    console.error('Failed to load ratings:', error);
    res.status(500).json({ error: 'Unable to load ratings.' });
  }
});

app.post('/api/ratings', (req, res) => {
  const { carId, score, comment } = req.body;
  if (!carId || !score) {
    return res.status(400).json({ error: 'Car ID and rating are required.' });
  }

  const newRating = {
    id: Date.now(),
    carId: Number(carId),
    score: Number(score),
    comment: comment || '',
    createdAt: new Date().toISOString()
  };

  try {
    const currentRatings = fs.existsSync(ratingsFile)
      ? JSON.parse(fs.readFileSync(ratingsFile, 'utf8'))
      : [];

    currentRatings.push(newRating);
    fs.writeFileSync(ratingsFile, JSON.stringify(currentRatings, null, 2), 'utf8');

    res.status(201).json({ success: true, rating: newRating });
  } catch (error) {
    console.error('Failed to save rating:', error);
    res.status(500).json({ error: 'Unable to save rating.' });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

function startServer(portToTry) {
  const server = app.listen(portToTry, () => {
    console.log(`Car buy website backend running at http://localhost:${portToTry}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.log(`Port ${portToTry} is busy. Trying ${portToTry + 1}...`);
      startServer(portToTry + 1);
      return;
    }

    throw error;
  });
}

startServer(defaultPort);
