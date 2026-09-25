const query = `
  query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
    problemsetQuestionList: questionList(
      categorySlug: $categorySlug
      limit: $limit
      skip: $skip
      filters: $filters
    ) {
      total: totalNum
    }
  }`;
const variables = { categorySlug: '', skip: 0, limit: 1, filters: {} };
fetch('http://localhost:5173/lc-api', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, variables })
}).then(r => r.json()).then(d => console.log(JSON.stringify(d, null, 2))).catch(e => console.error(e));
