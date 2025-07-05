const { v4: uuidv4 } = require('uuid');
const {updateLastUpdatedAt} = require("../models/person");


async function deleteRelationshipPerson(session, rid, pid) {
    const result = await session.run(`
        MATCH (p:Person)-[r]->(b)
        WHERE r.rid = $rid AND p.pid = $pid
        DELETE r
        RETURN p, b
      `, { rid, pid });
    if (result.records.length === 0) {
        return null;
    }
    return result.records.map((r) => {
        return {
            first: r.get('p'),
            second: r.get('b'),
        }
    });
}

async function deleteRelationship(session, rid) {
    const result = await session.run(`
        MATCH (a)-[r]->(b)
        WHERE r.rid = $rid
        DELETE r
        RETURN a, b
      `, { rid });
    if (result.records.length === 0) {
        return null;
    }
    return result.records.map((r) => {
        return {
            first: r.get('a'),
            second: r.get('b'),
        }
    });
}

async function createRelationshipPersonContact(session, person, contact, type) {
    const result = await session.run(`
    MATCH (p:Person {pid: $pid}), (c:Contact {cid: $cid})
    CREATE (p)-[:HAS_CONTACT {rid: $rid, createdDate: datetime()}]->(c)
    RETURN p, c
  `, { pid: person.properties.pid, cid: contact.properties.cid, type, rid: uuidv4() });
    await updateLastUpdatedAt(session, person.properties.pid);

    return result.records;
}

async function createRelationshipPersonActivity(session, person, activity) {
    const result = await session.run(`
    MATCH (p:Person {pid: $pid}), (a:Activity {aid: $aid})
    CREATE (p)-[:PARTICIPATES_IN {createdDate: datetime()}]->(a)
    RETURN p, a
  `, { pid: person.properties.pid, aid: activity.properties.aid });
    await updateLastUpdatedAt(session, person.properties.pid);

    return result.records;
}

async function createRelationshipPersonDate(session, person, date) {
    const result = await session.run(`
    MATCH (p:Person {pid: $pid}), (d:Date {did: $did})
    CREATE (p)-[:HAS_DATE {rid: $rid, createdAt: datetime()}]->(d)
    RETURN p, d
  `, { pid: person.properties.pid, did: date.properties.did, rid: uuidv4() });
    await updateLastUpdatedAt(session, person.properties.pid);

    return result.records;
}

module.exports = {
    deleteRelationship,
    deleteRelationshipPerson,
    createRelationshipPersonContact,
    createRelationshipPersonActivity,
    createRelationshipPersonDate,
}
