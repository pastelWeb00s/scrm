const { v4: uuidv4 } = require('uuid');

async function createLocation(session, pid, props) {
    const locationResult = await session.run(`
        MATCH (p:Person {pid: $pid})
        CREATE (l:Location {
          lid: $lid,
          createdAt: datetime(),
          street: $street,
          city: $city,
          postalCode: $postalCode,
          state: $state,
          country: $country,
          longitude: $longitude,
          latitude: $latitude,
          description: $description
        })
        CREATE (p)-[:HAS_LOCATION { rid: $rid, createdAt: datetime() }]->(l)
        RETURN l
      `, { lid: uuidv4(), rid: uuidv4(), pid, ...props });
    return locationResult.records[0];
}

async function updateLocation(session, lid, props) {
    const locationResult = await session.run(`
        MATCH (l:Location {lid: $lid})
        SET l.street = $street, l.city = $city, l.postalCode = $postalCode,
            l.state = $state, l.country = $country, l.longitude = $longitude, l.latitude = $latitude,
            l.description = $description
        RETURN l
      `, { lid, ...props });
    if (locationResult.records.length === 0) {
        return null;
    }
    return locationResult.records[0];
}

async function getLocation(session, lid) {
    const result = await session.run(`
        MATCH (l:Location {lid: $lid}) RETURN l
      `, { lid });
    if (result.records.length === 0) {
        return null;
    }
    return result.records[0].get('l');
}

async function getLocations(session, person) {
    const pid = person.pid;
    const result = await session.run(`
        MATCH (p:Person {pid: $pid})-[:HAS_LOCATION]->(l:Location) RETURN l
      `, { pid });
    return result.records.map(record => record.get('l').properties);
}

async function deleteLocation(session, lid) {
    const result = await session.run(`
    MATCH (l:Location {lid: $lid})
    DETACH DELETE l
  `, {lid,});
    if (result.records.length === 0) {
        return null;
    }
    return result.records[0].get('l');
}

module.exports = {
    createLocation,
    updateLocation,
    getLocations,
    getLocation,
    deleteLocation,
}