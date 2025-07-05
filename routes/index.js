const express = require('express');
const router = express.Router();
const {getAllPeople} = require("../models/person");
const {driver} = require("../db/db");
const {getAllCompanies} = require("../models/company");
const {getProfileImage, getProfileImageForCompany} = require("../models/file");

router.get('/', async (req, res, next) => {
  const session = driver.session();

  try {
    await updateRecurringReminders(session);

    const people = (await getAllPeople(session))
        .map(p => p.properties)
        .sort((a, b) => a.name.localeCompare(b.name))
    ;
    const companies = (await getAllCompanies(session))
        .map(p => p.properties)
        .sort((a, b) => a.name.localeCompare(b.name))
    ;
    const dates = await getDashboardDates(session);
    const profileImages = {};
    for (let person of people) {
      profileImages[person.pid] = (await getProfileImage(session, person) || {}).properties;
    }
    for (let company of companies) {
      profileImages[company.cid] = (await getProfileImageForCompany(session, company) || {}).properties;
    }
    res.render('index', { title: 'Dashboard', people, companies, dates, profileImages });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

async function getDashboardDates(session) {
  const result = await session.run(`
    MATCH (p:Person)-[:HAS_DATE]->(d:Date)
    WHERE
      d.nextReminderAt IS NOT NULL AND (
           d.nextReminderAt.month = date().month
        OR date(d.nextReminderAt) <= date() + Duration({ months: 3 })
      )
    RETURN p, d
    ORDER BY d.year, d.month, d.date, d.hour, d.minute
  `);
  return result.records.map(r => {
    return {
      person: r.get('p').properties,
      date: r.get('d').properties,
    };
  });
}

async function updateRecurringReminders(session) {
  const updatedReminders = new Set();
  let hasUpdates = true;
  while (hasUpdates) {
    const result = await session.run(`
      MATCH (d:Date)
      WHERE d.nextReminderAt IS NOT NULL AND date(d.nextReminderAt) <= date() AND (
        d.remindFrequencyInDays > 0 OR d.remindFrequencyInMonths > 0
      )
      SET d.nextReminderAt = date(d.nextReminderAt) + duration({days: coalesce(d.remindFrequencyInDays, 0), months: coalesce(d.remindFrequencyInMonths, 0)})
      SET d.lastUpdatedAt = datetime()
      RETURN d
    `);
    const records = result.records;
    if (records.length > 0) {
      records.forEach(record => {
        const updatedDateNode = record.get('d');
        updatedReminders.add(updatedDateNode.properties.did);
      });
    } else {
      hasUpdates = false;
    }
  }
  return updatedReminders;
}

module.exports = router;
