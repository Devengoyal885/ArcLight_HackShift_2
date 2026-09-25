async function testJudge0Langs() {
    const url = 'https://ce.judge0.com/submissions?base64_encoded=false&wait=true';
    const langs = [
        { id: 71, name: 'Python', code: 'print("hello")' },
        { id: 63, name: 'JavaScript', code: 'console.log("hello")' },
        { id: 62, name: 'Java', code: 'public class Main { public static void main(String[] args) { System.out.println("hello"); } }' },
        { id: 54, name: 'C++', code: '#include <iostream>\nint main() { std::cout << "hello\\n"; return 0; }' }
    ];
    for (const l of langs) {
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source_code: l.code, language_id: l.id })
            });
            const data = await res.json();
            console.log(l.name, data.status.description, data.stdout);
        } catch (e) {
            console.error(e);
        }
    }
}
testJudge0Langs();
