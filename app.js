const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const passport = require('passport');
const axios = require('axios');
require('./src/config/passport')
const { authRouter } = require('./src/routes/authRoute');

const dotenvPath = process.env.DOTENV_CONFIG_PATH;
require('dotenv').config({ path: dotenvPath });

const app = express();

const indexRouter = require('./src/routes');

app.set('port', process.env.PORT || 8000);
app.use(
  cors({
    origin: '*',
    credentials: true,
  }),
);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.use('/', indexRouter);
app.use('/auth', authRouter);

// 카카오 인가 코드를 액세스 토큰으로 교환하는 라우트
app.post('/auth/kakao/callback', async (req, res) => {
  const { code } = req.body; // 인가 코드를 요청 본문에서 추출 req.query

  try {
    // 카카오 서버에 액세스 토큰 요청
    const response = await axios.post('https://kauth.kakao.com/oauth/token', null, {
      headers: {
        "Content-type":
          "application/x-www-form-urlencoded;charset=utf-8"
      },
      params: {
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_ID, //restapi
        redirect_uri: 'http://localhost:8000/auth/kakao/callback',
        code,
      },
    });

    const { access_token } = response.data;
    // 액세스 토큰을 사용하여 카카오 API에 요청을 보낼 수 있음
    // 사용자 정보 가져오기 등의 처리 추가

    // 사용자 정보를 가져오는 라우트를 추가
    app.get('/user-profile', async (req, res) => {
      const access_token = req.headers.authorization.replace('Bearer ', ' '); // 액세스 토큰을 요청에서 가져올 수 있음

      try {
        // 카카오 사용자 정보 가져오기 요청
        const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });

        const userData = userResponse.data;

        // userData를 이용하여 사용자 정보 처리
        // ...

        res.status(200).json(userData);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: '사용자 정보 요청 실패' });
      }
    });

    res.status(200).json({ message: '액세스 토큰 교환 및 사용자 처리 완료' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '액세스 토큰 교환 실패' });
  }
});

app.use((req, _, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});

app.use((err, _, res, next) => {
  res.status(err.status || 500);
  return res.json({
    error: `${err.status ? err.status : ''} ${err.message}`,
  });
});

module.exports = app;
