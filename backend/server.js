const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();


const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.get("/api/summarize", (req, res) => {
  res.send("API is running...");
});

app.get("/api/auth", (req, res) => {
  res.send("API is running...");
});

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/summarize', require('./routes/summarize'));

app.listen(5000, () => console.log("Server running on port 5000"));
