var express = require('express');
var router = express.Router();
const {getPerson} = require("../models/person");
const {driver} = require("../db/db");
const {getLocation, createLocation, deleteLocation, updateLocation} = require("../models/location");


router.get('/person/:pid/location{/:lid/edit}', async (req, res) => {
    const session = driver.session();
    const { pid, lid } = req.params;

    try {
        const person = await getPerson(session, pid);
        if (!person) {
            return res.status(404).send('No such person');
        }
        if (lid) {
            const location = await getLocation(session, lid);

            if (!location) {
                return res.status(404).send('Location not found');
            } else {
                return res.render('location', { person: person.properties, location: location.properties });
            }
        } else {
            return res.render('location', { person: person.properties, location: { } });
        }
    } catch (error) {
        console.error('Error updating location:', error);
        return res.status(500).send('Error updating location');
    } finally {
        await session.close();
    }
});
router.post('/person/:pid/location{/:lid/edit}', async (req, res) => {
    const session = driver.session();
    const { pid, lid } = req.params;

    try {
        if (lid) {
            const location = await updateLocation(session, lid, req.body);

            if (!location) {
                res.status(404).send('Location not found');
            } else {
                res.redirect(`/person/${pid}`);
            }
        } else {
            await createLocation(session, pid, req.body);
            res.redirect(`/person/${pid}`);
        }
    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).send('Error updating location');
    } finally {
        await session.close();
    }
});

router.get('/person/:pid/location/:lid/delete', async (req, res) => {
    const session = driver.session();
    const { pid, lid } = req.params;

    try {
        const person = await getPerson(session, pid);
        if (!person) {
            return res.status(404).send('No such person');
        }
        await deleteLocation(session, lid);
        return res.redirect(`/person/${pid}`);
    } catch (error) {
        console.error('Error updating location:', error);
        return res.status(500).send('Error updating location');
    } finally {
        await session.close();
    }
});

module.exports = router;
