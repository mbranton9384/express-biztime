const request = require('supertest');
const app = require('../app');
const db = require('../db');

describe('Company Routes', () => {

  afterEach(async () => {
    await db.query('DELETE FROM companies');
  });

  afterAll(async () => {
    await db.end();
  });

  test('GET /companies - should return list of companies', async () => {
    const company1 = { code: 'apple', name: 'Apple Inc.', description: 'Technology company' };
    const company2 = { code: 'google', name: 'Google LLC', description: 'Technology company' };

    await db.query('INSERT INTO companies (code, name, description) VALUES ($1, $2, $3)', 
      [company1.code, company1.name, company1.description]);
    await db.query('INSERT INTO companies (code, name, description) VALUES ($1, $2, $3)', 
      [company2.code, company2.name, company2.description]);

    const response = await request(app).get('/companies');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ companies: [company1, company2] });
  });

  test('GET /companies/:code - should return a company', async () => {
    const company = { code: 'apple', name: 'Apple Inc.', description: 'Technology company' };

    await db.query('INSERT INTO companies (code, name, description) VALUES ($1, $2, $3)', 
      [company.code, company.name, company.description]);

    const response = await request(app).get(`/companies/${company.code}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ company });
  });

  test('POST /companies - should add a company', async () => {
    const newCompany = { code: 'microsoft', name: 'Microsoft Corp.', description: 'Technology company' };

    const response = await request(app).post('/companies').send(newCompany);
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ company: newCompany });

    const result = await db.query('SELECT * FROM companies WHERE code = $1', [newCompany.code]);
    expect(result.rows.length).toBe(1);
    expect(result.rows[0]).toEqual(newCompany);
  });

  test('PUT /companies/:code - should update a company', async () => {
    const company = { code: 'apple', name: 'Apple Inc.', description: 'Technology company' };

    await db.query('INSERT INTO companies (code, name, description) VALUES ($1, $2, $3)', 
      [company.code, company.name, company.description]);

    const updatedData = { name: 'Apple Corporation', description: 'Updated description' };

    const response = await request(app).put(`/companies/${company.code}`).send(updatedData);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ company: { code: company.code, ...updatedData } });

    const result = await db.query('SELECT * FROM companies WHERE code = $1', [company.code]);
    expect(result.rows[0]).toEqual({ code: company.code, ...updatedData });
  });

  test('DELETE /companies/:code - should delete a company', async () => {
    const company = { code: 'apple', name: 'Apple Inc.', description: 'Technology company' };

    await db.query('INSERT INTO companies (code, name, description) VALUES ($1, $2, $3)', 
      [company.code, company.name, company.description]);

    const response = await request(app).delete(`/companies/${company.code}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'deleted' });

    const result = await db.query('SELECT * FROM companies WHERE code = $1', [company.code]);
    expect(result.rows.length).toBe(0);
  });
});
