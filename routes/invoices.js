const express = require("express");
const slugify = require('slugify');
const ExpressError = require("../expressError")
const router = express.Router();
const db = require("../db");

router.get('/', async (req, res, next) => {
    try {
        const results =  await db.query('SELECT id, comp_code FROM invoices')
        return res.json({ invoices: results.rows });
    }catch (e) {
        return next(e);
    }
})

router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await db.query(`
            SELECT invoices.id, invoices.amt, invoices.paid, invoices.add_date, invoices.paid_date,
                   companies.code AS company_code, companies.name AS company_name, companies.description AS company_description
            FROM invoices
            JOIN companies ON invoices.comp_code = companies.code
            WHERE invoices.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            throw new ExpressError("Invoice not found", 404);
        }

        const invoice = {
            id: result.rows[0].id,
            amt: result.rows[0].amt,
            paid: result.rows[0].paid,
            add_date: result.rows[0].add_date,
            paid_date: result.rows[0].paid_date,
            company: {
                code: result.rows[0].company_code,
                name: result.rows[0].company_name,
                description: result.rows[0].company_description
            }
        };

        return res.json({ invoice });
    } catch (e) {
        return next(e);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const {comp_code, amt } = req.body;

        const result = await db.query(
            'INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date',
            [comp_code, amt]
        );

        const createdInvoice = result.rows[0];

        return res.status(201).json({ invoice: createdInvoice });
    } catch (e){
        return next(e);
    }
});

router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amt } = req.body;

        const checkResult = await db.query('SELECT id FROM invoices WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            throw new ExpressError("Invoice not found", 404);
        }

        const updateResult = await db.query(
            'UPDATE invoices SET amt = $1 WHERE id = $2 RETURNING id, comp_code, amt, paid, add_date, paid_date',
            [amt, id]
        );

        const updatedInvoice = updateResult.rows[0];

        return res.json({ invoice: updatedInvoice });
    } catch (e) {
        return next(e);
    }
});

router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amt, paid } = req.body;

        const checkResult = await db.query('SELECT id, paid_date FROM invoices WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            throw new ExpressError("Invoice not found", 404);
        }

        let paidDate;
        if (paid === true) {
            paidDate = new Date(); 
        } else if (paid === false) {
            paidDate = null; 
        } else {
            paidDate = checkResult.rows[0].paid_date;
        }

        const updateResult = await db.query(
            `UPDATE invoices
             SET amt = $1, paid = $2, paid_date = $3
             WHERE id = $4
             RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [amt, paid, paidDate, id]
        );

        const updatedInvoice = updateResult.rows[0];

        return res.json({ invoice: updatedInvoice });
    } catch (e) {
        return next(e);
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const checkResult = await db.query('SELECT id FROM invoices WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            throw new ExpressError("Invoice not found", 404);
        }

        await db.query('DELETE FROM invoices WHERE id = $1', [id]);

        return res.json({ status: "deleted" });
    } catch (e) {
        return next(e);
    }
});

router.get('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;

        const companyResult = await db.query(`
            SELECT code, name, description
            FROM companies
            WHERE code = $1
        `, [code]);

        if (companyResult.rows.length === 0) {
            throw new ExpressError("Company not found", 404);
        }

        const invoicesResult = await db.query(`
            SELECT id
            FROM invoices
            WHERE comp_code = $1
        `, [code]);

        const company = {
            code: companyResult.rows[0].code,
            name: companyResult.rows[0].name,
            description: companyResult.rows[0].description,
            invoices: invoicesResult.rows.map(row => row.id)
        };

        return res.json({ company });
    } catch (e) {
        return next(e);
    }
});


module.exports = router;