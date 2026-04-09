const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

router.post('/signup', async (req, res) => {
  const {name, email, password} = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const user = new User({name, email, password: hashed});
  await user.save();
  res.json({msg: "User created"});
});

router.post('/login', async (req, res) => {
  const {email, password} = req.body;
  const user = await User.findOne({email});
  if(!user) return res.status(400).json({msg: "User not found"});

  const isMatch = await bcrypt.compare(password, user.password);
  if(!isMatch) return res.status(400).json({msg: "Wrong password"});

  const token = jwt.sign({id: user._id}, "secret");
  res.json({token});
});

module.exports = router;
