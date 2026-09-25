async function testPiston() {
    const url = 'https://emkc.org/api/v2/piston/execute';
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            language: 'python',
            version: '3.10.0',
            files: [{ name: 'main.py', content: 'print("hello")' }]
        })
    });
    console.log(res.status);
    console.log(await res.text());
}

testPiston();
