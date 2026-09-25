import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
    const snap = await db.collection('postedRoles').get();
    snap.forEach(doc => {
        const d = doc.data();
        console.log(doc.id, '|', d.title, '| uid:', d.employerUid, '| comp:', d.companyName);
    });
}
run();
