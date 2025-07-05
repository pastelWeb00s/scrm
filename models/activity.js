const { v4: uuidv4 } = require('uuid');
async function deleteActivity(session, aid) {
    const result = await session.run(`
    MATCH (a:Activity {aid: $aid})
    DETACH DELETE a
  `, { aid });
    if (result.records.length === 0) {
        return null;
    }

    return result.records[0].get('a');
}
async function getActivity(session, aid) {
    const result = await session.run(`
    MATCH (a:Activity {aid: $aid})
    RETURN a
  `, { aid });
    if (result.records.length === 0) {
        return null;
    }

    return result.records[0].get('a');
}

async function createActivity(session, props) {
    const aid = uuidv4();
    const { name, startDate, endDate, location, description, participants } = props;
    const result = await session.run(`
      CREATE (a:Activity {
        aid: $aid, createdAt: datetime(),
        name: $name, 
        startDate: $startDate, 
        endDate: $endDate, 
        location: $location, 
        description: $description
      })
      RETURN a
    `, { aid, name, startDate, endDate, location, description });

    return result.records[0].get('a');
}

module.exports = {
    getActivity,
    deleteActivity,
    createActivity,
}
