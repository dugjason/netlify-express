'use strict';
const express = require('express');
const path = require('path');
const serverless = require('serverless-http');
const app = express();
const bodyParser = require('body-parser');

const router = express.Router();
router.get('/', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write('<h1>Hello from Express.js!</h1>');
  res.end();
});

router.get('/another', (req, res) => res.json({ route: req.originalUrl }));

router.post('/', (req, res) => res.json({ postBody: req.body }));

router.post('/postDraft', (req, res) => {
  postDraft(req.body.conversationId)
  .then((result) => {
    res.json({ result: JSON.stringify(result) })
  })
);

app.use(bodyParser.json());
app.use('/.netlify/functions/server', router);  // path must route to lambda
app.use('/', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));

module.exports = app;
module.exports.handler = serverless(app);

const FRONT_API_TOKEN = process.env.FRONT_API_TOKEN;

const FormData = require('form-data');
const fs = require('fs');

// abstract and promisify actual network request
async function makeRequest(formData, options) {
  return new Promise((resolve, reject) => {
    const req = formData.submit(options, (err, res) => {
      if (err)
        return reject(new Error(err.message))

      if (res.statusCode < 200 || res.statusCode > 299)
        return reject(new Error(`HTTP status code ${res.statusCode}`))

      const body = [];
      res.on('data', (chunk) => body.push(chunk));
      res.on('end', () => {
        const resString = Buffer.concat(body).toString();
        resolve(resString);
      })
    })
  })
}

async function postDraft(conversationId) {
  const formData = new FormData()

  // Set your data here: (See full options at https://dev.frontapp.com/reference/messages-1#post_channels-channel-id-messages)
  formData.append('author_id', 'alt:email:jason@frontapp.com');
  formData.append('channel_id', 'cha_jei');
  formData.append('body', '<p>Message body</p>');
  formData.append('attachments[0]', fs.createReadStream('./photo.png'));

  const options = {
    host: 'api2.frontapp.com',
    path: `/conversations/${conversationId}/drafts`,
    method: 'POST',
    protocol: 'https:', // note : in the end
    headers: {
      Authorization: `Bearer ${FRONT_API_TOKEN}`
    },
  }

  makeRequest(formData, options)
  .then((response) => {
    return response
  })
}
