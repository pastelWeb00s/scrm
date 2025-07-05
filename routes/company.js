let express = require('express');
let router = express.Router();
const { v4: uuidv4 } = require('uuid');
const {getPerson} = require("../models/person");
const {deleteRelationship} = require("../models/relationship");
const {driver} = require("../db/db");
const {createCompany, deleteCompany} = require("../models/company");
const {getAllFilesForCompany} = require("../models/file");


router.get('/new', async (req, res) => {
  try {
    res.render('add-company', { title: 'Add new company' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.post('/new', async (req, res) => {
  const { name } = req.body;
  const session = driver.session();

  try {
    const company = await createCompany(session, name);
    if (!company) {
      return res.status(404).json({ error: 'No such company' });
    }
    return res.redirect('/company/' + company.properties.cid);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

router.get('/:cid', async (req, res) => {
  const cid = req.params.cid;

  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (c:Company)
      WHERE c.cid = $cid
      RETURN c
    `, { cid });

    if (result.records.length === 0) {
      return res.status(404).send('Company not found.');
    }

    const node = result.records[0].get('c').properties;
    const { currentEmployees, formerEmployees } = await getPeopleInCompany(session, cid);
    const images = (await getAllFilesForCompany(session, node)).map(n => n.properties);

    res.render('company', {
      company: node,
      currentEmployees,
      formerEmployees,
      images,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal server error.');
  } finally {
    await session.close();
  }
});

router.get('/:cid/delete', async (req, res) => {
  const cid = req.params.cid;

  const session = driver.session();
  try {
    await deleteCompany(session, cid);
    return res.redirect('/');
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal server error.');
  } finally {
    await session.close();
  }
});


async function getPeopleInCompany(session, cid) {
  const result = await session.run(`
      MATCH (p:Person)-[r:WORKS_AT]->(c:Company)
      WHERE c.cid = $cid
      RETURN p, r
    `, { cid });
  const employees = result.records.map(record => ({
    person: record.get('p').properties,
    relationship: record.get('r').properties,
  }));
  const currentEmployees = employees.filter(employee => {
    const { endDate, stillWorking } = employee.relationship;
    return stillWorking === true || !endDate;
  });

  const formerEmployees = employees.filter(employee => {
    return currentEmployees.indexOf(employee) === -1;
  });

  return { currentEmployees, formerEmployees };
}

module.exports = router;
