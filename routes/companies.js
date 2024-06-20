const express = require("express");
const slugify = require('slugify');
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT code, name FROM companies`);
        return res.json({ companies: results.rows });
    } catch (e) {
        return next(e);
    }
});


router.get('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;

        const companyResult = await db.query(
            `SELECT code, name, description
             FROM companies
             WHERE code = $1`, 
             [code]
        );

        if (companyResult.rows.length === 0) {
            throw new ExpressError("Company not found", 404);
        }

        const invoicesResult = await db.query(
            `SELECT id
             FROM invoices
             WHERE comp_code = $1`,
             [code]
        );

        const industriesResult = await db.query(
            `SELECT i.industry 
             FROM industries AS i
             JOIN industries_companies AS ic
             ON i.code = ic.industry_code
             WHERE ic.company_code = $1`,
             [code]
        );

        const company = companyResult.rows[0];
        company.invoices = invoicesResult.rows.map(row => row.id);
        company.industries = industriesResult.rows.map(row => row.industry);

        return res.json({ company });
    } catch (e) {
        return next(e);
    }
});

router.post('/', async (req, res, next) => {
    try {
      const { name, description } = req.body;
      if (!name || !description) {
        throw new ExpressError('Name and description are required', 400);
      }
  
      const code = slugify(name, { lower: true, strict: true });
      const result = await db.query(
        `INSERT INTO companies (code, name, description)
         VALUES ($1, $2, $3)
         RETURNING code, name, description`,
        [code, name, description]
      );
  
      return res.status(201).json({ company: result.rows[0] });
    } catch (e) {
      return next(e);
    }
  });

router.put('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const { name, description } = req.body;

        const checkResult = await db.query(`SELECT code FROM companies WHERE code = $1`, [code]);
        if (checkResult.rows.length === 0) {
            throw new ExpressError("Company not found", 404);
        }

        const result = await db.query(
            'UPDATE companies SET name = $1, description = $2 WHERE code = $3 RETURNING code, name, description',
            [name, description, code]
        );

        return res.json({ company: result.rows[0] });
    } catch (e) {
        return next(e);
    }
});

router.delete('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const result = await db.query('DELETE FROM companies WHERE code = $1 RETURNING code', [code]);

        if (result.rowCount === 0) {
            throw new ExpressError("Company not found", 404);
        }

        return res.json({ status: "deleted" });
    } catch (e) {
        return next(e);
    }
});



module.exports = router;
