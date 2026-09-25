const query = `
  query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      codeSnippets {
        lang
        langSlug
        code
      }
    }
  }`;
const variables = { titleSlug: 'two-sum' };
fetch('https://leetcode.com/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, variables })
}).then(r => r.json()).then(d => {
  console.log(d.data.question.codeSnippets.slice(0,2));
}).catch(e => console.error(e));
