const { v4: uuidv4 } = require('uuid');

async function deleteDate(session, did) {
    const result = await session.run(`
    MATCH (d:Date {did: $did})
    DETACH DELETE d
  `, {did,});
    if (result.records.length === 0) {
        return null;
    }
    return result.records[0].get('d');
}

async function createDate(session, props) {
    const did = uuidv4();
    const { year, month, day, hour, minute, note, remindFrequencyInDays, remindFrequencyInMonths, remindAtStr } = props;
    const nextReminderAt = 
            remindAtStr
	    ? `, nextReminderAt: date($remindAtStr)`
            : ( (remindFrequencyInDays === 0 && remindFrequencyInMonths === 0) ? '' :
	        `
                , nextReminderAt: date() + Duration ({
                    days: $remindFrequencyInDays,
                    months: $remindFrequencyInMonths
                })`
	    );
    const query = `
    CREATE (d:Date {did: $did, createdAt: datetime(),
      year: $year,
      month: $month,
      day: $day,
      hour: $hour,
      minute: $minute,
      note: $note,
      remindFrequencyInDays: $remindFrequencyInDays,
      remindFrequencyInMonths: $remindFrequencyInMonths
      ${nextReminderAt}
    })
    RETURN d
  `;
    const params = {
        did, year, month, day, hour, minute, note, remindFrequencyInDays, remindFrequencyInMonths, remindAtStr,
    };
	console.log('query', query);
	console.log('params', params);
    const result = await session.run(query, params);

    return result.records[0].get('d');
}

module.exports = {
    createDate,
    deleteDate,
}
