/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const functions = require('firebase-functions');
const onCreateUser = require('./on-create-user')
const exportCsv = require('./export-csv')
const exportKml = require('./export-kml')
const updateColumns = require('./update-columns')
const onCreateRecord = require('./on-create-record')
const onUpdateRecord = require('./on-update-record')
const importCsv = require('./import-csv')
const hardcodedInsert = require('./hardcoded')


/*
app.use(
    bodyParser.csv({
        csvParseOptions: {
            fastcsvParams: {
                headers: true,
                trim: true,
            },
            subscribe: ((json) => {
                // some line transformation
                transform(data => ({
                    featureCaption: data.name + data.state,
                    featureLat: data.lat,
                    featureLong: data.long,
                }))
                .on('error', error => console.error(error))
                .on('data', row => console.log(JSON.stringify(row)))
                .on('end', rowCount => console.log(`Parsed ${rowCount} rows`));
                return json;
            }),
        },
        limit: "15MB",
    })
); */

// Create user profile in database when user first logs in.
exports.onCreateUser = functions.auth.user().onCreate(onCreateUser);

exports.exportCsv = functions.https.onRequest(
    (req, res) =>
        exportCsv(req, res).catch(err => res.status(500).send(`${err}`)));
exports.exportKml = functions.https.onRequest(
    (req, res) =>
        exportKml(req, res).catch(err => res.status(500).send(`${err}`)));

// Test via shell:
// updateColumns.get('/?project=R06MucQJSWvERdE7SiL1&featureType=aaaaaaaa&form=1234567')
exports.updateColumns = functions.https.onRequest(
    (req, res) =>
        updateColumns(req, res).catch(err => res.status(500).send(`${err}`)));

// Test via shell:
// onCreateRecord({featureTypeId: 'households', formId: '1', responses: {'interviewer': 'Nikola Tesla'}}, {params: {projectId: 'R06MucQJSWvERdE7SiL1', featureId: 'p9lyePfXYPOByUFpnIVp', recordId: 'newRecord'}});
exports.onCreateRecord =
    functions.firestore
        .document(
            'projects/{projectId}/features/{featureId}/records/{recordId}')
        .onCreate((change, context) => onCreateRecord(change, context));

// Test via shell:
// onUpdateRecord({after: {featureTypeId: 'households', formId: '1', responses: {'interviewer': 'George Washington'}}}, {params: {projectId: 'R06MucQJSWvERdE7SiL1', featureId: 'p9lyePfXYPOByUFpnIVp', recordId: 'newRecord'}});
exports.onUpdateRecord =
    functions.firestore
        .document(
            'projects/{projectId}/features/{featureId}/records/{recordId}')
        .onUpdate((change, context) => onUpdateRecord(change, context));

// TODO(tiyara): Toy test via shell (do not submit).
exports.test = functions.https.onRequest(
    (req, res) => res.status(200).send(`Hello World`));

    /*
// Test csv streaming to firebase
// importCsv(projectId: '', layerId: '' , csvString: 'Ferrera, GR, 8.986493, 46.743506')
// https://firebase.google.com/docs/functions/http-events#using_existing_express_apps
// Double-check whether multer is good to pick csv file from the storage.

app.post('/csv', upload, (req, res) => importCsv(req, res).catch(err => res.status(500).send(`${err}`)));
exports.importCsv = functions.https.onRequest(app);
*/

// Simple Testing express:
//app.get('/', (req, res) => res.status(200).send(`Hello World!`));
//exports.helloWorld = functions.https.onRequest(app);

// Simple import test
// app.post('/', (req, res) => importCsv(req, res).catch(err => res.status(500).send(`${err}`)));
// exports.import = functions.https.onRequest(app);

const express = require('express');
const bodyParser = require('body-parser');
const multer  = require('multer');

const upload  = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(bodyParser.urlencoded({extended: true}));

app.post('/', upload.single('profile_pic'), (req, res, next) => {
    console.log(req.headers);
    const file = req.file;
    if (!file) {
        const error = new Error('Please upload a file');
    error.httpStatusCode = 400;
    return next(error);
    }
    console.log(req.body);
    console.log("Reqfile is " + file);
    res.send(file);
})
exports.import = functions.https.onRequest(app);

// TODO(tiyara): Another library
//exports.importCsv = functions.https.onRequest(
  //(req, res) => importCsv(req, res).catch(err => res.status(500).send(`${err}`)));

// Just to test local firestore setup
exports.hardcodedInsert = functions.https.onRequest(
    (req, res) => hardcodedInsert(req, res).catch(err => res.status(500).send(`${err}`)));