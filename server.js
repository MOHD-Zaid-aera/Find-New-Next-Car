const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const cars = require('./data/cars.json');

const app = express();
const port = process.env.PORT || 4000;
const contactsFile = path.join(__dirname, 'data', 'contacts.json');
const ratingsFile = path.join(__dirname, 'data', 'ratings.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/cars', (req, res) => {
  res.json(cars);
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

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Car buy website backend running at http://localhost:${port}`);
});
