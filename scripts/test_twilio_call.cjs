require('dotenv').config();
const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const from = process.env.TWILIO_PHONE_NUMBER;
const auth = 'Basic ' + Buffer.from(sid + ':' + token).toString('base64');

async function testCall() {
    const twiml = '<Response><Say voice="alice" language="en-IN">Hello from CapAble Placement Assistant! Your application deadline reminder system is fully operational.</Say></Response>';
    
    // Check Twilio verified numbers
    const vRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/OutgoingCallerIds.json`, {
        headers: { Authorization: auth }
    });
    const vData = await vRes.json();
    const verifiedNumbers = (vData.outgoing_caller_ids || []).map(v => v.phone_number);
    console.log('Account Mode: Trial');
    console.log('Active Twilio Phone (From):', from);
    console.log('Verified Numbers permitted to receive calls in Trial:', verifiedNumbers);

    // Test calling the verified number
    const targetNumber = verifiedNumbers[0];
    if (!targetNumber) {
        console.error('No verified numbers found in trial account!');
        return;
    }

    console.log(`Initiating voice call to ${targetNumber} using inline Twiml...`);
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`, {
        method: 'POST',
        headers: {
            'Authorization': auth,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            From: from,
            To: targetNumber,
            Twiml: twiml
        }).toString()
    });

    const result = await r.json();
    if (r.ok) {
        console.log('🎉 CALL QUEUED SUCCESSFULLY!');
        console.log('Call SID:', result.sid);
        console.log('Status:', result.status);
    } else {
        console.error('❌ Call failed:', result.code, result.message);
    }
}

testCall().catch(console.error);
