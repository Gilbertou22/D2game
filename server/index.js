const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB 連接
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// 玩家模型
const playerSchema = new mongoose.Schema({
  userId: String,  // 可擴展為帳號系統，目前用隨機ID
  level: Number,
  exp: Number,
  hp: Number,
  maxHp: Number,
  mana: Number,
  maxMana: Number,
  gold: Number,
  currentLevel: Number,
  equipped: Object,
  inventory: Array,
  skills: Object
});
const Player = mongoose.model('Player', playerSchema);

// API：儲存遊戲
app.post('/api/save', async (req, res) => {
  const { userId, ...data } = req.body;
  try {
    await Player.findOneAndUpdate({ userId }, data, { upsert: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API：載入遊戲
app.get('/api/load/:userId', async (req, res) => {
  try {
    const player = await Player.findOne({ userId: req.params.userId });
    res.json(player || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));