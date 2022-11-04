const express = require('express');
const path = require('path');
const { randomUUID } = require('crypto');
const { validateRequest, handleRequest, processImage } = require('./src/requestHandler');
const { getObject, getUploadURL } = require('./src/services/s3Service')

const app = express();

const hostname = '127.0.0.1';
const port = 3000

app.use(express.json())
app.use(express.static(path.join(__dirname, '/src/public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/src/index.html'));
});

app.post('/process', async (req, res) => {
    try{
        const { keys, resize, compression } = req.body;

        validateRequest(keys, resize, compression)

        const url = await handleRequest(keys, resize, compression);

        res.send({downloadURL: url});
    }
    catch (error) {
        res.status(error.statusCode).json({ error: error.error})
    }
});

app.post('/api/process', async (req, res) => {
    try{
        const {key, resize, compression} = req.body;

        validateRequest(key, resize, compression);

        const {Body, ContentType} = await getObject(key);

        const keyArr = key.split(".");

        const base = keyArr[0];

        const extension = keyArr[1];

        const processedKey = `${base}-x${resize}-${compression}.${extension}`;

        const processedData = await processImage(processedKey, resize, compression, Body, ContentType);

        console.log(`Processed Image Key: ${processedKey}`)
        
        res.status(200).json({key: processedKey, url: processedData.url});
    }
    catch (error) {
        res.status(error.statusCode).json({ error: error.error})
    }
});

app.post('/upload', async (req, res) => {
    const {contentType, extension} = req.body;

    const key = `${randomUUID()}.${extension}`;

    const url = await getUploadURL(key, contentType);

    res.status(200).json({ uploadUrl: url, key: key})
});

app.get('/health', (req, res) => {
    res.status(200).json({ health: "Healthy"})
})

app.listen(port, function () {
    console.log(`Express app listening at http://${hostname}:${port}/`);
});