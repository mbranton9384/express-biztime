const request = require('supertest');
const app = require('../app');
const db = require('../db');

describe('Invoice Routes', () => {

  afterEach(async () => {
    await db.query('DELETE FROM invoices');
    await db.query('DELETE FROM companies');
  });

  afterAll(async () => {
    await db.end();
  });

  test('GET /invoices - should return list of invoices', async () => {
    const company = { code: 'apple', name: 'Apple Inc.', description: 'Technology company' };
    const invoice1 = { id: 1, comp_code: 'apple', amt: 100, paid: false, add_date: '2021-01-01', paid_date: null };
    const invoice2 = { id: 2, comp_code: 'apple', amt: 200, paid: false, add_date: '2021-01-01', paid_date: null };

    await db.query('INSERT INTO companies (code, name, description) VALUES ($1, $2, $3)', 
      [company.code, company.name, company.description]);
    await db.query('INSERT INTO invoices (id, comp_code, amt, paid, add_date, paid_date) VALUES ($1, $2, $3, $4, $5, $6)', 
      [invoice1.id, invoice1.comp_code, invoice1.amt, invoice1.paid, invoice1.add_date, invoice1.paid_date]);
    await db.query('INSERT INTO invoices (id, comp_code, amt, paid, add_date, paid_date) VALUES ($1, $2, $3, $4, $5, $6)', 
      [invoice2.id, invoice2.comp_code, invoice2.amt, invoice2.paid, invoice2.add_date, invoice2.paid_date]);

    const response = await request(app).get('/invoices');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ invoices: [invoice1, invoice2] });
  });

  test('GET /invoices/:id - should return an invoice', async () => {
    const company = { code: 'apple', name: 'Apple Inc.', description: 'Technology company' };
    const invoice = { id: 1, comp_code: 'apple', amt: 100, paid: false, add_date
