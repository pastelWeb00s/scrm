var express = require('express');
var router = express.Router();
const { v4: uuidv4 } = require('uuid');
const {updateLastUpdatedAt, getPerson} = require("../models/person");
const {driver} = require("../db/db");


router.get('/person/:pid/note{/:nid/edit}', async (req, res) => {
    const session = driver.session();
    const pid = req.params.pid;
    const nid = req.params.nid;
    try {
        const person = await getPerson(session, pid);
        if (!person) {
            return res.status(404).json({ error: 'No such person' });
        }
        const note = nid ? await getNote(session, nid) : {};
        return res.render('note', {
            title: 'Add new note to ' + person.properties.name,
            person: person.properties,
            note: note.properties,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});
router.post('/person/:pid/note{/:nid/edit}', async (req, res) => {
    const { pid, nid } = req.params;
    const content = req.body.note;

    const session = driver.session();

    try {
        const person = await getPerson(session, pid);
        if (!person) {
            return res.status(404).json({ error: 'No such person' });
        }
        const note = nid ? await updateNote(session, nid, content) : null;
        if (!note) {
            const n = await createNote(session, content);
            const rel = await createRelationshipPersonNote(session, person, n);
        }
        return res.redirect('/person/' + person.properties.pid);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});
router.get('/person/:pid/note/:nid/delete', async (req, res) => {
    const session = driver.session();
    const pid = req.params.pid;
    const nid = req.params.nid;
    try {
        const person = await getPerson(session, pid);
        if (!person) {
            return res.status(404).json({ error: 'No such person' });
        }
        await deleteNote(session, nid);
        return res.redirect('/person/' + pid);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});

async function createRelationshipPersonNote(session, person, note) {
    const result = await session.run(`
    MATCH (p:Person {pid: $pid}), (n:Note {nid: $nid})
    CREATE (p)-[r:HAS_NOTE {rid: $rid, createdAt: datetime()}]->(n)
    RETURN p, n
  `, { pid: person.properties.pid, nid: note.properties.nid, rid: uuidv4() });
    await updateLastUpdatedAt(session, person.properties.pid);

    return result.records;
}

async function updateNote(session, nid, content) {
    const result = await session.run(`
        MATCH (n:Note {nid: $nid})
        SET n.content = $content
        RETURN n
  `, {nid, content,});
    if (result.records.length === 0) {
        return null;
    }
    return result.records[0].get('n');
}

async function deleteNote(session, nid) {
    const result = await session.run(`
        MATCH (n:Note {nid: $nid})
        DETACH DELETE n
  `, {nid,});
    if (result.records.length === 0) {
        return null;
    }
    return result.records[0].get('n');
}

async function createNote(session, note) {
    console.log('note: ', note);
    const result = await session.run(`
          CREATE (n:Note {content: $note, nid: $nid, createdAt: datetime()})
          RETURN n
      `, {nid: uuidv4(), note,});
    return result.records[0].get('n');
}

async function getNote(session, nid) {
    const result = await session.run(`
    MATCH (n:Note {nid: $nid})
    RETURN n
  `, { nid });
    if (result.records.length === 0) {
        return null;
    }

    return result.records[0].get('n');
}

module.exports = router;
