async function testJudge0() {
    const url = 'https://ce.judge0.com/submissions?base64_encoded=false&wait=true';
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                source_code: 'print("hello")',
                language_id: 71, // python
            })
        });
        console.log(res.status);
        console.log(await res.text());
    } catch (e) {
        console.error(e);
    }
}
testJudge0();
