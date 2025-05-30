import request from 'supertest';
import createApp  from '../app.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import redis from '../config/redisClient.js';
import jwtKeys from '../config/jwtKeys.js';
import { initDerivedKeys } from '../utils/jwtKeyManager.js';
import { encryptPayload } from '../utils/jwtCrypto.js';
import User from '../models/User.js';





import dotenv from 'dotenv';
dotenv.config();

let app;

beforeAll(async () => {
  app = await createApp;
  await redis.set('testkey', 'testvalue');
  const val = await redis.get('testkey');
  console.log('Redis test value:', val); // doit afficher 'testvalue'
  await redis.flushall();

  await initDerivedKeys();
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await redis.quit();
});

describe('Auth', () => {
  const userData = {
  email: `test_${Date.now()}@test.com`,
  password: 'StrongPass123'
};

  it('should reject login with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@test.com', password: 'wrongpass' });
    expect(res.statusCode).toBe(400);
  });

  it('should reject registration with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: '' }); // missing password
    expect(res.statusCode).toBe(400);
  });

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(userData);
    expect(res.statusCode).toBe(201);
  });

  it('should reject registration for existing user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(userData);
    expect(res.statusCode).toBe(400);
  });

  it('should login and return JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send(userData);
    expect(res.statusCode).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    const token = res.body.accessToken;
  });

 it('should access protected route with valid token', async () => {
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send(userData);

  const token = loginRes.body.accessToken;

  const res = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token}`);

  expect(res.statusCode).toBe(200);
  expect(res.body.user.email).toBe(userData.email);
});

  it('should reject access with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.statusCode).toBe(403);
  });

it('should logout and blacklist token', async () => {
  // Login d'abord pour récupérer un token valide
  const loginRes = await request(app).post('/api/auth/login').send(userData);
  const token = loginRes.body.accessToken;

  const res = await request(app)
    .post('/api/auth/logout')
    .set('Authorization', `Bearer ${token}`);

  expect(res.statusCode).toBe(204);
});

it('should reject access with blacklisted token', async () => {
  // 1. Login pour récupérer un token valide
  const loginRes = await request(app).post('/api/auth/login').send(userData);
  const token = loginRes.body.accessToken;

  // 2. Blacklister le token en simulant logout
  await request(app)
    .post('/api/auth/logout')
    .set('Authorization', `Bearer ${token}`)
    .expect(204);

  // 3. Tenter d’accéder à une route protégée avec ce token blacklisté
  const res = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token}`);

  expect(res.statusCode).toBe(403); // Doit être rejeté
});


it('logout should work with valid token', async () => {
  const loginRes = await request(app).post('/api/auth/login').send(userData);
  const token = loginRes.body.accessToken;

  const res = await request(app)
    .post('/api/auth/logout')
    .set('Authorization', `Bearer ${token}`);

  console.log('Logout response:', res.statusCode, res.body);

  expect(res.statusCode).toBe(204);
});


it('should return JWT token with correct payload structure', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send(userData);
  expect(res.statusCode).toBe(200);
  expect(res.body.accessToken).toBeDefined();
  const decoded = jwt.decode(res.body.accessToken);
  expect(decoded).toHaveProperty('role');
  expect(typeof decoded.role).toBe('string');

  // data should be encrypted string, not plain object
  expect(decoded.data).toBeDefined();
  expect(typeof decoded.data).toBe('string');
});


it('should reject access if role is tampered in token', async () => {
  // Login to get a valid token
  const loginRes = await request(app).post('/api/auth/login').send(userData);
  expect(loginRes.statusCode).toBe(200);
  const token = loginRes.body.accessToken;

  // Decode token header and payload
  const [headerB64, payloadB64, signature] = token.split('.');
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8'));

  // Tamper role to admin
  payload.role = 'admin';
  const tamperedPayloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');

  // Rebuild token with tampered payload but original header and signature (invalid signature now)
  const tamperedToken = `${headerB64}.${tamperedPayloadB64}.${signature}`;

  // Request protected route with tampered token
  const res = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${tamperedToken}`);

  expect(res.statusCode).toBe(403); // Or 401 depending on your implementation
});

it('should not return encrypted payload in response', async () => {
  await redis.flushall();
  
  const loginRes = await request(app)
      .post('/api/auth/login')
      .send(userData);

  const token = loginRes.body.accessToken;

  const res = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token}`);

  expect(res.statusCode).toBe(200);
  expect(typeof res.body.user.role).toBe('string');
  expect(res.body.user.data).toBeUndefined();
});


it('should refresh token and keep the role intact', async () => {
  const agent = request.agent(app);
  const loginRes = await agent
    .post('/api/auth/login')
    .send(userData);

  expect(loginRes.statusCode).toBe(200);

  const refreshRes = await agent
    .post('/api/auth/refresh');

  expect(refreshRes.statusCode).toBe(200);
  expect(refreshRes.body.accessToken).toBeDefined();

  const decoded = jwt.decode(refreshRes.body.accessToken);
  expect(decoded.role).toBe(userData.role || 'user');
});

it('should accept old token after key rotation', async () => {
  const oldKey = jwtKeys.previous[0];
  const fakeUserId = new mongoose.Types.ObjectId().toString();

  jest.spyOn(User, 'findById').mockImplementation(() => ({
    select: jest.fn().mockResolvedValue({
      _id: fakeUserId,
      email: 'test@example.com',
      role: 'user',
      status: 'active',
      toObject: () => ({
        _id: fakeUserId,
        email: 'test@example.com',
        role: 'user',
        status: 'active',
      }),
    }),
  }));

  const encrypted = await encryptPayload({ id: fakeUserId, email: 'test@example.com' }, jwtKeys.derivedAccess);

  const oldToken = jwt.sign(
    { role: 'user', data: encrypted },
    oldKey,
    { expiresIn: '1h' }
  );

  const res = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${oldToken}`);

  expect(res.statusCode).toBe(200);
});



});
