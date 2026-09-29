const fs = require('fs');
const https = require('https');
const path = require('path');

const modelsDir = path.join(__dirname, 'public', 'models');
if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
}

const baseUrl = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model/';
const files = [
    'tiny_face_detector_model-weights_manifest.json',
    'tiny_face_detector_model-shard1',
    'face_expression_model-weights_manifest.json',
    'face_expression_model-shard1',
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1'
];

async function download() {
    for (const file of files) {
        const dest = path.join(modelsDir, file);
        console.log(`Downloading ${file}...`);
        await new Promise((resolve, reject) => {
            const fileStream = fs.createWriteStream(dest);
            https.get(baseUrl + file, response => {
                response.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close();
                    resolve();
                });
            }).on('error', err => {
                fs.unlink(dest, () => {});
                reject(err);
            });
        });
    }
    console.log('Done downloading models!');
}

download();
