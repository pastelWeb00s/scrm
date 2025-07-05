var express = require('express');
var router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { formatDistanceToNow } = require('date-fns');
const {getPerson, getAllPeople, getAllRelationships, updateLastViewedAt, createPerson, deletePerson, getPeopleByName,
    updateName
} = require("../models/person");
const {getLocations} = require("../models/location");
const {deleteRelationship} = require("../models/relationship");
const {driver} = require("../db/db");
const {getAllFiles, getFile} = require("../models/file");

router.get('/person/:pid/edit', async (req, res) => {
    const session = driver.session();
    try {
        const pid = req.params.pid;
        const person = await getPerson(session, pid);
        if (!person) {
            return res.status(404).json({ error: 'No such person' });
        }
        return res.render('edit-person', { person: person.properties });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});
router.post('/person/:pid/edit', async (req, res) => {
    const session = driver.session();

    try {
        const pid = req.params.pid;
        const name = req.body.name.trim();
        if (!name) {
            return res.status(404).json({ error: 'No name' });
        }
        const person = await updateName(session, pid, name);
        if (!person) {
            return res.status(404).json({ error: 'No such person' });
        }
        return res.redirect('/person/' + pid);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});


router.get('/person/:pid/delete', async (req, res) => {
    const session = driver.session();
    try {
        const pid = req.params.pid;
        await deletePerson(session, pid);
        return res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});

router.get('/person/:pid/relationship/new', async (req, res) => {
    const session = driver.session();
    try {
        const pid = req.params.pid;
        const person = await getPerson(session, pid);
        if (!person) {
            return res.status(404).json({ error: 'No such person' });
        }
        const people = (await getAllPeople(session))
            .map(person => person.properties)
            .filter(person => person.pid !== pid);
        return res.render('link-people', { title: 'Add new relationship', person: person.properties, people });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});
router.post('/person/:pid/relationship/new', async (req, res) => {
    const session = driver.session();

    try {
        const { pid } = req.params;
        const relationshipType = req.body.relationshipType;
        const otherPersonPid = req.body.otherPerson;
        const otherPerson = await getPerson(session, otherPersonPid);
        const person = await getPerson(session, pid);

        if (!otherPerson || !person) {
            return res.status(404).send('The selected person does not exist.');
        }

        await session.run(`
          MATCH (p1:Person {pid: $pid}), (p2:Person {pid: $otherPersonPid})
          CREATE (p1)-[r:HAS_RELATIONSHIP { type: $relationshipType, createdAt: datetime(), rid: $rid }]->(p2)
          RETURN r
        `, { pid, otherPersonPid, relationshipType, rid: uuidv4() });

        res.redirect(`/person/${pid}`);
    } catch (error) {
        console.error('Error creating relationship:', error);
        res.status(500).send('Error creating relationship');
    } finally {
        await session.close();
    }
});

router.get('/person/:pid/relationship/:rid/delete', async (req, res) => {
    const session = driver.session();

    try {
        const { pid, rid } = req.params;
        const person = await getPerson(session, pid);
        const rel = await deleteRelationship(session, rid);

        if (!rel || !person) {
            return res.status(404).send('The selected relationship does not exist.');
        }

        res.redirect(`/person/${pid}`);
    } catch (error) {
        console.error('Error deleting relationship:', error);
        res.status(500).send('Error deleting relationship');
    } finally {
        await session.close();
    }
});

router.get('/person/:pid/tags/edit', async (req, res) => {
    const session = driver.session();
    try {
        const { pid } = req.params;
        const person = await getPerson(session, pid);
        if (!person) {
            return res.status(404).json({ error: 'No such person' });
        }
        return res.render('edit-tags', { person: person.properties });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});
router.post('/person/:pid/tags/edit', async (req, res) => {
    const { pid } = req.params;
    let { tags = [], tagsToRemove = [], newTag } = req.body;
    tags = typeof tags === 'string' ? [tags] : tags;
    tagsToRemove = typeof tagsToRemove === 'string' ? [tagsToRemove] : tagsToRemove;
    const tagsAfterRemoval = tags.filter(tag => !tagsToRemove.includes(tag));
    let updatedTags = [...tagsAfterRemoval];
    if (newTag && newTag.trim() !== '' && !updatedTags.includes(newTag)) {
        updatedTags.push(newTag.trim());
    }
    
    const session = driver.session();

    try {
        const person = await getPerson(session, pid);
        if (!person) {
            return res.status(404).json({ error: 'No such person' });
        }
        await session.run(`
          MATCH (p:Person {pid: $pid})
          SET p.tags = $updatedTags
          RETURN p
        `, { pid, updatedTags });

        return res.redirect('/person/' + person.properties.pid);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});

router.get('/person/new', async (req, res) => {
    try {
        res.render('edit-person', { title: 'Add new person', person: { name: '' } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});
router.post('/person/new', async (req, res) => {
    const session = driver.session();

    try {
        const name = req.body.name.trim();
        if (!name) {
            return res.status(404).json({ error: 'No name' });
        }
        const person = await createPerson(session, name);
        if (!person) {
            return res.status(404).json({ error: 'No such person' });
        }
        return res.redirect('/person/' + person.properties.pid);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});

router.get('/person/:pid/company/link', async (req, res) => {
    const session = driver.session();
    try {
        const pid = req.params.pid;
        const person = await getPerson(session, pid);
        const companiesResult = await session.run('MATCH (c:Company) RETURN c');

        const companies = companiesResult.records.map(record => ({
            cid: record.get('c').properties.cid,
            name: record.get('c').properties.name
        }));

        res.render('link-person-company', { person: person.properties, companies });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});
router.post('/person/:pid/company/link', async (req, res) => {
    const { pid } = req.params;
    const { company, startDate, endDate, title } = req.body;

    const session = driver.session();

    try {
        const person = await getPerson(session, pid);
        if (!person) {
            return res.status(404).json({ error: 'No such person' });
        }
        await session.run(`
            MATCH (p:Person {pid: $pid}), (c:Company {cid: $cid})
             CREATE (p)-[r:WORKS_AT {startDate: $startDate, endDate: $endDate, title: $title, rid: $rid}]->(c)
             RETURN p, c, r`,
            { pid: person.properties.pid, cid: company, startDate, endDate, title, rid: uuidv4() }
        );
        return res.redirect('/person/' + person.properties.pid);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});
router.get('/person/:pid/company/:rid/delete', async (req, res) => {
    const { pid, rid } = req.params;
    const session = driver.session();
    try {
        await deleteRelationship(session, rid);

        return res.redirect(`/person/${pid}`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});

router.get('/person/:pid', async (req, res) => {
    const pid = req.params.pid;

    const session = driver.session();
    try {
        const result = await session.run(`
          MATCH (p:Person {pid: $pid})
          OPTIONAL MATCH (p)-[:HAS_CONTACT]->(c:Contact)
          WITH p, collect(c) AS contacts
          OPTIONAL MATCH (p)-[:HAS_DATE]->(d:Date)
          WITH p, contacts, collect(d) AS dates
          OPTIONAL MATCH (p)-[:HAS_NOTE]->(n:Note)
          WITH p, contacts, dates, collect(n) AS notes
          OPTIONAL MATCH (p)-[:PARTICIPATES_IN]->(a:Activity)
          WITH p, contacts, dates, notes, collect(a) AS activities
          RETURN p, contacts, dates, notes, activities, p.profileImage AS profileImage
        `, { pid });

        if (result.records.length === 0) {
            return res.status(404).send('Person not found.');
        }

        const person = result.records[0].get('p').properties;
        const contacts = result.records[0].get('contacts').map(contactNode => contactNode.properties);
        const notes = result.records[0].get('notes').map(node => node.properties);
        const activities = await getActivities(session, person);
        const companies = await getCompanies(session, person);
        const locations = await getLocations(session, person);
        const relationshipsOutgoing = await getAllRelationships(session, person, true);
        const relationshipsIncoming = await getAllRelationships(session, person, false);
        const files = (await getAllFiles(session, person)).map(f => f.properties);
        const images = files;
        const profileImage = person.profileImageFid
            ? await getFile(session, person.profileImageFid)
            : null;
        const peopleWithSameName = (await getPeopleByName(session, person.name))
            .map(p => p.properties)
            .filter(p => p.pid !== person.pid);

        const dates = result.records[0].get('dates').map(record => {
            const d = record.properties;
            const now = new Date();
            const year = d.year?.low ?? now.getFullYear();
            const month = d.month?.low ? d.month.low - 1 : now.getMonth(); // months are 0-indexed
            const day = d.day?.low ?? 1;
            const hour = d.hour?.low ?? 0;
            const minute = d.minute?.low ?? 0;

            const dateObject = new Date(year, month, day, hour, minute);
            const emptyDate = !year && !month && !day && !hour && !minute;
            return {
                ...d,
                howLongAgo: emptyDate
                    ? ""
                    : formatDistanceToNow(dateObject, { addSuffix: true })
            };
        }).filter(Boolean);

        await updateLastViewedAt(session, pid);

        res.render('person', {
            title: person.name,
            person,
            contacts,
            dates,
            notes,
            activities,
            companies,
            locations,
            relationshipsOutgoing,
            relationshipsIncoming,
            images,
            profileImage: profileImage ? profileImage.properties : null,
            peopleWithSameName,
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error.');
    } finally {
        await session.close();
    }
});

async function getCompanies(session, person) {
    const result = await session.run(`
    MATCH (p:Person {pid: $pid})-[:WORKS_AT]->(c:Company)
    OPTIONAL MATCH (p)-[r:WORKS_AT]->(c)
    RETURN c.name AS companyName, r.startDate AS startDate, r.endDate AS endDate, c.cid AS companyId, r.rid AS relationshipId
    ORDER BY r.startDate DESC
    `, { pid: person.pid });
    return result.records.map(record => ({
        companyName: record.get('companyName'),
        companyId: record.get('companyId'),
        relationshipId: record.get('relationshipId'),
        startDate: record.get('startDate'),
        endDate: record.get('endDate')
    }));
}

async function getActivities(session, person) {
    const activitiesResult = await session.run(`
        MATCH (p:Person {pid: $pid})-[:PARTICIPATES_IN]->(a:Activity)
        OPTIONAL MATCH (a)<-[:PARTICIPATES_IN]-(other:Person)
        WITH a, collect(other.name) AS participants, p.name AS personName
        RETURN a,
               CASE WHEN size(participants) = 0 THEN [personName] ELSE participants END AS participants
        ORDER BY a.startDate DESC
    `, { pid: person.pid });
    return activitiesResult.records.map(record => ({
        participants: record.get('participants'),
        ...record.get('a').properties,
    }));
}

module.exports = router;
