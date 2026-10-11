export interface LCProblemItem {
    questionId: string;
    title: string;
    titleSlug: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    topicTags: { name: string; slug: string }[];
    content: string;
    exampleTestcases: string;
}

export const CURATED_LEETCODE_PROBLEMS: LCProblemItem[] = [
    {
        questionId: '1',
        title: 'Two Sum',
        titleSlug: 'two-sum',
        difficulty: 'Easy',
        topicTags: [{ name: 'Array', slug: 'array' }, { name: 'Hash Table', slug: 'hash-table' }],
        content: `<p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return <em>indices of the two numbers such that they add up to <code>target</code></em>.</p>
<p>You may assume that each input would have <strong><em>exactly</em> one solution</strong>, and you may not use the <em>same</em> element twice.</p>
<p>You can return the answer in any order.</p>
<p>&nbsp;</p>
<p><strong>Example 1:</strong></p>
<pre><strong>Input:</strong> nums = [2,7,11,15], target = 9
<strong>Output:</strong> [0,1]
<strong>Explanation:</strong> Because nums[0] + nums[1] == 9, we return [0, 1].
</pre>
<p><strong>Example 2:</strong></p>
<pre><strong>Input:</strong> nums = [3,2,4], target = 6
<strong>Output:</strong> [1,2]
</pre>
<p><strong>Constraints:</strong></p>
<ul>
    <li><code>2 &lt;= nums.length &lt;= 10<sup>4</sup></code></li>
    <li><code>-10<sup>9</sup> &lt;= nums[i] &lt;= 10<sup>9</sup></code></li>
    <li><code>-10<sup>9</sup> &lt;= target &lt;= 10<sup>9</sup></code></li>
    <li><strong>Only one valid answer exists.</strong></li>
</ul>`,
        exampleTestcases: '[2,7,11,15]\n9\n[3,2,4]\n6\n[3,3]\n6'
    },
    {
        questionId: '2',
        title: 'Add Two Numbers',
        titleSlug: 'add-two-numbers',
        difficulty: 'Medium',
        topicTags: [{ name: 'Linked List', slug: 'linked-list' }, { name: 'Math', slug: 'math' }, { name: 'Recursion', slug: 'recursion' }],
        content: `<p>You are given two <strong>non-empty</strong> linked lists representing two non-negative integers. The digits are stored in <strong>reverse order</strong>, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.</p>
<p>You may assume the two numbers do not contain any leading zero, except the number 0 itself.</p>
<p>&nbsp;</p>
<p><strong>Example 1:</strong></p>
<pre><strong>Input:</strong> l1 = [2,4,3], l2 = [5,6,4]
<strong>Output:</strong> [7,0,8]
<strong>Explanation:</strong> 342 + 465 = 807.
</pre>
<p><strong>Constraints:</strong></p>
<ul>
    <li>The number of nodes in each linked list is in the range <code>[1, 100]</code>.</li>
    <li><code>0 &lt;= Node.val &lt;= 9</code></li>
</ul>`,
        exampleTestcases: '[2,4,3]\n[5,6,4]\n[0]\n[0]\n[9,9,9,9,9,9,9]\n[9,9,9,9]'
    },
    {
        questionId: '3',
        title: 'Longest Substring Without Repeating Characters',
        titleSlug: 'longest-substring-without-repeating-characters',
        difficulty: 'Medium',
        topicTags: [{ name: 'Hash Table', slug: 'hash-table' }, { name: 'String', slug: 'string' }, { name: 'Sliding Window', slug: 'sliding-window' }],
        content: `<p>Given a string <code>s</code>, find the length of the <strong>longest substring</strong> without repeating characters.</p>
<p>&nbsp;</p>
<p><strong>Example 1:</strong></p>
<pre><strong>Input:</strong> s = "abcabcbb"
<strong>Output:</strong> 3
<strong>Explanation:</strong> The answer is "abc", with the length of 3.
</pre>
<p><strong>Example 2:</strong></p>
<pre><strong>Input:</strong> s = "bbbbb"
<strong>Output:</strong> 1
<strong>Explanation:</strong> The answer is "b", with the length of 1.
</pre>`,
        exampleTestcases: '"abcabcbb"\n"bbbbb"\n"pwwkew"'
    },
    {
        questionId: '4',
        title: 'Median of Two Sorted Arrays',
        titleSlug: 'median-of-two-sorted-arrays',
        difficulty: 'Hard',
        topicTags: [{ name: 'Array', slug: 'array' }, { name: 'Binary Search', slug: 'binary-search' }, { name: 'Divide and Conquer', slug: 'divide-and-conquer' }],
        content: `<p>Given two sorted arrays <code>nums1</code> and <code>nums2</code> of size <code>m</code> and <code>n</code> respectively, return <strong>the median</strong> of the two sorted arrays.</p>
<p>The overall run time complexity should be <code>O(log (m+n))</code>.</p>`,
        exampleTestcases: '[1,3]\n[2]\n[1,2]\n[3,4]'
    },
    {
        questionId: '5',
        title: 'Longest Palindromic Substring',
        titleSlug: 'longest-palindromic-substring',
        difficulty: 'Medium',
        topicTags: [{ name: 'Two Pointers', slug: 'two-pointers' }, { name: 'String', slug: 'string' }, { name: 'Dynamic Programming', slug: 'dynamic-programming' }],
        content: `<p>Given a string <code>s</code>, return <em>the longest palindromic substring</em> in <code>s</code>.</p>
<p><strong>Example 1:</strong></p>
<pre><strong>Input:</strong> s = "babad"
<strong>Output:</strong> "bab" (or "aba")</pre>`,
        exampleTestcases: '"babad"\n"cbbd"'
    },
    {
        questionId: '11',
        title: 'Container With Most Water',
        titleSlug: 'container-with-most-water',
        difficulty: 'Medium',
        topicTags: [{ name: 'Array', slug: 'array' }, { name: 'Two Pointers', slug: 'two-pointers' }, { name: 'Greedy', slug: 'greedy' }],
        content: `<p>You are given an integer array <code>height</code> of length <code>n</code>. There are <code>n</code> vertical lines drawn such that the two endpoints of the <code>i<sup>th</sup></code> line are <code>(i, 0)</code> and <code>(i, height[i])</code>.</p>
<p>Find two lines that together with the x-axis form a container, such that the container contains the most water.</p>
<p>Return <em>the maximum amount of water a container can store</em>.</p>`,
        exampleTestcases: '[1,8,6,2,5,4,8,3,7]\n[1,1]'
    },
    {
        questionId: '15',
        title: '3Sum',
        titleSlug: '3sum',
        difficulty: 'Medium',
        topicTags: [{ name: 'Array', slug: 'array' }, { name: 'Two Pointers', slug: 'two-pointers' }, { name: 'Sorting', slug: 'sorting' }],
        content: `<p>Given an integer array nums, return all the triplets <code>[nums[i], nums[j], nums[k]]</code> such that <code>i != j</code>, <code>i != k</code>, and <code>j != k</code>, and <code>nums[i] + nums[j] + nums[k] == 0</code>.</p>
<p>Notice that the solution set must not contain duplicate triplets.</p>`,
        exampleTestcases: '[-1,0,1,2,-1,-4]\n[0,1,1]\n[0,0,0]'
    },
    {
        questionId: '20',
        title: 'Valid Parentheses',
        titleSlug: 'valid-parentheses',
        difficulty: 'Easy',
        topicTags: [{ name: 'String', slug: 'string' }, { name: 'Stack', slug: 'stack' }],
        content: `<p>Given a string <code>s</code> containing just the characters <code>'('</code>, <code>')'</code>, <code>'{'</code>, <code>'}'</code>, <code>'['</code> and <code>']'</code>, determine if the input string is valid.</p>
<p>An input string is valid if:</p>
<ol>
    <li>Open brackets must be closed by the same type of brackets.</li>
    <li>Open brackets must be closed in the correct order.</li>
    <li>Every close bracket has a corresponding open bracket of the same type.</li>
</ol>`,
        exampleTestcases: '"()"\n"()[]{}"\n"(]"'
    },
    {
        questionId: '21',
        title: 'Merge Two Sorted Lists',
        titleSlug: 'merge-two-sorted-lists',
        difficulty: 'Easy',
        topicTags: [{ name: 'Linked List', slug: 'linked-list' }, { name: 'Recursion', slug: 'recursion' }],
        content: `<p>You are given the heads of two sorted linked lists <code>list1</code> and <code>list2</code>.</p>
<p>Merge the two lists into one <strong>sorted</strong> list. The list should be made by splicing together the nodes of the first two lists.</p>
<p>Return <em>the head of the merged linked list</em>.</p>`,
        exampleTestcases: '[1,2,4]\n[1,3,4]\n[]\n[]\n[]\n[0]'
    },
    {
        questionId: '22',
        title: 'Generate Parentheses',
        titleSlug: 'generate-parentheses',
        difficulty: 'Medium',
        topicTags: [{ name: 'String', slug: 'string' }, { name: 'Dynamic Programming', slug: 'dynamic-programming' }, { name: 'Backtracking', slug: 'backtracking' }],
        content: `<p>Given <code>n</code> pairs of parentheses, write a function to <em>generate all combinations of well-formed parentheses</em>.</p>`,
        exampleTestcases: '3\n1'
    },
    {
        questionId: '23',
        title: 'Merge k Sorted Lists',
        titleSlug: 'merge-k-sorted-lists',
        difficulty: 'Hard',
        topicTags: [{ name: 'Linked List', slug: 'linked-list' }, { name: 'Divide and Conquer', slug: 'divide-and-conquer' }, { name: 'Heap (Priority Queue)', slug: 'heap-priority-queue' }],
        content: `<p>You are given an array of <code>k</code> linked-lists <code>lists</code>, each linked-list is sorted in ascending order.</p>
<p><em>Merge all the linked-lists into one sorted linked-list and return it.</em></p>`,
        exampleTestcases: '[[1,4,5],[1,3,4],[2,6]]\n[]\n[[]]'
    },
    {
        questionId: '33',
        title: 'Search in Rotated Sorted Array',
        titleSlug: 'search-in-rotated-sorted-array',
        difficulty: 'Medium',
        topicTags: [{ name: 'Array', slug: 'array' }, { name: 'Binary Search', slug: 'binary-search' }],
        content: `<p>There is an integer array <code>nums</code> sorted in ascending order (with distinct values).</p>
<p>Prior to being passed to your function, <code>nums</code> is possibly rotated at an unknown pivot index.</p>
<p>Given the array <code>nums</code> after the possible rotation and an integer <code>target</code>, return <em>the index of </em><code>target</code><em> if it is in </em><code>nums</code><em>, or </em><code>-1</code><em> if it is not in </em><code>nums</code>.</p>`,
        exampleTestcases: '[4,5,6,7,0,1,2]\n0\n[4,5,6,7,0,1,2]\n3\n[1]\n0'
    },
    {
        questionId: '42',
        title: 'Trapping Rain Water',
        titleSlug: 'trapping-rain-water',
        difficulty: 'Hard',
        topicTags: [{ name: 'Array', slug: 'array' }, { name: 'Two Pointers', slug: 'two-pointers' }, { name: 'Dynamic Programming', slug: 'dynamic-programming' }, { name: 'Stack', slug: 'stack' }],
        content: `<p>Given <code>n</code> non-negative integers representing an elevation map where the width of each bar is <code>1</code>, compute how much water it can trap after raining.</p>`,
        exampleTestcases: '[0,1,0,2,1,0,1,3,2,1,2,1]\n[4,2,0,3,2,5]'
    },
    {
        questionId: '46',
        title: 'Permutations',
        titleSlug: 'permutations',
        difficulty: 'Medium',
        topicTags: [{ name: 'Array', slug: 'array' }, { name: 'Backtracking', slug: 'backtracking' }],
        content: `<p>Given an array <code>nums</code> of distinct integers, return <em>all the possible permutations</em>. You can return the answer in <strong>any order</strong>.</p>`,
        exampleTestcases: '[1,2,3]\n[0,1]\n[1]'
    },
    {
        questionId: '49',
        title: 'Group Anagrams',
        titleSlug: 'group-anagrams',
        difficulty: 'Medium',
        topicTags: [{ name: 'Array', slug: 'array' }, { name: 'Hash Table', slug: 'hash-table' }, { name: 'String', slug: 'string' }, { name: 'Sorting', slug: 'sorting' }],
        content: `<p>Given an array of strings <code>strs</code>, group <strong>the anagrams</strong> together. You can return the answer in <strong>any order</strong>.</p>`,
        exampleTestcases: '["eat","tea","tan","ate","nat","bat"]\n[""]\n["a"]'
    },
    {
        questionId: '53',
        title: 'Maximum Subarray',
        titleSlug: 'maximum-subarray',
        difficulty: 'Medium',
        topicTags: [{ name: 'Array', slug: 'array' }, { name: 'Divide and Conquer', slug: 'divide-and-conquer' }, { name: 'Dynamic Programming', slug: 'dynamic-programming' }],
        content: `<p>Given an integer array <code>nums</code>, find the subarray with the largest sum, and return <em>its sum</em> (Kadane's algorithm).</p>`,
        exampleTestcases: '[-2,1,-3,4,-1,2,1,-5,4]\n[1]\n[5,4,-1,7,8]'
    },
    {
        questionId: '54',
        title: 'Spiral Matrix',
        titleSlug: 'spiral-matrix',
        difficulty: 'Medium',
        topicTags: [{ name: 'Array', slug: 'array' }, { name: 'Matrix', slug: 'matrix' }, { name: 'Simulation', slug: 'simulation' }],
        content: `<p>Given an <code>m x n</code> <code>matrix</code>, return <em>all elements of the</em> <code>matrix</code> <em>in spiral order</em>.</p>`,
        exampleTestcases: '[[1,2,3],[4,5,6],[7,8,9]]\n[[1,2,3,4],[5,6,7,8],[9,10,11,12]]'
    },
    {
        questionId: '55',
        title: 'Jump Game',
        titleSlug: 'jump-game',
        difficulty: 'Medium',
        topicTags: [{ name: 'Array', slug: 'array' }, { name: 'Dynamic Programming', slug: 'dynamic-programming' }, { name: 'Greedy', slug: 'greedy' }],
        content: `<p>You are given an integer array <code>nums</code>. You are initially positioned at the array's <strong>first index</strong>, and each element in the array represents your maximum jump length at that position.</p>
<p>Return <code>true</code><em> if you can reach the last index, or </em><code>false</code><em> otherwise</em>.</p>`,
        exampleTestcases: '[2,3,1,1,4]\n[3,2,1,0,4]'
    },
    {
        questionId: '56',
        title: 'Merge Intervals',
        titleSlug: 'merge-intervals',
        difficulty: 'Medium',
        topicTags: [{ name: 'Array', slug: 'array' }, { name: 'Sorting', slug: 'sorting' }],
        content: `<p>Given an array of <code>intervals</code> where <code>intervals[i] = [start<sub>i</sub>, end<sub>i</sub>]</code>, merge all overlapping intervals, and return <em>an array of the non-overlapping intervals that cover all the intervals in the input</em>.</p>`,
        exampleTestcases: '[[1,3],[2,6],[8,10],[15,18]]\n[[1,4],[4,5]]'
    },
    {
        questionId: '70',
        title: 'Climbing Stairs',
        titleSlug: 'climbing-stairs',
        difficulty: 'Easy',
        topicTags: [{ name: 'Math', slug: 'math' }, { name: 'Dynamic Programming', slug: 'dynamic-programming' }, { name: 'Memoization', slug: 'memoization' }],
        content: `<p>You are climbing a staircase. It takes <code>n</code> steps to reach the top.</p>
<p>Each time you can either climb <code>1</code> or <code>2</code> steps. In how many distinct ways can you climb to the top?</p>`,
        exampleTestcases: '2\n3'
    },
    {
        questionId: '72',
        title: 'Edit Distance',
        titleSlug: 'edit-distance',
        difficulty: 'Medium',
        topicTags: [{ name: 'String', slug: 'string' }, { name: 'Dynamic Programming', slug: 'dynamic-programming' }],
        content: `<p>Given two strings <code>word1</code> and <code>word2</code>, return <em>the minimum number of operations required to convert <code>word1</code> to <code>word2</code></em>.</p>`,
        exampleTestcases: '"horse"\n"ros"\n"intention"\n"execution"'
    },
    {
        questionId: '76',
        title: 'Minimum Window Substring',
        titleSlug: 'minimum-window-substring',
        difficulty: 'Hard',
        topicTags: [{ name: 'Hash Table', slug: 'hash-table' }, { name: 'String', slug: 'string' }, { name: 'Sliding Window', slug: 'sliding-window' }],
        content: `<p>Given two strings <code>s</code> and <code>t</code> of lengths <code>m</code> and <code>n</code> respectively, return <em>the <strong>minimum window substring</strong> of </em><code>s</code><em> such that every character in </em><code>t</code><em> (<strong>including duplicates</strong>) is included in the window</em>.</p>`,
        exampleTestcases: '"ADOBECODEBANC"\n"ABC"\n"a"\n"a"\n"a"\n"aa"'
    },
    {
        questionId: '78',
        title: 'Subsets',
        titleSlug: 'subsets',
        difficulty: 'Medium',
        topicTags: [{ name: 'Array', slug: 'array' }, { name: 'Backtracking', slug: 'backtracking' }, { name: 'Bit Manipulation', slug: 'bit-manipulation' }],
        content: `<p>Given an integer array <code>nums</code> of <strong>unique</strong> elements, return <em>all possible subsets (the power set)</em>.</p>`,
        exampleTestcases: '[1,2,3]\n[0]'
    },
    {
        questionId: '79',
        title: 'Word Search',
        titleSlug: 'word-search',
        difficulty: 'Medium',
        topicTags: [{ name: 'Array', slug: 'array' }, { name: 'Matrix', slug: 'matrix' }, { name: 'Backtracking', slug: 'backtracking' }],
        content: `<p>Given an <code>m x n</code> grid of characters <code>board</code> and a string <code>word</code>, return <code>true</code> <em>if</em> <code>word</code> <em>exists in the grid</em>.</p>`,
        exampleTestcases: '[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]]\n"ABCCED"'
    },
    {
        questionId: '98',
        title: 'Validate Binary Search Tree',
        titleSlug: 'validate-binary-search-tree',
        difficulty: 'Medium',
        topicTags: [{ name: 'Tree', slug: 'tree' }, { name: 'Depth-First Search', slug: 'depth-first-search' }, { name: 'Binary Search Tree', slug: 'binary-search-tree' }, { name: 'Binary Tree', slug: 'binary-tree' }],
        content: `<p>Given the <code>root</code> of a binary tree, <em>determine if it is a valid binary search tree (BST)</em>.</p>`,
        exampleTestcases: '[2,1,3]\n[5,1,4,null,null,3,6]'
    },
    {
        questionId: '102',
        title: 'Binary Tree Level Order Traversal',
        titleSlug: 'binary-tree-level-order-traversal',
        difficulty: 'Medium',
        topicTags: [{ name: 'Tree', slug: 'tree' }, { name: 'Breadth-First Search', slug: 'breadth-first-search' }, { name: 'Binary Tree', slug: 'binary-tree' }],
        content: `<p>Given the <code>root</code> of a binary tree, return <em>the level order traversal of its nodes' values</em>. (i.e., from left to right, level by level).</p>`,
        exampleTestcases: '[3,9,20,null,null,15,7]\n[1]\n[]'
    },
    {
        questionId: '104',
        title: 'Maximum Depth of Binary Tree',
        titleSlug: 'maximum-depth-of-binary-tree',
        difficulty: 'Easy',
        topicTags: [{ name: 'Tree', slug: 'tree' }, { name: 'Depth-First Search', slug: 'depth-first-search' }, { name: 'Breadth-First Search', slug: 'breadth-first-search' }, { name: 'Binary Tree', slug: 'binary-tree' }],
        content: `<p>Given the <code>root</code> of a binary tree, return <em>its maximum depth</em>.</p>
<p>A binary tree's <strong>maximum depth</strong>&nbsp;is the number of nodes along the longest path from the root node down to the farthest leaf node.</p>`,
        exampleTestcases: '[3,9,20,null,null,15,7]\n[1,null,2]'
    },
    {
        questionId: '121',
        title: 'Best Time to Buy and Sell Stock',
        titleSlug: 'best-time-to-buy-and-sell-stock',
        difficulty: 'Easy',
        topicTags: [{ name: 'Array', slug: 'array' }, { name: 'Dynamic Programming', slug: 'dynamic-programming' }],
        content: `<p>You are given an array <code>prices</code> where <code>prices[i]</code> is the price of a given stock on the <code>i<sup>th</sup></code> day.</p>
<p>You want to maximize your profit by choosing a <strong>single day</strong> to buy one stock and choosing a <strong>different day in the future</strong> to sell that stock.</p>
<p>Return <em>the maximum profit you can achieve from this transaction</em>. If you cannot achieve any profit, return <code>0</code>.</p>`,
        exampleTestcases: '[7,1,5,3,6,4]\n[7,6,4,3,1]'
    },
    {
        questionId: '125',
        title: 'Valid Palindrome',
        titleSlug: 'valid-palindrome',
        difficulty: 'Easy',
        topicTags: [{ name: 'Two Pointers', slug: 'two-pointers' }, { name: 'String', slug: 'string' }],
        content: `<p>A phrase is a <strong>palindrome</strong> if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.</p>
<p>Given a string <code>s</code>, return <code>true</code><em> if it is a <strong>palindrome</strong>, or </em><code>false</code><em> otherwise</em>.</p>`,
        exampleTestcases: '"A man, a plan, a canal: Panama"\n"race a car"\n" "'
    },
    {
        questionId: '133',
        title: 'Clone Graph',
        titleSlug: 'clone-graph',
        difficulty: 'Medium',
        topicTags: [{ name: 'Hash Table', slug: 'hash-table' }, { name: 'Depth-First Search', slug: 'depth-first-search' }, { name: 'Breadth-First Search', slug: 'breadth-first-search' }, { name: 'Graph', slug: 'graph' }],
        content: `<p>Given a reference of a node in a <strong>connected</strong> undirected graph, return a <strong>deep copy</strong> (clone) of the graph.</p>`,
        exampleTestcases: '[[2,4],[1,3],[2,4],[1,3]]\n[[]]\n[]'
    },
    {
        questionId: '139',
        title: 'Word Break',
        titleSlug: 'word-break',
        difficulty: 'Medium',
        topicTags: [{ name: 'Hash Table', slug: 'hash-table' }, { name: 'String', slug: 'string' }, { name: 'Dynamic Programming', slug: 'dynamic-programming' }, { name: 'Trie', slug: 'trie' }, { name: 'Memoization', slug: 'memoization' }],
        content: `<p>Given a string <code>s</code> and a dictionary of strings <code>wordDict</code>, return <code>true</code> if <code>s</code> can be segmented into a space-separated sequence of one or more dictionary words.</p>`,
        exampleTestcases: '"leetcode"\n["leet","code"]\n"applepenapple"\n["apple","pen"]'
    },
    {
        questionId: '141',
        title: 'Linked List Cycle',
        titleSlug: 'linked-list-cycle',
        difficulty: 'Easy',
        topicTags: [{ name: 'Hash Table', slug: 'hash-table' }, { name: 'Linked List', slug: 'linked-list' }, { name: 'Two Pointers', slug: 'two-pointers' }],
        content: `<p>Given <code>head</code>, the head of a linked list, determine if the linked list has a cycle in it.</p>
<p>There is a cycle in a linked list if there is some node in the list that can be reached again by continuously following the&nbsp;<code>next</code>&nbsp;pointer.</p>`,
        exampleTestcases: '[3,2,0,-4]\n1\n[1,2]\n0\n[1]\n-1'
    },
    {
        questionId: '146',
        title: 'LRU Cache',
        titleSlug: 'lru-cache',
        difficulty: 'Medium',
        topicTags: [{ name: 'Hash Table', slug: 'hash-table' }, { name: 'Linked List', slug: 'linked-list' }, { name: 'Design', slug: 'design' }, { name: 'Doubly-Linked List', slug: 'doubly-linked-list' }],
        content: `<p>Design a data structure that follows the constraints of a <strong><a href="https://en.wikipedia.org/wiki/Cache_replacement_policies#LRU" target="_blank">Least Recently Used (LRU) cache</a></strong>.</p>
<p>Implement the <code>LRUCache</code> class:</p>
<ul>
    <li><code>LRUCache(int capacity)</code> Initialize the LRU cache with positive size <code>capacity</code>.</li>
    <li><code>int get(int key)</code> Return the value of the <code>key</code> if the key exists, otherwise return <code>-1</code>.</li>
    <li><code>void put(int key, int value)</code> Update the value of the <code>key</code> if the <code>key</code> exists. Otherwise, add the <code>key-value</code> pair to the cache. If the number of keys exceeds the <code>capacity</code> from this operation, <strong>evict</strong> the least recently used key.</li>
</ul>`,
        exampleTestcases: '["LRUCache","put","put","get","put","get","put","get","get","get"]\n[[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]'
    },
    {
        questionId: '152',
        title: 'Maximum Product Subarray',
        titleSlug: 'maximum-product-subarray',
        difficulty: 'Medium',
        topicTags: [{ name: 'Array', slug: 'array' }, { name: 'Dynamic Programming', slug: 'dynamic-programming' }],
        content: `<p>Given an integer array <code>nums</code>, find a subarray that has the largest product, and return <em>the product</em>.</p>`,
        exampleTestcases: '[2,3,-2,4]\n[-2,0,-1]'
    },
    {
        questionId: '155',
        title: 'Min Stack',
        titleSlug: 'min-stack',
        difficulty: 'Medium',
        topicTags: [{ name: 'Stack', slug: 'stack' }, { name: 'Design', slug: 'design' }],
        content: `<p>Design a stack that supports push, pop, top, and retrieving the minimum element in constant time.</p>
<p>Implement the <code>MinStack</code> class:</p>
<ul>
    <li><code>MinStack()</code> initializes the stack object.</li>
    <li><code>void push(int val)</code> pushes the element <code>val</code> onto the stack.</li>
    <li><code>void pop()</code> removes the element on the top of the stack.</li>
    <li><code>int top()</code> gets the top element of the stack.</li>
    <li><code>int getMin()</code> retrieves the minimum element in the stack.</li>
</ul>`,
        exampleTestcases: '["MinStack","push","push","push","getMin","pop","top","getMin"]\n[[],[-2],[0],[-3],[],[],[],[]]'
    },
    {
        questionId: '198',
        title: 'House Robber',
        titleSlug: 'house-robber',
        difficulty: 'Medium',
        topicTags: [{ name: 'Array', slug: 'array' }, { name: 'Dynamic Programming', slug: 'dynamic-programming' }],
        content: `<p>You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed, the only constraint stopping you is that adjacent houses have security systems connected and <b>it will automatically contact the police if two adjacent houses were broken into on the same night</b>.</p>
<p>Given an integer array <code>nums</code> representing the amount of money of each house, return <em>the maximum amount of money you can rob tonight <b>without alerting the police</b></em>.</p>`,
        exampleTestcases: '[1,2,3,1]\n[2,7,9,3,1]'
    },
    {
        questionId: '200',
        title: 'Number of Islands',
        titleSlug: 'number-of-islands',
        difficulty: 'Medium',
        topicTags: [{ name: 'Array', slug: 'array' }, { name: 'Depth-First Search', slug: 'depth-first-search' }, { name: 'Breadth-First Search', slug: 'breadth-first-search' }, { name: 'Union Find', slug: 'union-find' }, { name: 'Matrix', slug: 'matrix' }],
        content: `<p>Given an <code>m x n</code> 2D binary grid <code>grid</code> which represents a map of <code>'1'</code>s (land) and <code>'0'</code>s (water), return <em>the number of islands</em>.</p>
<p>An <strong>island</strong> is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.</p>`,
        exampleTestcases: '[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]\n[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]'
    },
    {
        questionId: '206',
        title: 'Reverse Linked List',
        titleSlug: 'reverse-linked-list',
        difficulty: 'Easy',
        topicTags: [{ name: 'Linked List', slug: 'linked-list' }, { name: 'Recursion', slug: 'recursion' }],
        content: `<p>Given the <code>head</code> of a singly linked list, reverse the list, and return <em>the reversed list</em>.</p>`,
        exampleTestcases: '[1,2,3,4,5]\n[1,2]\n[]'
    },
    {
        questionId: '207',
        title: 'Course Schedule',
        titleSlug: 'course-schedule',
        difficulty: 'Medium',
        topicTags: [{ name: 'Depth-First Search', slug: 'depth-first-search' }, { name: 'Breadth-First Search', slug: 'breadth-first-search' }, { name: 'Graph', slug: 'graph' }, { name: 'Topological Sort', slug: 'topological-sort' }],
        content: `<p>There are a total of <code>numCourses</code> courses you have to take, labeled from <code>0</code> to <code>numCourses - 1</code>. You are given an array <code>prerequisites</code> where <code>prerequisites[i] = [a<sub>i</sub>, b<sub>i</sub>]</code> indicates that you <strong>must</strong> take course <code>b<sub>i</sub></code> first if you want to take course <code>a<sub>i</sub></code>.</p>
<p>Return <code>true</code> if you can finish all courses. Otherwise, return <code>false</code>.</p>`,
        exampleTestcases: '2\n[[1,0]]\n2\n[[1,0],[0,1]]'
    },
    {
        questionId: '208',
        title: 'Implement Trie (Prefix Tree)',
        titleSlug: 'implement-trie-prefix-tree',
        difficulty: 'Medium',
        topicTags: [{ name: 'Hash Table', slug: 'hash-table' }, { name: 'String', slug: 'string' }, { name: 'Design', slug: 'design' }, { name: 'Trie', slug: 'trie' }],
        content: `<p>A <strong>trie</strong> (pronounced as "try") or <strong>prefix tree</strong> is a tree data structure used to efficiently store and retrieve keys in a dataset of strings.</p>
<p>Implement the <code>Trie</code> class with <code>insert</code>, <code>search</code>, and <code>startsWith</code> methods.</p>`,
        exampleTestcases: '["Trie","insert","search","search","startsWith","insert","search"]\n[[],["apple"],["apple"],["app"],["app"],["app"],["app"]]'
    },
    {
        questionId: '217',
        title: 'Contains Duplicate',
        titleSlug: 'contains-duplicate',
        difficulty: 'Easy',
        topicTags: [{ name: 'Array', slug: 'array' }, { name: 'Hash Table', slug: 'hash-table' }, { name: 'Sorting', slug: 'sorting' }],
        content: `<p>Given an integer array <code>nums</code>, return <code>true</code> if any value appears <strong>at least twice</strong> in the array, and return <code>false</code> if every element is distinct.</p>`,
        exampleTestcases: '[1,2,3,1]\n[1,2,3,4]\n[1,1,1,3,3,4,3,2,4,2]'
    },
    {
        questionId: '226',
        title: 'Invert Binary Tree',
        titleSlug: 'invert-binary-tree',
        difficulty: 'Easy',
        topicTags: [{ name: 'Tree', slug: 'tree' }, { name: 'Depth-First Search', slug: 'depth-first-search' }, { name: 'Breadth-First Search', slug: 'breadth-first-search' }, { name: 'Binary Tree', slug: 'binary-tree' }],
        content: `<p>Given the <code>root</code> of a binary tree, invert the tree, and return <em>its root</em>.</p>`,
        exampleTestcases: '[4,2,7,1,3,6,9]\n[2,1,3]\n[]'
    },
    {
        questionId: '230',
        title: 'Kth Smallest Element in a BST',
        titleSlug: 'kth-smallest-element-in-a-bst',
        difficulty: 'Medium',
        topicTags: [{ name: 'Tree', slug: 'tree' }, { name: 'Depth-First Search', slug: 'depth-first-search' }, { name: 'Binary Search Tree', slug: 'binary-search-tree' }, { name: 'Binary Tree', slug: 'binary-tree' }],
        content: `<p>Given the <code>root</code> of a binary search tree, and an integer <code>k</code>, return <em>the</em> <code>k<sup>th</sup></code> <em>smallest value (<strong>1-indexed</strong>) of all the values of the nodes in the tree</em>.</p>`,
        exampleTestcases: '[3,1,4,null,2]\n1\n[5,3,6,2,4,null,null,1]\n3'
    },
    {
        questionId: '238',
        title: 'Product of Array Except Self',
        titleSlug: 'product-of-array-except-self',
        difficulty: 'Medium',
        topicTags: [{ name: 'Array', slug: 'array' }, { name: 'Prefix Sum', slug: 'prefix-sum' }],
        content: `<p>Given an integer array <code>nums</code>, return <em>an array</em> <code>answer</code> <em>such that</em> <code>answer[i]</code> <em>is equal to the product of all the elements of</em> <code>nums</code> <em>except</em> <code>nums[i]</code>.</p>
<p>You must write an algorithm that runs in&nbsp;<code>O(n)</code>&nbsp;time and without using the division operation.</p>`,
        exampleTestcases: '[1,2,3,4]\n[-1,1,0,-3,3]'
    },
    {
        questionId: '242',
        title: 'Valid Anagram',
        titleSlug: 'valid-anagram',
        difficulty: 'Easy',
        topicTags: [{ name: 'Hash Table', slug: 'hash-table' }, { name: 'String', slug: 'string' }, { name: 'Sorting', slug: 'sorting' }],
        content: `<p>Given two strings <code>s</code> and <code>t</code>, return <code>true</code> if <code>t</code> is an anagram of <code>s</code>, and <code>false</code> otherwise.</p>`,
        exampleTestcases: '"anagram"\n"nagaram"\n"rat"\n"car"'
    },
    {
        questionId: '300',
        title: 'Longest Increasing Subsequence',
        titleSlug: 'longest-increasing-subsequence',
        difficulty: 'Medium',
        topicTags: [{ name: 'Array', slug: 'array' }, { name: 'Binary Search', slug: 'binary-search' }, { name: 'Dynamic Programming', slug: 'dynamic-programming' }],
        content: `<p>Given an integer array <code>nums</code>, return <em>the length of the longest <strong>strictly increasing</strong> </em><span data-keyword="subsequence-array"><em>subsequence</em></span>.</p>`,
        exampleTestcases: '[10,9,2,5,3,7,101,18]\n[0,1,0,3,2,3]\n[7,7,7,7,7,7,7]'
    },
    {
        questionId: '322',
        title: 'Coin Change',
        titleSlug: 'coin-change',
        difficulty: 'Medium',
        topicTags: [{ name: 'Array', slug: 'array' }, { name: 'Dynamic Programming', slug: 'dynamic-programming' }, { name: 'Breadth-First Search', slug: 'breadth-first-search' }],
        content: `<p>You are given an integer array <code>coins</code> representing coins of different denominations and an integer <code>amount</code> representing a total amount of money.</p>
<p>Return <em>the fewest number of coins that you need to make up that amount</em>. If that amount of money cannot be made up by any combination of the coins, return <code>-1</code>.</p>`,
        exampleTestcases: '[1,2,5]\n11\n[2]\n3\n[1]\n0'
    },
    {
        questionId: '347',
        title: 'Top K Frequent Elements',
        titleSlug: 'top-k-frequent-elements',
        difficulty: 'Medium',
        topicTags: [{ name: 'Array', slug: 'array' }, { name: 'Hash Table', slug: 'hash-table' }, { name: 'Divide and Conquer', slug: 'divide-and-conquer' }, { name: 'Sorting', slug: 'sorting' }, { name: 'Heap (Priority Queue)', slug: 'heap-priority-queue' }, { name: 'Bucket Sort', slug: 'bucket-sort' }, { name: 'Counting', slug: 'counting' }, { name: 'Quickselect', slug: 'quickselect' }],
        content: `<p>Given an integer array <code>nums</code> and an integer <code>k</code>, return <em>the</em> <code>k</code> <em>most frequent elements</em>. You may return the answer in <strong>any order</strong>.</p>`,
        exampleTestcases: '[1,1,1,2,2,3]\n2\n[1]\n1'
    },
    {
        questionId: '417',
        title: 'Pacific Atlantic Water Flow',
        titleSlug: 'pacific-atlantic-water-flow',
        difficulty: 'Medium',
        topicTags: [{ name: 'Array', slug: 'array' }, { name: 'Depth-First Search', slug: 'depth-first-search' }, { name: 'Breadth-First Search', slug: 'breadth-first-search' }, { name: 'Matrix', slug: 'matrix' }],
        content: `<p>There is an <code>m x n</code> rectangular island that borders both the <strong>Pacific Ocean</strong> and <strong>Atlantic Ocean</strong>. Return <em>a 2D list of grid coordinates </em><code>[r, c]</code><em> from which water can flow to both oceans</em>.</p>`,
        exampleTestcases: '[[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]'
    },
    {
        questionId: '424',
        title: 'Longest Repeating Character Replacement',
        titleSlug: 'longest-repeating-character-replacement',
        difficulty: 'Medium',
        topicTags: [{ name: 'Hash Table', slug: 'hash-table' }, { name: 'String', slug: 'string' }, { name: 'Sliding Window', slug: 'sliding-window' }],
        content: `<p>You are given a string <code>s</code> and an integer <code>k</code>. You can choose any character of the string and change it to any other uppercase English character. You can perform this operation at most <code>k</code> times.</p>
<p>Return <em>the length of the longest substring containing the same letter you can get after performing the above operations</em>.</p>`,
        exampleTestcases: '"ABAB"\n2\n"AABABBA"\n1'
    },
    {
        questionId: '435',
        title: 'Non-overlapping Intervals',
        titleSlug: 'non-overlapping-intervals',
        difficulty: 'Medium',
        topicTags: [{ name: 'Array', slug: 'array' }, { name: 'Dynamic Programming', slug: 'dynamic-programming' }, { name: 'Greedy', slug: 'greedy' }, { name: 'Sorting', slug: 'sorting' }],
        content: `<p>Given an array of intervals <code>intervals</code> where <code>intervals[i] = [start<sub>i</sub>, end<sub>i</sub>]</code>, return <em>the minimum number of intervals you need to remove to make the rest of the intervals non-overlapping</em>.</p>`,
        exampleTestcases: '[[1,2],[2,3],[3,4],[1,3]]\n[[1,2],[1,2],[1,2]]'
    },
    {
        questionId: '572',
        title: 'Subtree of Another Tree',
        titleSlug: 'subtree-of-another-tree',
        difficulty: 'Easy',
        topicTags: [{ name: 'Tree', slug: 'tree' }, { name: 'Depth-First Search', slug: 'depth-first-search' }, { name: 'String Matching', slug: 'string-matching' }, { name: 'Binary Tree', slug: 'binary-tree' }, { name: 'Hash Function', slug: 'hash-function' }],
        content: `<p>Given the roots of two binary trees <code>root</code> and <code>subRoot</code>, return <code>true</code> if there is a subtree of <code>root</code> with the same structure and node values of <code>subRoot</code> and <code>false</code> otherwise.</p>`,
        exampleTestcases: '[3,4,5,1,2]\n[4,1,2]\n[3,4,5,1,2,null,null,null,null,0]\n[4,1,2]'
    },
    {
        questionId: '647',
        title: 'Palindromic Substrings',
        titleSlug: 'palindromic-substrings',
        difficulty: 'Medium',
        topicTags: [{ name: 'Two Pointers', slug: 'two-pointers' }, { name: 'String', slug: 'string' }, { name: 'Dynamic Programming', slug: 'dynamic-programming' }],
        content: `<p>Given a string <code>s</code>, return <em>the number of <strong>palindromic substrings</strong> in it</em>.</p>`,
        exampleTestcases: '"abc"\n"aaa"'
    },
    {
        questionId: '704',
        title: 'Binary Search',
        titleSlug: 'binary-search',
        difficulty: 'Easy',
        topicTags: [{ name: 'Array', slug: 'array' }, { name: 'Binary Search', slug: 'binary-search' }],
        content: `<p>Given an array of integers <code>nums</code> which is sorted in ascending order, and an integer <code>target</code>, write a function to search <code>target</code> in <code>nums</code>. If <code>target</code> exists, then return its index. Otherwise, return <code>-1</code>.</p>`,
        exampleTestcases: '[-1,0,3,5,9,12]\n9\n[-1,0,3,5,9,12]\n2'
    },
    {
        questionId: '739',
        title: 'Daily Temperatures',
        titleSlug: 'daily-temperatures',
        difficulty: 'Medium',
        topicTags: [{ name: 'Array', slug: 'array' }, { name: 'Stack', slug: 'stack' }, { name: 'Monotonic Stack', slug: 'monotonic-stack' }],
        content: `<p>Given an array of integers <code>temperatures</code> represents the daily temperatures, return <em>an array</em> <code>answer</code> <em>such that</em> <code>answer[i]</code> <em>is the number of days you have to wait after the</em> <code>i<sup>th</sup></code> <em>day to get a warmer temperature</em>. If there is no future day for which this is possible, keep <code>answer[i] == 0</code> instead.</p>`,
        exampleTestcases: '[73,74,75,71,69,72,76,73]\n[30,40,50,60]\n[30,60,90]'
    }
];
