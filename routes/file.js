const multer = require('multer');
const path = require('path');
const fs = require('fs');
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const {driver} = require("../db/db");


const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.mimetype.startsWith('image/') && [".png", ".jpg", ".jpeg"].indexOf(ext) >= 0) {
        cb(null, true);
    } else {
        cb(new Error('Not an image file!'), false);
    }
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, uuidv4() + path.extname(file.originalname).toLowerCase());
    }
});

const upload = multer({
    storage,
    fileFilter,
});

if (!fs.existsSync('public/uploads')) {
    fs.mkdirSync('public/uploads');
}

router.get('/person/:pid/file/new', (req, res) => {
    res.render('upload');
});
router.get('/company/:cid/file/new', (req, res) => {
    res.render('upload');
});
router.post('/person/:pid/file/new', upload.single('file'), async (req, res) => {
    const session = driver.session();
    try {
        await handlePostNew(session, req, true);
        return res.redirect('/person/' + req.params.pid);
    } catch (error) {
        console.error('Error linking file:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        await session.close();
    }
});
router.post('/company/:cid/file/new', upload.single('file'), async (req, res) => {
    const session = driver.session();
    try {
        await handlePostNew(session, req, false, true);
        return res.redirect('/company/' + req.params.cid);
    } catch (error) {
        console.error('Error linking file:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        await session.close();
    }
});

router.get('/person/:pid/file/:fid/delete', async (req, res) => {
    const session = driver.session();
    try {
        await handleDelete(session, req, true);
        res.redirect(`/person/${req.params.pid}`);
    } catch (error) {
        console.error('Error deleting file from person:', error);
        res.status(500).json({message: 'Internal server error'});
    } finally {
        await session.close();
    }
});

router.get('/company/:cid/file/:fid/delete', async (req, res) => {
    const session = driver.session();
    try {
        await handleDelete(session, req, true);
        res.redirect(`/company/${req.params.cid}`);
    } catch (error) {
        console.error('Error deleting file from person:', error);
        res.status(500).json({message: 'Internal server error'});
    } finally {
        await session.close();
    }
});

async function handleDelete(session, req) {
    const { fid } = req.params;

    const query = `
      MATCH (f:File {fid: $fid})
      OPTIONAL MATCH (x)-[:HAS_FILE]->(f)
      DETACH DELETE f
      RETURN f, x
    `;
    const file = await session.run('MATCH (f:File {fid: $fid}) RETURN f', {fid});
    const result = await session.run(query, {fid});

    if (file.records.length === 0 || result.records.length === 0) {
        return res.status(404).json({message: 'File not found'});
    }

    const path = file.records[0].get('f').properties.pathOnDisk;
    fs.unlink(path, (err) => {
        if (err) {
            console.error('Error deleting file from filesystem:', err);
            throw Error('File deleted from database but not from filesystem');
        }
    });
}

async function handlePostNew(session, req, isPerson, isCompany) {
    const pid = req.params.pid;
    const cid = req.params.cid;
    const fullpath = req.file ? req.file.path : null;
    const isProfileImage = req.body.isProfileImage === 'true';

    if (!fullpath) {
        throw Error('No path provided');
    }
    if (!isPerson && !isCompany) {
        throw Error('Not a person or company!');
    }
    if (isPerson && isCompany) {
        throw Error('A person and company?');
    }
    const match = isPerson
        ? "(x:Person {pid: $pid})"
        : "(x:Company {cid: $cid})";

        const query = `
          MATCH ${match}
          CREATE (f:File {
            fid: $fid,
            publicPath: $publicPath,
            name: $name,
            createdAt: datetime(),
            pathOnDisk: $pathOnDisk
          })
          MERGE (x)-[:HAS_FILE {rid: $rid, createdAt: datetime()}]->(f)
          ${isProfileImage ? 'SET x.profileImageFid = $fid' : ''}
          RETURN x, f
        `;

        const result = await session.run(query, {
            pid,
            cid,
            fid: uuidv4(),
            rid: uuidv4(),
            name: path.basename(fullpath),
            publicPath: fullpath.replace(/^public./, ''),
            pathOnDisk: fullpath,
        });
        if (result.records.length === 0) {
            return res.status(403).json({ message: 'No records found' });
        }

        const fileNode = result.records[0].get('f');
        return fileNode.properties;
}

module.exports = router;
