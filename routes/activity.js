const express = require('express');
const router = express.Router();
const {getPerson, getAllPeople} = require("../models/person");
const {deleteActivity, createActivity} = require("../models/activity");
const {driver} = require("../db/db");
const {createRelationshipPersonActivity} = require("../models/relationship");

router.get('/person/:pid/activity/new', async (req, res) => {
    const session = driver.session();
    const pid = req.params.pid;
    try {
        const person = await getPerson(session, pid);
        if (!person) {
            return res.status(404).json({ error: 'No such person' });
        }
        const people = (await getAllPeople(session))
            .map(person => person.properties)
            .filter(person => person.pid !== pid);
        return res.render('add-activity', { title: 'Add new activity', person: person.properties, people });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/person/:pid/activity/new', async (req, res) => {
    const { pid } = req.params;
    let { name, startDate, endDate, location, description, participants } = req.body;

    const session = driver.session();

    try {
        if (!(participants instanceof Array)) {
            if (participants)
                participants = [participants];
            else
                participants = [];
        }
        participants.push(pid);
        const participantsNodes = await getAllPeople(session, participants);
        if (participants.length !== participantsNodes.length) {
            return res.status(404).json({ error: 'No such people' });
        }
        const props = { name, startDate, endDate, location, description, participants };
        const a = await createActivity(session, props);
        for (const person of participantsNodes) {
            const rel = await createRelationshipPersonActivity(session, person, a);
        }
        return res.redirect('/person/' + pid);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});
router.get('/person/:pid/activity/:aid/delete', async (req, res) => {
    const session = driver.session();
    const { pid, aid } = req.params;
    try {
        const person = await getPerson(session, pid);
        if (!person) {
            return res.status(404).json({ error: 'No such person' });
        }
        const a = await deleteActivity(session, aid);
        return res.redirect(`/person/${pid}`);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;