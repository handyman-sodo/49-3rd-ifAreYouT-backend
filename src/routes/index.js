const express = require('express');
const router = express.Router();
const {authRouter} = require('./authRoute')


router.get('/', (req, res, next) => {
  res.send('OK');
});

router.use('/auth', authRouter)

module.exports = router;
