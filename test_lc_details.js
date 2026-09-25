const query = `
  query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionId
      questionFrontendId
      title
      titleSlug
      isPaidOnly
      difficulty
      likes
      dislikes
      content
      exampleTestcases
      topicTags {
        name
        slug
      }
      stats
      hints
    }
  }`;
const variables = { titleSlug: 'two-sum' };
fetch('https://leetcode.com/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, variables })
}).then(r => r.json()).then(d => {
  console.log(d.data.question.content ? 'HAS CONTENT' : 'NO CONTENT');
  console.log('Examples:', d.data.question.exampleTestcases);
  console.log('Content preview:', d.data.question.content.substring(0, 300));
}).catch(e => console.error(e));
