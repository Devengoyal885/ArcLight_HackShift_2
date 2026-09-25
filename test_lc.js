const query = `
  query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
    problemsetQuestionList: questionList(
      categorySlug: $categorySlug
      limit: $limit
      skip: $skip
      filters: $filters
    ) {
      total: totalNum
      questions: data {
        title
        titleSlug
        difficulty
        topicTags { name }
      }
    }
  }`;
const variables = { categorySlug: '', skip: 0, limit: 10, filters: {} };
fetch('https://leetcode.com/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, variables })
}).then(r => r.json()).then(d => console.log(JSON.stringify(d, null, 2))).catch(e => console.error(e));
