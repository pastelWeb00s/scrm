async function search(session, searchTerm) {
    const people = await searchPerson(session, searchTerm);
    const peopleWithCompany = await searchPersonWithCompany(session, searchTerm);
    const peopleWithLocation = await searchPersonWithLocation(session, searchTerm);
    const peopleWithNote = await searchPersonWithNote(session, searchTerm);
    const peopleWithContact = await searchPersonWithContact(session, searchTerm);
    const peopleWithDate = await searchPersonWithDate(session, searchTerm);
    const peopleWithActivity = await searchPersonWithActivity(session, searchTerm);
    return {
        people,
        peopleWithCompany,
        peopleWithLocation,
        peopleWithNote,
        peopleWithContact,
        peopleWithDate,
        peopleWithActivity,
    };
}

async function searchPerson(session, searchTerm) {
    const query = `
    MATCH (p:Person)
    WHERE 
        toLower(p.name) CONTAINS toLower($searchTerm) OR
        toLower($searchTerm) IN p.tags
    RETURN p
  `;
    try {
        const result = await session.run(query, { searchTerm });
        return result.records.map(record => record.get('p').properties);
    } catch (error) {
        console.error('Error executing searchPerson:', error);
        throw error;
    }
}

async function searchPersonWithCompany(session, searchTerm) {
    const query = `
    MATCH (p:Person)-[:WORKS_AT]->(c:Company)
    WHERE toLower(c.name) CONTAINS toLower($searchTerm)
    RETURN p, c
  `;
    try {
        const result = await session.run(query, { searchTerm });
        return result.records.map(record => ({
            person: record.get('p').properties,
            company: record.get('c').properties
        }));
    } catch (error) {
        console.error('Error executing searchPersonWithCompany:', error);
        throw error;
    }
}

async function searchPersonWithLocation(session, searchTerm) {
    const query = `
    MATCH (p:Person)-[:HAS_LOCATION]->(l:Location)
    WHERE
            toLower(l.street     ) CONTAINS toLower($searchTerm) 
         OR toLower(l.city       ) CONTAINS toLower($searchTerm)
         OR toLower(l.postalCode ) CONTAINS toLower($searchTerm)
         OR toLower(l.state      ) CONTAINS toLower($searchTerm)
         OR toLower(l.country    ) CONTAINS toLower($searchTerm) 
         OR toLower(l.longitude  ) CONTAINS toLower($searchTerm)
         OR toLower(l.latitude   ) CONTAINS toLower($searchTerm)
    RETURN p, l
  `;
    try {
        const result = await session.run(query, { searchTerm });
        return result.records.map(record => ({
            person: record.get('p').properties,
            location: record.get('l').properties
        }));
    } catch (error) {
        console.error('Error executing searchPersonWithLocation:', error);
        throw error;
    }
}

async function searchPersonWithNote(session, searchTerm) {
    const query = `
    MATCH (p:Person)-[:HAS_NOTE]->(n:Note)
    WHERE toLower(n.content) CONTAINS toLower($searchTerm)
    RETURN p, n
  `;
    try {
        const result = await session.run(query, { searchTerm });
        return result.records.map(record => ({
            person: record.get('p').properties,
            note: record.get('n').properties
        }));
    } catch (error) {
        console.error('Error executing searchPersonWithNote:', error);
        throw error;
    }
}

async function searchPersonWithActivity(session, searchTerm) {
    const query = `
    MATCH (p:Person)-[:PARTICIPATES_IN]->(a:Activity)
    WHERE toLower(a.name) CONTAINS toLower($searchTerm)
        OR toLower(a.description) CONTAINS toLower($searchTerm)
    RETURN p, a
  `;
    try {
        const result = await session.run(query, { searchTerm });
        return result.records.map(record => ({
            person: record.get('p').properties,
            activity: record.get('a').properties
        }));
    } catch (error) {
        console.error('Error executing searchPersonWithContact:', error);
        throw error;
    }
}

async function searchPersonWithContact(session, searchTerm) {
    const query = `
    MATCH (p:Person)-[:HAS_CONTACT]->(c:Contact)
    WHERE toLower(c.type) CONTAINS toLower($searchTerm)
        OR toLower(c.value) CONTAINS toLower($searchTerm)
    RETURN p, c
  `;
    try {
        const result = await session.run(query, { searchTerm });
        return result.records.map(record => ({
            person: record.get('p').properties,
            contact: record.get('c').properties
        }));
    } catch (error) {
        console.error('Error executing searchPersonWithContact:', error);
        throw error;
    }
}

async function searchPersonWithDate(session, searchTerm) {
    return []; // TODO
}

module.exports = {
    search,
}
