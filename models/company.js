const { v4: uuidv4 } = require('uuid');

async function getAllCompanies(session) {
    const result = await session.run(`MATCH (c:Company) RETURN c`);
    return result.records.map(c => c.get('c'));
}

async function createCompany(session, name) {
    const cid = uuidv4();
    const result = await session.run(`
    CREATE (c:Company {
      name: $name, cid: $cid, createdAt: datetime()
    })
    RETURN c
  `, { name, cid });

    return result.records[0].get('c');
}

async function deleteCompany(session, cid) {
    const result = await session.run(`MATCH (c:Company {cid: $cid}) DETACH DELETE c`, {cid});
    return result.records;
}

module.exports = {
    getAllCompanies,
    createCompany,
    deleteCompany,
}