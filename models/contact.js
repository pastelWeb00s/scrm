const { v4: uuidv4 } = require('uuid');

async function deleteContact(session, pid, cid) {
    const result = await session.run(`
        MATCH (p:Person)-[:HAS_CONTACT]->(c:Contact)
        WHERE c.cid = $cid AND p.pid = $pid
        DETACH DELETE c
        RETURN p
      `, { cid, pid });
    if (result.records.length === 0) {
        return null;
    }
    return result.records.map((r) => r.get('p'));
}

async function createContact(session, type, value) {
    const cid = uuidv4();
    const result = await session.run(`
    CREATE (c:Contact {
      type: $type, 
      value: $value, 
      cid: $cid, createdAt: datetime()
    })
    RETURN c
  `, { type, value, cid });

    return result.records[0].get('c');
}

module.exports = {
    deleteContact,
    createContact,
}
