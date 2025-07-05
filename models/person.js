const { v4: uuidv4 } = require('uuid');

async function createPerson(session, name) {
    const pid = uuidv4();
    const result = await session.run(`
    CREATE (p:Person {
        name: $name, 
        pid: $pid, 
        createdAt: datetime(), 
        lastUpdatedAt: datetime(), 
        lastViewedAt: datetime()
    })
    RETURN p
  `, { name, pid });

    return result.records[0].get('p');
}
async function addUserTags(session, pid, tags) {
    const result = await session.run(`
        MATCH (p:Person {pid: $pid})
        SET p.tags = $tags
        RETURN p
    `, { pid, tags });
    await updateLastUpdatedAt(session, pid);
    return result.records[0].get('p');
}

async function updateLastUpdatedAt(session, pid) {
    const result = await session.run(`
        MATCH (p:Person { pid: $pid })
        SET p.lastUpdatedAt = datetime()
        RETURN p
    `, { pid });
    return result.records[0].get('p');
}

async function updateName(session, pid, newName) {
    const result = await session.run(`
        MATCH (p:Person { pid: $pid })
        SET p.name = $newName
        RETURN p
    `, { pid, newName });
    return result.records[0].get('p');
}

async function getPerson(session, pid) {
    const result = await session.run(`
    MATCH (p:Person {pid: $pid})
    RETURN p
  `, { pid });
    if (result.records.length === 0) {
        return null;
    }

    return result.records[0].get('p');
}

async function getPeopleByName(session, name) {
    const result = await session.run(`
    MATCH (p:Person {name: $name})
    RETURN p
  `, { name });

    return result.records.map(record => record.get('p'));
}

async function getAllPeople(session, pids) {
    const add_pids = pids && pids.length > 0 ? "WHERE p.pid IN $pids" : "";
    const result = await session.run(`
    MATCH (p:Person)
    ${add_pids}
    RETURN p
  `, { pids });
    return result.records.map(record => record.get('p'));
}

async function getAllRelationships(session, person, outgoing = true) {
    // outgoing: person -r-> others
    // ingoing:  person <-r- others
    const pid = person.pid;
    const direction1 = outgoing ? '-' : '<-';
    const direction2 = outgoing ? '->' : '-';
    const result = await session.run(`
        MATCH (p:Person {pid: $pid})${direction1}[r:HAS_RELATIONSHIP]${direction2}(other:Person)
        RETURN r, other
  `, { pid });
    return result.records.map(record => {
        return {
            person: record.get('other').properties,
            relationship: record.get('r').properties,
        }
    });
}

async function updateLastViewedAt(session, pid) {
    const result = await session.run(`
        MATCH (p:Person { pid: $pid })
        SET p.lastViewedAt = datetime()
        RETURN p
    `, { pid });
    return result.records[0].get('p');
}

async function deletePerson(session, pid) {
    const result = await session.run(`MATCH (p:Person {pid: $pid}) DETACH DELETE p`, {pid});
    return result.records;
}

module.exports = {
    createPerson,
    updateLastUpdatedAt,
    updateLastViewedAt,
    updateName,
    getPerson,
    getAllPeople,
    getAllRelationships,
    deletePerson,
    getPeopleByName,
}
