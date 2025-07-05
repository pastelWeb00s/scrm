var express = require('express');
var router = express.Router();
const {driver} = require("../db/db");
const {search} = require("../models/search");


router.get('/', async (req, res) => {
    return res.render('search');
});

router.post('/', async (req, res) => {
    const searchTerm = req.body.searchTerm;

    if (!searchTerm || !searchTerm.trim().length) {
        return res.redirect('/search');
    }

    const session = driver.session();
    try {
        const searchResults = await search(session, searchTerm);

        res.render('search', {
            searchTerm,
            title: `Searching: ${req.body.searchTerm}`,
            ...searchResults,
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        await session.close();
    }
});

module.exports = router;