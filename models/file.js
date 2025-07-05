async function getFile(session, fid) {
    const query = `
      MATCH (f:File {fid: $fid})
      RETURN f
    `;

    const result = await session.run(query, { fid });

    if (result.records.length === 0) {
        return null;
    }
    return result.records[0].get('f');
}

async function getProfileImageForCompany(session, company) {
    const query = `
      MATCH (c:Company {cid: $cid})-[:HAS_FILE]->(f:File)
      WHERE f.fid = c.profileImageFid
      RETURN f
    `;

    const result = await session.run(query, { cid: company.cid, });

    return result.records.length > 0 ? result.records[0].get('f') : null;
}

async function getProfileImage(session, person) {
    const query = `
      MATCH (p:Person {pid: $pid})-[:HAS_FILE]->(f:File)
      WHERE f.fid = p.profileImageFid
      RETURN f
    `;

    const result = await session.run(query, { pid: person.pid, });

    return result.records.length > 0 ? result.records[0].get('f') : null;
}

async function getAllFilesForCompany(session, company) {
    const query = `
      MATCH (c:Company {cid: $cid})-[:HAS_FILE]->(f:File)
      RETURN f
    `;

    const result = await session.run(query, { cid: company.cid, });

    const files = result.records.map(record => record.get('f'));
    return files;
}

async function getAllFiles(session, person) {
    const query = `
      MATCH (p:Person {pid: $pid})-[:HAS_FILE]->(f:File)
      RETURN f
    `;

    const result = await session.run(query, { pid: person.pid, });

    const files = result.records.map(record => record.get('f'));
    return files;
}

module.exports = {
    getFile,
    getAllFiles,
    getProfileImage,
    getAllFilesForCompany,
    getProfileImageForCompany,
}