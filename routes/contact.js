const express = require('express');
const router = express.Router();
const {getPerson} = require("../models/person");
const {deleteContact, createContact} = require("../models/contact");
const {driver} = require("../db/db");
const {createRelationshipPersonContact} = require("../models/relationship");

router.get('/person/:pid/contact/new', async (req, res) => {
    const session = driver.session();
    const pid = req.params.pid;
    try {
        const person = await getPerson(session, pid);
        if (!person) {
            return res.status(404).json({ error: 'No such person' });
        }
        return res.render('add-contact', { title: 'Add new contact', person: person.properties });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/person/:pid/contact/new', async (req, res) => {
    const contact = req.body.contact;
    const type = req.body.type;
    const pid = req.params.pid;
    const session = driver.session();

    try {
        const person = await getPerson(session, pid);
        if (!person) {
            return res.status(404).json({ error: 'No such person' });
        }
        const c = await createContact(session, type, contact);
        const rel = await createRelationshipPersonContact(session, person, c, type);
        return res.redirect('/person/' + person.properties.pid);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});

router.get('/person/:pid/contact/:cid/delete', async (req, res) => {
    const { pid, cid } = req.params;
    const session = driver.session();

    try {
        const person = await getPerson(session, pid);
        if (!person) {
            return res.status(404).json({ error: 'No such person' });
        }
        await deleteContact(session, pid, cid);
        return res.redirect('/person/' + person.properties.pid);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});


module.exports = router;