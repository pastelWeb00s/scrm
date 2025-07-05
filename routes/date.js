const express = require('express');
const router = express.Router();
const {getPerson} = require("../models/person");
const {driver} = require("../db/db");
const {createDate, deleteDate} = require("../models/date");
const {createRelationshipPersonDate} = require("../models/relationship");

router.get('/person/:pid/date/new', async (req, res) => {
    const session = driver.session();
    const pid = req.params.pid;
    try {
        const person = await getPerson(session, pid);
        if (!person) {
            return res.status(404).json({ error: 'No such person' });
        }
        return res.render('add-date', { title: 'Add new date', person: person.properties });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/person/:pid/date/new', async (req, res) => {
    const { pid } = req.params;
    const { year, month, day, hour, minute, note, remindFrequencyInDays, remindFrequencyInMonths, remindAt } = req.body;

    const session = driver.session();

    try {
        const dateProps = {
            year: year ? parseInt(year) : null,
            month: month ? parseInt(month) : null,
            day: day ? parseInt(day) : null,
            hour: hour ? parseInt(hour) : null,
            minute: minute ? parseInt(minute) : null,
            note: note || null,
            remindFrequencyInDays: remindFrequencyInDays ? parseInt(remindFrequencyInDays) : 0,
            remindFrequencyInMonths: remindFrequencyInMonths ? parseInt(remindFrequencyInMonths) : 0,
            remindAtStr: remindAt ? remindAt : null,
        };
        const person = await getPerson(session, pid);
        if (!person) {
            return res.status(404).json({ error: 'No such person' });
        }
        const d = await createDate(session, dateProps);
        const rel = await createRelationshipPersonDate(session, person, d);
        return res.redirect('/person/' + person.properties.pid);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});
router.get('/person/:pid/date/:did/delete', async (req, res) => {
    const session = driver.session();
    const pid = req.params.pid;
    const did = req.params.did;
    try {
        const person = await getPerson(session, pid);
        if (!person) {
            return res.status(404).json({ error: 'No such person' });
        }
        const deleted = await deleteDate(session, did);
        return res.redirect('/person/' + pid);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
