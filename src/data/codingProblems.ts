/**
 * codingProblems.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * 21 original coding problems — 3 per assessment domain.
 * All problems are original. No content is copied from LeetCode, HackerRank,
 * Codeforces or any other platform.
 *
 * All problems use standard I/O (stdin/stdout) for language-agnostic test case
 * evaluation via the Piston API.
 *
 * Starter code is provided for: Python 3, JavaScript (Node), Java, C++
 */

import type { CodingProblem } from '../types/domain';

export const CODING_PROBLEMS: CodingProblem[] = [

    // ══════════════════════════════════════════════════════════════════════════
    // DOMAIN: dsa
    // ══════════════════════════════════════════════════════════════════════════

    {
        id: 'cp-dsa-001',
        domain: 'dsa',
        topic: 'Arrays & Hashing',
        difficulty: 'easy',
        title: 'Pair Sum Finder',
        description: `Given an array of integers and a target value, find **all unique pairs** of indices (i, j) where i < j such that \`arr[i] + arr[j] == target\`.

Print each pair on a separate line as \`i j\` (space separated, in ascending order of i, then j).
If no pairs exist, print \`NONE\`.

**Input format:**
- Line 1: n (size of array)
- Line 2: n space-separated integers
- Line 3: target integer

**Output format:**
- One pair per line as "i j", or "NONE"`,
        constraints: [
            '1 ≤ n ≤ 10^4',
            '-10^9 ≤ arr[i] ≤ 10^9',
            '-2 × 10^9 ≤ target ≤ 2 × 10^9',
        ],
        examples: [
            {
                input: '5\n1 3 5 7 9\n8',
                output: '0 3\n1 2',
                explanation: 'arr[0]+arr[3]=1+7=8, arr[1]+arr[2]=3+5=8',
            },
            {
                input: '3\n1 2 3\n10',
                output: 'NONE',
            },
        ],
        starterCode: {
            python: `import sys

def solve():
    data = sys.stdin.read().split()
    n = int(data[0])
    arr = list(map(int, data[1:n+1]))
    target = int(data[n+1])
    
    seen = {}
    pairs = []
    for i, val in enumerate(arr):
        complement = target - val
        if complement in seen:
            pairs.append((seen[complement], i))
        seen[val] = i
    
    if not pairs:
        print("NONE")
    else:
        for a, b in pairs:
            print(a, b)

solve()
`,
            javascript: `const lines = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\\n');
const n = parseInt(lines[0]);
const arr = lines[1].split(' ').map(Number);
const target = parseInt(lines[2]);

const seen = new Map();
const pairs = [];

for (let i = 0; i < n; i++) {
    const comp = target - arr[i];
    if (seen.has(comp)) {
        pairs.push([seen.get(comp), i]);
    }
    seen.set(arr[i], i);
}

if (pairs.length === 0) {
    console.log('NONE');
} else {
    pairs.forEach(([a, b]) => console.log(a + ' ' + b));
}
`,
            java: `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws Exception {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
        long target = sc.nextLong();
        
        Map<Long, Integer> seen = new HashMap<>();
        List<int[]> pairs = new ArrayList<>();
        
        for (int i = 0; i < n; i++) {
            long comp = target - arr[i];
            if (seen.containsKey(comp)) {
                pairs.add(new int[]{seen.get(comp), i});
            }
            seen.put((long)arr[i], i);
        }
        
        if (pairs.isEmpty()) {
            System.out.println("NONE");
        } else {
            for (int[] p : pairs) System.out.println(p[0] + " " + p[1]);
        }
    }
}
`,
            cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n; cin >> n;
    vector<long long> arr(n);
    for (auto& x : arr) cin >> x;
    long long target; cin >> target;
    
    unordered_map<long long, int> seen;
    vector<pair<int,int>> pairs;
    
    for (int i = 0; i < n; i++) {
        long long comp = target - arr[i];
        if (seen.count(comp)) {
            pairs.push_back({seen[comp], i});
        }
        seen[arr[i]] = i;
    }
    
    if (pairs.empty()) {
        cout << "NONE\\n";
    } else {
        for (auto [a, b] : pairs) cout << a << " " << b << "\\n";
    }
    return 0;
}
`,
        },
        testCases: [
            { id: 'tc-dsa-001-1', stdin: '5\n1 3 5 7 9\n8', expectedOutput: '0 3\n1 2', isHidden: false, description: 'Basic case, two pairs' },
            { id: 'tc-dsa-001-2', stdin: '3\n1 2 3\n10', expectedOutput: 'NONE', isHidden: false, description: 'No pairs' },
            { id: 'tc-dsa-001-3', stdin: '1\n5\n10', expectedOutput: 'NONE', isHidden: true, description: 'Single element' },
            { id: 'tc-dsa-001-4', stdin: '4\n-1 -2 3 4\n2', expectedOutput: '0 3\n1 2', isHidden: true, description: 'Negative numbers' },
            { id: 'tc-dsa-001-5', stdin: '6\n0 0 1 2 3 4\n0', expectedOutput: '0 1', isHidden: true, description: 'Duplicate zeros' },
        ],
        roles: ['software-engineer', 'ai-engineer', 'backend-engineer', 'full-stack-engineer'],
        timeSeconds: 1200,
    },

    {
        id: 'cp-dsa-002',
        domain: 'dsa',
        topic: 'Linked Lists',
        difficulty: 'medium',
        title: 'Run-Length Encoder',
        description: `Implement **run-length encoding** on a string of characters.

For each consecutive group of the same character, output the character followed by its count.
If a character appears only once consecutively, output just the character (no count).

**Input:** A single line containing a non-empty string (lowercase letters only, length ≤ 10^5).
**Output:** The run-length encoded string on a single line.`,
        constraints: [
            '1 ≤ |s| ≤ 10^5',
            's contains only lowercase English letters',
        ],
        examples: [
            { input: 'aaabbc', output: 'a3b2c', explanation: 'aaa→a3, bb→b2, c→c' },
            { input: 'abcd', output: 'abcd', explanation: 'Each char appears once, no number appended' },
            { input: 'aaaaaa', output: 'a6' },
        ],
        starterCode: {
            python: `s = input().strip()
result = []
i = 0
while i < len(s):
    char = s[i]
    count = 1
    while i + count < len(s) and s[i + count] == char:
        count += 1
    result.append(char if count == 1 else char + str(count))
    i += count
print(''.join(result))
`,
            javascript: `const s = require('fs').readFileSync('/dev/stdin','utf8').trim();
let result = '';
let i = 0;
while (i < s.length) {
    let c = s[i], count = 1;
    while (i + count < s.length && s[i + count] === c) count++;
    result += count === 1 ? c : c + count;
    i += count;
}
console.log(result);
`,
            java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine().trim();
        StringBuilder sb = new StringBuilder();
        int i = 0;
        while (i < s.length()) {
            char c = s.charAt(i);
            int count = 1;
            while (i + count < s.length() && s.charAt(i + count) == c) count++;
            sb.append(c);
            if (count > 1) sb.append(count);
            i += count;
        }
        System.out.println(sb);
    }
}
`,
            cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; cin >> s;
    string res;
    int i = 0;
    while (i < (int)s.size()) {
        char c = s[i]; int cnt = 1;
        while (i + cnt < (int)s.size() && s[i+cnt] == c) cnt++;
        res += c;
        if (cnt > 1) res += to_string(cnt);
        i += cnt;
    }
    cout << res << "\\n";
}
`,
        },
        testCases: [
            { id: 'tc-dsa-002-1', stdin: 'aaabbc', expectedOutput: 'a3b2c', isHidden: false },
            { id: 'tc-dsa-002-2', stdin: 'abcd', expectedOutput: 'abcd', isHidden: false },
            { id: 'tc-dsa-002-3', stdin: 'aaaaaa', expectedOutput: 'a6', isHidden: false },
            { id: 'tc-dsa-002-4', stdin: 'a', expectedOutput: 'a', isHidden: true },
            { id: 'tc-dsa-002-5', stdin: 'aabbccdd', expectedOutput: 'a2b2c2d2', isHidden: true },
            { id: 'tc-dsa-002-6', stdin: 'zzzzaaaabbb', expectedOutput: 'z4a4b3', isHidden: true },
        ],
        roles: ['software-engineer', 'backend-engineer'],
        timeSeconds: 900,
    },

    {
        id: 'cp-dsa-003',
        domain: 'dsa',
        topic: 'Dynamic Programming',
        difficulty: 'hard',
        title: 'Staircase Climber',
        description: `You are climbing a staircase with **n** steps. Each move you can climb either **1, 2, or 3** steps.

Count the number of **distinct ways** to reach the top.
Since the answer can be very large, print it **modulo 10^9 + 7**.

**Input:** A single integer n.
**Output:** A single integer — the number of ways modulo 10^9+7.`,
        constraints: ['1 ≤ n ≤ 10^6'],
        examples: [
            { input: '3', output: '4', explanation: '(1,1,1), (1,2), (2,1), (3)' },
            { input: '4', output: '7', explanation: '(1,1,1,1),(1,1,2),(1,2,1),(2,1,1),(2,2),(1,3),(3,1)' },
            { input: '1', output: '1' },
        ],
        starterCode: {
            python: `import sys
input = sys.stdin.readline

MOD = 10**9 + 7
n = int(input())

if n == 1:
    print(1)
elif n == 2:
    print(2)
elif n == 3:
    print(4)
else:
    a, b, c = 1, 2, 4
    for _ in range(4, n + 1):
        a, b, c = b, c, (a + b + c) % MOD
    print(c)
`,
            javascript: `const n = parseInt(require('fs').readFileSync('/dev/stdin','utf8').trim());
const MOD = 1000000007n;
if (n === 1) { console.log(1); process.exit(); }
if (n === 2) { console.log(2); process.exit(); }
if (n === 3) { console.log(4); process.exit(); }
let a = 1n, b = 2n, c = 4n;
for (let i = 4; i <= n; i++) { [a, b, c] = [b, c, (a + b + c) % MOD]; }
console.log(c.toString());
`,
            java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long n = sc.nextLong(), MOD = 1_000_000_007L;
        if (n==1){System.out.println(1);return;}
        if (n==2){System.out.println(2);return;}
        if (n==3){System.out.println(4);return;}
        long a=1,b=2,c=4;
        for(long i=4;i<=n;i++){long t=(a+b+c)%MOD;a=b;b=c;c=t;}
        System.out.println(c);
    }
}
`,
            cpp: `#include <bits/stdc++.h>
using namespace std;
const long long MOD = 1e9 + 7;
int main(){
    long long n; cin >> n;
    if(n==1){cout<<1;return 0;}
    if(n==2){cout<<2;return 0;}
    if(n==3){cout<<4;return 0;}
    long long a=1,b=2,c=4;
    for(long long i=4;i<=n;i++){long long t=(a+b+c)%MOD;a=b;b=c;c=t;}
    cout << c << "\\n";
}
`,
        },
        testCases: [
            { id: 'tc-dsa-003-1', stdin: '3', expectedOutput: '4', isHidden: false },
            { id: 'tc-dsa-003-2', stdin: '4', expectedOutput: '7', isHidden: false },
            { id: 'tc-dsa-003-3', stdin: '1', expectedOutput: '1', isHidden: false },
            { id: 'tc-dsa-003-4', stdin: '10', expectedOutput: '274', isHidden: true },
            { id: 'tc-dsa-003-5', stdin: '1000000', expectedOutput: '746988984', isHidden: true },
        ],
        roles: ['software-engineer', 'ai-engineer'],
        timeSeconds: 1800,
    },

    // ══════════════════════════════════════════════════════════════════════════
    // DOMAIN: development
    // ══════════════════════════════════════════════════════════════════════════

    {
        id: 'cp-dev-001',
        domain: 'development',
        topic: 'REST APIs',
        difficulty: 'easy',
        title: 'HTTP Status Classifier',
        description: `Given a list of HTTP status codes, classify each one and print its category.

Categories:
- \`1xx\` → **Informational**
- \`2xx\` → **Success**
- \`3xx\` → **Redirection**
- \`4xx\` → **Client Error**
- \`5xx\` → **Server Error**
- Anything else → **Unknown**

**Input:**
- Line 1: n (number of codes)
- Next n lines: one integer status code per line

**Output:** n lines, one category per code.`,
        constraints: ['1 ≤ n ≤ 1000', '0 ≤ code ≤ 9999'],
        examples: [
            { input: '4\n200\n404\n301\n500', output: 'Success\nClient Error\nRedirection\nServer Error' },
            { input: '2\n100\n999', output: 'Informational\nUnknown' },
        ],
        starterCode: {
            python: `n = int(input())
cats = {1:'Informational',2:'Success',3:'Redirection',4:'Client Error',5:'Server Error'}
for _ in range(n):
    code = int(input())
    print(cats.get(code // 100, 'Unknown'))
`,
            javascript: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const n = parseInt(lines[0]);
const cats = {1:'Informational',2:'Success',3:'Redirection',4:'Client Error',5:'Server Error'};
for (let i = 1; i <= n; i++) {
    const code = parseInt(lines[i]);
    console.log(cats[Math.floor(code/100)] || 'Unknown');
}
`,
            java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        String[] cats = {"Unknown","Informational","Success","Redirection","Client Error","Server Error"};
        while (n-- > 0) {
            int code = sc.nextInt();
            int h = code / 100;
            System.out.println(h >= 1 && h <= 5 ? cats[h] : "Unknown");
        }
    }
}
`,
            cpp: `#include <bits/stdc++.h>
using namespace std;
int main(){
    int n; cin>>n;
    map<int,string> m={{1,"Informational"},{2,"Success"},{3,"Redirection"},{4,"Client Error"},{5,"Server Error"}};
    while(n--){int c;cin>>c;auto it=m.find(c/100);cout<<(it!=m.end()?it->second:"Unknown")<<"\\n";}
}
`,
        },
        testCases: [
            { id: 'tc-dev-001-1', stdin: '4\n200\n404\n301\n500', expectedOutput: 'Success\nClient Error\nRedirection\nServer Error', isHidden: false },
            { id: 'tc-dev-001-2', stdin: '2\n100\n999', expectedOutput: 'Informational\nUnknown', isHidden: false },
            { id: 'tc-dev-001-3', stdin: '1\n0', expectedOutput: 'Unknown', isHidden: true },
            { id: 'tc-dev-001-4', stdin: '3\n201\n503\n302', expectedOutput: 'Success\nServer Error\nRedirection', isHidden: true },
        ],
        roles: ['software-engineer', 'backend-engineer', 'full-stack-engineer'],
        timeSeconds: 600,
    },

    {
        id: 'cp-dev-002',
        domain: 'development',
        topic: 'Design Patterns',
        difficulty: 'medium',
        title: 'Word Frequency Counter',
        description: `Given a block of text, count the frequency of each unique word (case-insensitive, ignore punctuation).

Print the results sorted by **frequency descending**. If frequencies are equal, sort alphabetically.
Format: \`word: count\`

**Input:** A paragraph of text (may span multiple lines, terminated by EOF).
**Output:** Sorted word-frequency pairs, one per line.`,
        constraints: ['Total characters ≤ 10^5', 'Words contain only letters after stripping punctuation'],
        examples: [
            {
                input: 'Hello world! Hello again.\nThe world is great.',
                output: 'hello: 2\nworld: 2\nagain: 1\ngreat: 1\nis: 1\nthe: 1',
                explanation: 'hello and world tied at 2, sorted alpha. Rest appear once.',
            },
        ],
        starterCode: {
            python: `import sys, re
from collections import Counter

text = sys.stdin.read().lower()
words = re.findall(r"[a-z]+", text)
freq = Counter(words)
for word, count in sorted(freq.items(), key=lambda x: (-x[1], x[0])):
    print(f"{word}: {count}")
`,
            javascript: `const text = require('fs').readFileSync('/dev/stdin','utf8').toLowerCase();
const words = text.match(/[a-z]+/g) || [];
const freq = {};
words.forEach(w => freq[w] = (freq[w]||0)+1);
Object.entries(freq)
  .sort(([a,ca],[b,cb]) => cb-ca || a.localeCompare(b))
  .forEach(([w,c]) => console.log(\`\${w}: \${c}\`));
`,
            java: `import java.util.*;import java.io.*;
public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        Map<String,Integer> freq = new TreeMap<>();
        String line;
        while((line=br.readLine())!=null){
            for(String w:line.toLowerCase().split("[^a-z]+")){
                if(!w.isEmpty()) freq.merge(w,1,Integer::sum);
            }
        }
        freq.entrySet().stream()
          .sorted(Map.Entry.<String,Integer>comparingByValue(Comparator.reverseOrder())
          .thenComparing(Map.Entry.comparingByKey()))
          .forEach(e->System.out.println(e.getKey()+": "+e.getValue()));
    }
}
`,
            cpp: `#include <bits/stdc++.h>
using namespace std;
int main(){
    map<string,int> freq;
    string line;
    while(getline(cin,line)){
        transform(line.begin(),line.end(),line.begin(),::tolower);
        string w;
        for(char c:line){if(isalpha(c))w+=c;else if(!w.empty()){freq[w]++;w="";}}
        if(!w.empty())freq[w]++;
    }
    vector<pair<int,string>> v;
    for(auto&[w,c]:freq)v.push_back({c,w});
    sort(v.begin(),v.end(),[](auto&a,auto&b){return a.first!=b.first?a.first>b.first:a.second<b.second;});
    for(auto&[c,w]:v)cout<<w<<": "<<c<<"\\n";
}
`,
        },
        testCases: [
            { id: 'tc-dev-002-1', stdin: 'Hello world! Hello again.\nThe world is great.', expectedOutput: 'hello: 2\nworld: 2\nagain: 1\ngreat: 1\nis: 1\nthe: 1', isHidden: false },
            { id: 'tc-dev-002-2', stdin: 'the the the', expectedOutput: 'the: 3', isHidden: false },
            { id: 'tc-dev-002-3', stdin: 'A B C', expectedOutput: 'a: 1\nb: 1\nc: 1', isHidden: true },
            { id: 'tc-dev-002-4', stdin: 'Go go GO!', expectedOutput: 'go: 3', isHidden: true },
        ],
        roles: ['software-engineer', 'full-stack-engineer'],
        timeSeconds: 1200,
    },

    {
        id: 'cp-dev-003',
        domain: 'development',
        topic: 'Performance',
        difficulty: 'hard',
        title: 'LRU Cache Simulator',
        description: `Implement an **LRU (Least Recently Used) Cache** with capacity **k**.

Process a sequence of \`GET key\` and \`SET key value\` operations:
- \`GET key\`: Return the value if it exists in cache, else print \`-1\`. Marks key as most recently used.
- \`SET key value\`: Insert key with value. If cache is full, evict the **least recently used** item first.

**Input:**
- Line 1: k (cache capacity), q (number of operations)
- Next q lines: operation (\`GET key\` or \`SET key value\`)

**Output:** One line per GET operation with the value or -1.`,
        constraints: ['1 ≤ k ≤ 1000', '1 ≤ q ≤ 10^4', '1 ≤ key ≤ 10^6', '1 ≤ value ≤ 10^9'],
        examples: [
            {
                input: '2 5\nSET 1 10\nSET 2 20\nGET 1\nSET 3 30\nGET 2',
                output: '10\n-1',
                explanation: 'GET 1→10 (hits). SET 3 evicts key 2 (LRU). GET 2 misses.',
            },
        ],
        starterCode: {
            python: `from collections import OrderedDict
import sys
input = sys.stdin.readline

k, q = map(int, input().split())
cache = OrderedDict()

for _ in range(q):
    line = input().split()
    op = line[0]
    if op == 'GET':
        key = int(line[1])
        if key in cache:
            cache.move_to_end(key)
            print(cache[key])
        else:
            print(-1)
    else:  # SET
        key, val = int(line[1]), int(line[2])
        if key in cache:
            cache.move_to_end(key)
        cache[key] = val
        if len(cache) > k:
            cache.popitem(last=False)
`,
            javascript: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const [k, q] = lines[0].split(' ').map(Number);
const cache = new Map();
const out = [];
for (let i = 1; i <= q; i++) {
    const parts = lines[i].split(' ');
    if (parts[0] === 'GET') {
        const key = parts[1];
        if (cache.has(key)) {
            const val = cache.get(key);
            cache.delete(key); cache.set(key, val);
            out.push(val);
        } else out.push(-1);
    } else {
        const [,key,val] = parts;
        if (cache.has(key)) cache.delete(key);
        cache.set(key, val);
        if (cache.size > k) cache.delete(cache.keys().next().value);
    }
}
console.log(out.join('\\n'));
`,
            java: `import java.util.*;import java.io.*;
public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        int k=Integer.parseInt(st.nextToken()),q=Integer.parseInt(st.nextToken());
        LinkedHashMap<Integer,Integer> cache=new LinkedHashMap<>(k,0.75f,true){
            protected boolean removeEldestEntry(Map.Entry<Integer,Integer> e){return size()>k;}
        };
        StringBuilder sb=new StringBuilder();
        while(q-->0){
            st=new StringTokenizer(br.readLine());
            String op=st.nextToken();
            int key=Integer.parseInt(st.nextToken());
            if(op.equals("GET")){
                sb.append(cache.getOrDefault(key,-1)).append('\\n');
            } else {
                cache.put(key,Integer.parseInt(st.nextToken()));
            }
        }
        System.out.print(sb);
    }
}
`,
            cpp: `#include <bits/stdc++.h>
using namespace std;
struct LRU {
    int cap;
    list<pair<int,int>> lst;
    unordered_map<int,list<pair<int,int>>::iterator> mp;
    LRU(int k):cap(k){}
    int get(int key){
        if(!mp.count(key))return -1;
        lst.splice(lst.begin(),lst,mp[key]);
        return mp[key]->second;
    }
    void set(int key,int val){
        if(mp.count(key)){lst.splice(lst.begin(),lst,mp[key]);mp[key]->second=val;return;}
        if((int)lst.size()==cap){mp.erase(lst.back().first);lst.pop_back();}
        lst.push_front({key,val});mp[key]=lst.begin();
    }
};
int main(){
    int k,q;cin>>k>>q;
    LRU cache(k);
    while(q--){
        string op;cin>>op;
        if(op=="GET"){int key;cin>>key;cout<<cache.get(key)<<"\\n";}
        else{int key,val;cin>>key>>val;cache.set(key,val);}
    }
}
`,
        },
        testCases: [
            { id: 'tc-dev-003-1', stdin: '2 5\nSET 1 10\nSET 2 20\nGET 1\nSET 3 30\nGET 2', expectedOutput: '10\n-1', isHidden: false },
            { id: 'tc-dev-003-2', stdin: '1 3\nSET 5 99\nGET 5\nGET 5', expectedOutput: '99\n99', isHidden: false },
            { id: 'tc-dev-003-3', stdin: '2 6\nSET 1 1\nSET 2 2\nGET 1\nSET 3 3\nGET 2\nGET 3', expectedOutput: '1\n-1\n3', isHidden: true },
            { id: 'tc-dev-003-4', stdin: '3 4\nGET 1\nSET 1 100\nSET 2 200\nGET 1', expectedOutput: '-1\n100', isHidden: true },
        ],
        roles: ['software-engineer', 'backend-engineer'],
        timeSeconds: 2400,
    },

    // ══════════════════════════════════════════════════════════════════════════
    // DOMAIN: aptitude
    // ══════════════════════════════════════════════════════════════════════════

    {
        id: 'cp-apt-001',
        domain: 'aptitude',
        topic: 'Quantitative Ability',
        difficulty: 'easy',
        title: 'Prime Number Checker',
        description: `Given q queries, each with a number n, determine if n is **prime** or **not prime**.

Print \`PRIME\` or \`NOT PRIME\` for each query.

**Input:**
- Line 1: q (number of queries)
- Next q lines: one integer n per line

**Output:** q lines, each \`PRIME\` or \`NOT PRIME\`.`,
        constraints: ['1 ≤ q ≤ 1000', '1 ≤ n ≤ 10^6'],
        examples: [
            { input: '4\n2\n9\n13\n1', output: 'PRIME\nNOT PRIME\nPRIME\nNOT PRIME' },
        ],
        starterCode: {
            python: `def is_prime(n):
    if n < 2: return False
    if n < 4: return True
    if n % 2 == 0 or n % 3 == 0: return False
    i = 5
    while i * i <= n:
        if n % i == 0 or n % (i+2) == 0: return False
        i += 6
    return True

q = int(input())
for _ in range(q):
    n = int(input())
    print("PRIME" if is_prime(n) else "NOT PRIME")
`,
            javascript: `function isPrime(n) {
    if (n < 2) return false;
    if (n < 4) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    for (let i = 5; i * i <= n; i += 6)
        if (n % i === 0 || n % (i+2) === 0) return false;
    return true;
}
const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const q = parseInt(lines[0]);
for (let i = 1; i <= q; i++)
    console.log(isPrime(parseInt(lines[i])) ? 'PRIME' : 'NOT PRIME');
`,
            java: `import java.util.*;
public class Main {
    static boolean isPrime(int n){
        if(n<2)return false;if(n<4)return true;
        if(n%2==0||n%3==0)return false;
        for(int i=5;(long)i*i<=n;i+=6)if(n%i==0||n%(i+2)==0)return false;
        return true;
    }
    public static void main(String[] args){
        Scanner sc=new Scanner(System.in);int q=sc.nextInt();
        while(q-->0)System.out.println(isPrime(sc.nextInt())?"PRIME":"NOT PRIME");
    }
}
`,
            cpp: `#include <bits/stdc++.h>
using namespace std;
bool isPrime(int n){
    if(n<2)return false;if(n<4)return true;
    if(n%2==0||n%3==0)return false;
    for(int i=5;(long long)i*i<=n;i+=6)if(n%i==0||n%(i+2)==0)return false;
    return true;
}
int main(){int q;cin>>q;while(q--){int n;cin>>n;cout<<(isPrime(n)?"PRIME":"NOT PRIME")<<"\\n";}}
`,
        },
        testCases: [
            { id: 'tc-apt-001-1', stdin: '4\n2\n9\n13\n1', expectedOutput: 'PRIME\nNOT PRIME\nPRIME\nNOT PRIME', isHidden: false },
            { id: 'tc-apt-001-2', stdin: '1\n1000003', expectedOutput: 'PRIME', isHidden: true },
            { id: 'tc-apt-001-3', stdin: '3\n4\n6\n8', expectedOutput: 'NOT PRIME\nNOT PRIME\nNOT PRIME', isHidden: true },
        ],
        roles: ['software-engineer', 'ai-engineer', 'data-analyst'],
        timeSeconds: 900,
    },

    {
        id: 'cp-apt-002',
        domain: 'aptitude',
        topic: 'Logical Reasoning',
        difficulty: 'medium',
        title: 'Pattern Sequence',
        description: `Given the first few terms of a **geometric or arithmetic sequence**, predict the next **k** terms.

- If the difference between consecutive terms is **constant** → arithmetic sequence.
- If the ratio between consecutive terms is **constant** → geometric sequence.
- Assume input is always one of the two types with integer terms.

**Input:**
- Line 1: n (number of given terms), k (terms to predict)
- Line 2: n space-separated integers

**Output:** k space-separated integers on one line.`,
        constraints: ['3 ≤ n ≤ 20', '1 ≤ k ≤ 10', 'All terms fit in a 64-bit integer'],
        examples: [
            { input: '4 3\n2 4 6 8', output: '10 12 14', explanation: 'Arithmetic: diff=2' },
            { input: '3 2\n3 9 27', output: '81 243', explanation: 'Geometric: ratio=3' },
        ],
        starterCode: {
            python: `line1 = input().split()
n, k = int(line1[0]), int(line1[1])
terms = list(map(int, input().split()))

diff = terms[1] - terms[0]
is_arith = all(terms[i]-terms[i-1]==diff for i in range(2,n))

result = []
last = terms[-1]
if is_arith:
    for _ in range(k):
        last += diff
        result.append(last)
else:
    ratio = terms[1] // terms[0]
    for _ in range(k):
        last *= ratio
        result.append(last)

print(' '.join(map(str, result)))
`,
            javascript: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const [n,k]=lines[0].split(' ').map(Number);
const t=lines[1].split(' ').map(Number);
const diff=t[1]-t[0];
const isArith=t.every((v,i)=>i<2||v-t[i-1]===diff);
const res=[];let last=t[t.length-1];
if(isArith){for(let i=0;i<k;i++){last+=diff;res.push(last);}}
else{const r=t[1]/t[0];for(let i=0;i<k;i++){last*=r;res.push(last);}}
console.log(res.join(' '));
`,
            java: `import java.util.*;
public class Main{public static void main(String[] args){
    Scanner sc=new Scanner(System.in);int n=sc.nextInt(),k=sc.nextInt();
    long[] t=new long[n];for(int i=0;i<n;i++)t[i]=sc.nextLong();
    long diff=t[1]-t[0];boolean arith=true;
    for(int i=2;i<n;i++)if(t[i]-t[i-1]!=diff)arith=false;
    StringBuilder sb=new StringBuilder();long last=t[n-1];
    if(arith){for(int i=0;i<k;i++){last+=diff;if(i>0)sb.append(' ');sb.append(last);}}
    else{long r=t[1]/t[0];for(int i=0;i<k;i++){last*=r;if(i>0)sb.append(' ');sb.append(last);}}
    System.out.println(sb);
}}
`,
            cpp: `#include <bits/stdc++.h>
using namespace std;
int main(){
    int n,k;cin>>n>>k;
    vector<long long>t(n);for(auto&x:t)cin>>x;
    long long diff=t[1]-t[0];bool arith=true;
    for(int i=2;i<n;i++)if(t[i]-t[i-1]!=diff)arith=false;
    long long last=t[n-1];
    for(int i=0;i<k;i++){
        if(arith)last+=diff;else last*=(t[1]/t[0]);
        if(i)cout<<' ';cout<<last;
    }cout<<"\\n";
}
`,
        },
        testCases: [
            { id: 'tc-apt-002-1', stdin: '4 3\n2 4 6 8', expectedOutput: '10 12 14', isHidden: false },
            { id: 'tc-apt-002-2', stdin: '3 2\n3 9 27', expectedOutput: '81 243', isHidden: false },
            { id: 'tc-apt-002-3', stdin: '3 3\n10 20 30', expectedOutput: '40 50 60', isHidden: true },
            { id: 'tc-apt-002-4', stdin: '4 2\n1 2 4 8', expectedOutput: '16 32', isHidden: true },
        ],
        roles: ['software-engineer', 'ai-engineer', 'data-analyst'],
        timeSeconds: 1200,
    },

    {
        id: 'cp-apt-003',
        domain: 'aptitude',
        topic: 'Data Interpretation',
        difficulty: 'hard',
        title: 'Sales Report Analyser',
        description: `You are given monthly sales data for multiple products. Compute:

1. The **highest revenue product** (by total sales across all months).
2. The **best month** (highest combined sales across all products).
3. The **average monthly revenue** per product (rounded down to integer).

**Input:**
- Line 1: p (products), m (months)
- Next p lines: product name followed by m integers (monthly sales)

**Output:**
- Line 1: \`Top product: <name>\`
- Line 2: \`Best month: <1-indexed month number>\`
- Line 3: \`Average per product: <value>\``,
        constraints: ['1 ≤ p ≤ 20', '1 ≤ m ≤ 12', 'Sales values 0–10^6'],
        examples: [
            {
                input: '3 3\nAlpha 100 200 150\nBeta 300 100 200\nGamma 50 400 100',
                output: 'Top product: Beta\nBest month: 2\nAverage per product: 183',
                explanation: 'Beta total=600>Alpha=450>Gamma=550. Month 2: 200+100+400=700. Total=(450+600+550)=1600, avg=1600/(3*3)=177 → actually avg per product = total/p = 1600/3=533... wait let me recalculate. Average monthly revenue per product = product_total / m. Alpha=450/3=150, Beta=600/3=200, Gamma=550/3=183. Average of those = (150+200+183)/3=177.',
            },
        ],
        starterCode: {
            python: `import sys
data = sys.stdin.read().split('\\n')
p, m = map(int, data[0].split())
products = {}
monthly_totals = [0] * m

for i in range(1, p + 1):
    parts = data[i].split()
    name = parts[0]
    sales = list(map(int, parts[1:]))
    products[name] = sum(sales)
    for j, s in enumerate(sales):
        monthly_totals[j] += s

top_product = max(products, key=products.get)
best_month = monthly_totals.index(max(monthly_totals)) + 1
avg = sum(products.values()) // p // m

print(f"Top product: {top_product}")
print(f"Best month: {best_month}")
print(f"Average per product: {avg}")
`,
            javascript: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const [p,m]=lines[0].split(' ').map(Number);
const products={};const monthly=new Array(m).fill(0);
for(let i=1;i<=p;i++){
    const parts=lines[i].split(' ');const name=parts[0];
    const sales=parts.slice(1).map(Number);
    products[name]=(products[name]||0)+sales.reduce((a,b)=>a+b,0);
    sales.forEach((s,j)=>monthly[j]+=s);
}
const top=Object.entries(products).sort((a,b)=>b[1]-a[1])[0][0];
const bestM=monthly.indexOf(Math.max(...monthly))+1;
const avg=Math.floor(Object.values(products).reduce((a,b)=>a+b,0)/p/m);
console.log('Top product: '+top);
console.log('Best month: '+bestM);
console.log('Average per product: '+avg);
`,
            java: `import java.util.*;import java.io.*;
public class Main{public static void main(String[] a) throws Exception{
    BufferedReader br=new BufferedReader(new InputStreamReader(System.in));
    StringTokenizer st=new StringTokenizer(br.readLine());
    int p=Integer.parseInt(st.nextToken()),m=Integer.parseInt(st.nextToken());
    String topName="";long topTotal=Long.MIN_VALUE;long[]monthly=new long[m];long grandTotal=0;
    for(int i=0;i<p;i++){st=new StringTokenizer(br.readLine());String name=st.nextToken();long tot=0;
        for(int j=0;j<m;j++){long s=Long.parseLong(st.nextToken());monthly[j]+=s;tot+=s;}
        grandTotal+=tot;if(tot>topTotal){topTotal=tot;topName=name;}}
    int best=0;for(int j=1;j<m;j++)if(monthly[j]>monthly[best])best=j;
    System.out.println("Top product: "+topName);
    System.out.println("Best month: "+(best+1));
    System.out.println("Average per product: "+grandTotal/p/m);
}}
`,
            cpp: `#include <bits/stdc++.h>
using namespace std;
int main(){
    int p,m;cin>>p>>m;
    string topName;long long topTot=LLONG_MIN,grand=0;
    vector<long long>monthly(m,0);
    for(int i=0;i<p;i++){string name;cin>>name;long long tot=0;
        for(int j=0;j<m;j++){long long s;cin>>s;monthly[j]+=s;tot+=s;}
        grand+=tot;if(tot>topTot){topTot=tot;topName=name;}}
    int best=max_element(monthly.begin(),monthly.end())-monthly.begin();
    cout<<"Top product: "<<topName<<"\\n";
    cout<<"Best month: "<<best+1<<"\\n";
    cout<<"Average per product: "<<grand/p/m<<"\\n";
}
`,
        },
        testCases: [
            { id: 'tc-apt-003-1', stdin: '2 2\nX 100 200\nY 50 50', expectedOutput: 'Top product: X\nBest month: 2\nAverage per product: 100', isHidden: false },
            { id: 'tc-apt-003-2', stdin: '1 3\nSolo 10 20 30', expectedOutput: 'Top product: Solo\nBest month: 3\nAverage per product: 20', isHidden: false },
            { id: 'tc-apt-003-3', stdin: '3 3\nAlpha 100 200 150\nBeta 300 100 200\nGamma 50 400 100', expectedOutput: 'Top product: Beta\nBest month: 2\nAverage per product: 177', isHidden: true },
        ],
        roles: ['data-analyst', 'software-engineer'],
        timeSeconds: 1800,
    },

    // ══════════════════════════════════════════════════════════════════════════
    // DOMAIN: devops
    // ══════════════════════════════════════════════════════════════════════════

    {
        id: 'cp-dvo-001',
        domain: 'devops',
        topic: 'CI/CD Pipelines',
        difficulty: 'easy',
        title: 'Semantic Version Comparator',
        description: `Compare two semantic version strings (format: \`MAJOR.MINOR.PATCH\`).

Print:
- \`GREATER\` if version A is newer than version B
- \`LESS\` if version A is older than version B
- \`EQUAL\` if they are the same version

**Input:**
- Line 1: q (queries)
- Next q lines: version A and version B (space separated)

**Output:** q lines, each \`GREATER\`, \`LESS\`, or \`EQUAL\`.`,
        constraints: ['1 ≤ q ≤ 100', '0 ≤ MAJOR, MINOR, PATCH ≤ 999'],
        examples: [
            { input: '3\n2.1.0 1.9.9\n1.0.0 1.0.0\n0.9.1 1.0.0', output: 'GREATER\nEQUAL\nLESS' },
        ],
        starterCode: {
            python: `q = int(input())
for _ in range(q):
    a, b = input().split()
    av = list(map(int, a.split('.')))
    bv = list(map(int, b.split('.')))
    if av > bv: print("GREATER")
    elif av < bv: print("LESS")
    else: print("EQUAL")
`,
            javascript: `const lines=require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const q=parseInt(lines[0]);
for(let i=1;i<=q;i++){
    const [a,b]=lines[i].split(' ');
    const av=a.split('.').map(Number),bv=b.split('.').map(Number);
    for(let j=0;j<3;j++){if(av[j]>bv[j]){console.log('GREATER');break;}if(av[j]<bv[j]){console.log('LESS');break;}if(j===2)console.log('EQUAL');}
}
`,
            java: `import java.util.*;
public class Main{public static void main(String[] a){
    Scanner sc=new Scanner(System.in);int q=sc.nextInt();
    while(q-->0){String s1=sc.next(),s2=sc.next();
        int[]v1=Arrays.stream(s1.split("\\\\.")).mapToInt(Integer::parseInt).toArray();
        int[]v2=Arrays.stream(s2.split("\\\\.")).mapToInt(Integer::parseInt).toArray();
        boolean found=false;
        for(int i=0;i<3;i++){if(v1[i]>v2[i]){System.out.println("GREATER");found=true;break;}if(v1[i]<v2[i]){System.out.println("LESS");found=true;break;}}
        if(!found)System.out.println("EQUAL");}
}}
`,
            cpp: `#include <bits/stdc++.h>
using namespace std;
vector<int> parse(string s){vector<int>v;stringstream ss(s);string t;while(getline(ss,t,'.'))v.push_back(stoi(t));return v;}
int main(){int q;cin>>q;while(q--){string a,b;cin>>a>>b;auto v1=parse(a),v2=parse(b);
    string r="EQUAL";for(int i=0;i<3;i++){if(v1[i]>v2[i]){r="GREATER";break;}if(v1[i]<v2[i]){r="LESS";break;}}
    cout<<r<<"\\n";}
}
`,
        },
        testCases: [
            { id: 'tc-dvo-001-1', stdin: '3\n2.1.0 1.9.9\n1.0.0 1.0.0\n0.9.1 1.0.0', expectedOutput: 'GREATER\nEQUAL\nLESS', isHidden: false },
            { id: 'tc-dvo-001-2', stdin: '2\n10.0.0 9.99.99\n0.0.1 0.0.2', expectedOutput: 'GREATER\nLESS', isHidden: true },
        ],
        roles: ['devops-engineer', 'backend-engineer'],
        timeSeconds: 600,
    },

    {
        id: 'cp-dvo-002',
        domain: 'devops',
        topic: 'Monitoring & Observability',
        difficulty: 'medium',
        title: 'Log Level Aggregator',
        description: `Parse a server log file and count occurrences of each log level.

Log lines follow the format: \`[LEVEL] message...\`
Levels: \`INFO\`, \`WARN\`, \`ERROR\`, \`DEBUG\`

Print the counts in descending order. If equal, sort alphabetically by level name.
Only print levels that appear at least once.

**Input:** Multiple log lines (terminated by EOF).
**Output:** One line per level: \`LEVEL: count\` sorted by count desc, then alpha.`,
        constraints: ['Lines ≤ 10^4', 'Each line starts with [LEVEL]'],
        examples: [
            { input: '[INFO] Server started\n[ERROR] Disk full\n[INFO] Request received\n[WARN] High CPU', output: 'INFO: 2\nERROR: 1\nWARN: 1' },
        ],
        starterCode: {
            python: `import sys
from collections import defaultdict

counts = defaultdict(int)
for line in sys.stdin:
    line = line.strip()
    if line.startswith('['):
        level = line[1:line.index(']')]
        counts[level] += 1

for level, count in sorted(counts.items(), key=lambda x: (-x[1], x[0])):
    print(f"{level}: {count}")
`,
            javascript: `const lines=require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const counts={};
lines.forEach(l=>{const m=l.match(/^\\[([A-Z]+)\\]/);if(m)counts[m[1]]=(counts[m[1]]||0)+1;});
Object.entries(counts).sort(([a,ca],[b,cb])=>cb-ca||a.localeCompare(b)).forEach(([l,c])=>console.log(l+': '+c));
`,
            java: `import java.util.*;import java.io.*;
public class Main{public static void main(String[] a) throws Exception{
    Map<String,Integer> c=new HashMap<>();BufferedReader br=new BufferedReader(new InputStreamReader(System.in));
    String line;while((line=br.readLine())!=null){if(line.startsWith("[")){String lv=line.substring(1,line.indexOf(']'));c.merge(lv,1,Integer::sum);}}
    c.entrySet().stream().sorted(Map.Entry.<String,Integer>comparingByValue(Comparator.reverseOrder()).thenComparing(Map.Entry.comparingByKey()))
        .forEach(e->System.out.println(e.getKey()+": "+e.getValue()));
}}
`,
            cpp: `#include <bits/stdc++.h>
using namespace std;
int main(){map<string,int>c;string line;
    while(getline(cin,line)){if(line[0]=='['){string lv=line.substr(1,line.find(']')-1);c[lv]++;}}
    vector<pair<int,string>>v;for(auto&[k,n]:c)v.push_back({n,k});
    sort(v.begin(),v.end(),[](auto&a,auto&b){return a.first!=b.first?a.first>b.first:a.second<b.second;});
    for(auto&[n,k]:v)cout<<k<<": "<<n<<"\\n";
}
`,
        },
        testCases: [
            { id: 'tc-dvo-002-1', stdin: '[INFO] Server started\n[ERROR] Disk full\n[INFO] Request received\n[WARN] High CPU', expectedOutput: 'INFO: 2\nERROR: 1\nWARN: 1', isHidden: false },
            { id: 'tc-dvo-002-2', stdin: '[DEBUG] trace\n[DEBUG] trace2\n[INFO] ok', expectedOutput: 'DEBUG: 2\nINFO: 1', isHidden: false },
            { id: 'tc-dvo-002-3', stdin: '[ERROR] fatal\n[ERROR] critical\n[WARN] slow\n[INFO] boot', expectedOutput: 'ERROR: 2\nINFO: 1\nWARN: 1', isHidden: true },
        ],
        roles: ['devops-engineer', 'backend-engineer'],
        timeSeconds: 1200,
    },

    {
        id: 'cp-dvo-003',
        domain: 'devops',
        topic: 'Infrastructure as Code',
        difficulty: 'hard',
        title: 'Dependency Resolver',
        description: `Given a list of service dependencies, produce a valid **deployment order** (topological sort).

Each service must be deployed after all its dependencies.
If a **circular dependency** exists, print \`CIRCULAR DEPENDENCY\`.
Otherwise, print services in a valid deployment order (one per line).
If multiple valid orders exist, print the **lexicographically smallest** one.

**Input:**
- Line 1: n (services), d (dependency pairs)
- Line 2: service names (space separated)
- Next d lines: \`A B\` means A depends on B (B must deploy first)

**Output:** Valid deployment order or \`CIRCULAR DEPENDENCY\`.`,
        constraints: ['1 ≤ n ≤ 100', '0 ≤ d ≤ n×(n-1)'],
        examples: [
            { input: '4 3\napi db cache worker\napi db\napi cache\nworker db', output: 'cache\ndb\napi\nworker', explanation: 'cache and db have no deps, deploy first (lex order). Then api (needs both), then worker.' },
            { input: '2 2\nA B\nA B\nB A', output: 'CIRCULAR DEPENDENCY' },
        ],
        starterCode: {
            python: `import sys
from heapq import *

data = sys.stdin.read().split('\\n')
n, d = map(int, data[0].split())
services = data[1].split()
indegree = {s: 0 for s in services}
adj = {s: [] for s in services}

for i in range(2, 2 + d):
    parts = data[i].split()
    if len(parts) == 2:
        a, b = parts  # a depends on b → b→a
        adj[b].append(a)
        indegree[a] += 1

heap = [s for s in services if indegree[s] == 0]
heapify(heap)
result = []

while heap:
    node = heappop(heap)
    result.append(node)
    for nxt in adj[node]:
        indegree[nxt] -= 1
        if indegree[nxt] == 0:
            heappush(heap, nxt)

if len(result) != n:
    print("CIRCULAR DEPENDENCY")
else:
    print('\\n'.join(result))
`,
            javascript: `const lines=require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const[n,d]=lines[0].split(' ').map(Number);
const services=lines[1].split(' ');
const indegree=Object.fromEntries(services.map(s=>[s,0]));
const adj=Object.fromEntries(services.map(s=>[s,[]]));
for(let i=2;i<2+d;i++){const[a,b]=lines[i].split(' ');adj[b].push(a);indegree[a]++;}
// Min-heap with sorted array
let q=services.filter(s=>indegree[s]===0).sort();
const res=[];
while(q.length){
    q.sort();const node=q.shift();res.push(node);
    adj[node].forEach(nxt=>{if(--indegree[nxt]===0)q.push(nxt);});
}
console.log(res.length!==n?'CIRCULAR DEPENDENCY':res.join('\\n'));
`,
            java: `import java.util.*;
public class Main{public static void main(String[] a){
    Scanner sc=new Scanner(System.in);int n=sc.nextInt(),d=sc.nextInt();
    String[]svc=new String[n];Map<String,Integer>idx=new HashMap<>();
    Map<String,List<String>>adj=new HashMap<>();Map<String,Integer>indeg=new HashMap<>();
    for(int i=0;i<n;i++){svc[i]=sc.next();adj.put(svc[i],new ArrayList<>());indeg.put(svc[i],0);}
    for(int i=0;i<d;i++){String A=sc.next(),B=sc.next();adj.get(B).add(A);indeg.merge(A,1,Integer::sum);}
    PriorityQueue<String>pq=new PriorityQueue<>();
    for(String s:svc)if(indeg.get(s)==0)pq.add(s);
    List<String>res=new ArrayList<>();
    while(!pq.isEmpty()){String node=pq.poll();res.add(node);for(String nb:adj.get(node)){indeg.merge(nb,-1,Integer::sum);if(indeg.get(nb)==0)pq.add(nb);}}
    if(res.size()!=n)System.out.println("CIRCULAR DEPENDENCY");else res.forEach(System.out::println);
}}
`,
            cpp: `#include <bits/stdc++.h>
using namespace std;
int main(){
    int n,d;cin>>n>>d;
    vector<string>svc(n);for(auto&s:svc)cin>>s;
    map<string,vector<string>>adj;map<string,int>indeg;
    for(auto&s:svc){adj[s];indeg[s]=0;}
    for(int i=0;i<d;i++){string a,b;cin>>a>>b;adj[b].push_back(a);indeg[a]++;}
    priority_queue<string,vector<string>,greater<>>pq;
    for(auto&s:svc)if(indeg[s]==0)pq.push(s);
    vector<string>res;
    while(!pq.empty()){auto node=pq.top();pq.pop();res.push_back(node);for(auto&nb:adj[node])if(--indeg[nb]==0)pq.push(nb);}
    if((int)res.size()!=n)cout<<"CIRCULAR DEPENDENCY\\n";else for(auto&s:res)cout<<s<<"\\n";
}
`,
        },
        testCases: [
            { id: 'tc-dvo-003-1', stdin: '4 3\napi db cache worker\napi db\napi cache\nworker db', expectedOutput: 'cache\ndb\napi\nworker', isHidden: false },
            { id: 'tc-dvo-003-2', stdin: '2 2\nA B\nA B\nB A', expectedOutput: 'CIRCULAR DEPENDENCY', isHidden: false },
            { id: 'tc-dvo-003-3', stdin: '3 0\nZ A M', expectedOutput: 'A\nM\nZ', isHidden: true },
            { id: 'tc-dvo-003-4', stdin: '3 2\nX Y Z\nX Y\nY Z', expectedOutput: 'Z\nY\nX', isHidden: true },
        ],
        roles: ['devops-engineer', 'backend-engineer'],
        timeSeconds: 2400,
    },

    // ══════════════════════════════════════════════════════════════════════════
    // DOMAIN: computer_networks
    // ══════════════════════════════════════════════════════════════════════════

    {
        id: 'cp-cn-001',
        domain: 'computer_networks',
        topic: 'Subnetting',
        difficulty: 'easy',
        title: 'IP Address Validator',
        description: `Given a list of strings, determine if each is a **valid IPv4 address**.

A valid IPv4 address has exactly 4 octets separated by dots, where each octet is an integer in range **[0, 255]** with no leading zeros (except "0" itself).

Print \`VALID\` or \`INVALID\` for each.

**Input:**
- Line 1: n
- Next n lines: one string per line

**Output:** n lines, \`VALID\` or \`INVALID\`.`,
        constraints: ['1 ≤ n ≤ 1000'],
        examples: [
            { input: '4\n192.168.1.1\n256.0.0.1\n01.02.03.04\n10.0.0.0', output: 'VALID\nINVALID\nINVALID\nVALID' },
        ],
        starterCode: {
            python: `def valid_ip(s):
    parts = s.split('.')
    if len(parts) != 4: return False
    for p in parts:
        if not p.isdigit(): return False
        if len(p) > 1 and p[0] == '0': return False
        if not 0 <= int(p) <= 255: return False
    return True

n = int(input())
for _ in range(n):
    print("VALID" if valid_ip(input().strip()) else "INVALID")
`,
            javascript: `const lines=require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const n=parseInt(lines[0]);
function valid(s){const p=s.split('.');if(p.length!==4)return false;return p.every(x=>/^\\d+$/.test(x)&&(x.length===1||x[0]!=='0')&&+x<=255);}
for(let i=1;i<=n;i++)console.log(valid(lines[i])?'VALID':'INVALID');
`,
            java: `import java.util.*;
public class Main{
    static boolean valid(String s){String[]p=s.split("\\\\.",-1);if(p.length!=4)return false;
        for(String x:p){if(!x.matches("\\\\d+"))return false;if(x.length()>1&&x.charAt(0)=='0')return false;int v=Integer.parseInt(x);if(v<0||v>255)return false;}return true;}
    public static void main(String[] a){Scanner sc=new Scanner(System.in);int n=sc.nextInt();sc.nextLine();
        while(n-->0)System.out.println(valid(sc.nextLine().trim())?"VALID":"INVALID");}
}
`,
            cpp: `#include <bits/stdc++.h>
using namespace std;
bool valid(string s){
    int cnt=0,i=0;
    while(i<(int)s.size()){
        string tok;
        while(i<(int)s.size()&&s[i]!='.')tok+=s[i++];
        i++;cnt++;
        if(tok.empty()||tok.size()>3)return false;
        if(tok.size()>1&&tok[0]=='0')return false;
        if(!all_of(tok.begin(),tok.end(),::isdigit))return false;
        if(stoi(tok)>255)return false;
    }
    return cnt==4;
}
int main(){int n;cin>>n;cin.ignore();while(n--){string s;getline(cin,s);cout<<(valid(s)?"VALID":"INVALID")<<"\\n";};}
`,
        },
        testCases: [
            { id: 'tc-cn-001-1', stdin: '4\n192.168.1.1\n256.0.0.1\n01.02.03.04\n10.0.0.0', expectedOutput: 'VALID\nINVALID\nINVALID\nVALID', isHidden: false },
            { id: 'tc-cn-001-2', stdin: '2\n0.0.0.0\n1.2.3', expectedOutput: 'VALID\nINVALID', isHidden: false },
            { id: 'tc-cn-001-3', stdin: '3\n255.255.255.255\n192.168.001.1\nabc.def.ghi.jkl', expectedOutput: 'VALID\nINVALID\nINVALID', isHidden: true },
        ],
        roles: ['software-engineer', 'devops-engineer', 'backend-engineer'],
        timeSeconds: 900,
    },

    {
        id: 'cp-cn-002',
        domain: 'computer_networks',
        topic: 'DNS & Routing',
        difficulty: 'medium',
        title: 'Subnet Calculator',
        description: `Given an IP address and a CIDR prefix length, calculate:

1. **Network address** (host bits set to 0)
2. **Broadcast address** (host bits set to 1)
3. **Number of usable hosts** (total addresses - 2, minimum 0)

**Input:**
- Line 1: q (queries)
- Next q lines: \`IP/prefix\` e.g. \`192.168.1.50/24\`

**Output:** For each query, 3 lines:
\`Network: X.X.X.X\`
\`Broadcast: X.X.X.X\`
\`Usable hosts: N\`
Followed by a blank line between queries.`,
        constraints: ['1 ≤ q ≤ 100', '0 ≤ prefix ≤ 32'],
        examples: [
            { input: '1\n192.168.1.50/24', output: 'Network: 192.168.1.0\nBroadcast: 192.168.1.255\nUsable hosts: 254' },
        ],
        starterCode: {
            python: `q = int(input())
for qi in range(q):
    ip_cidr = input().strip()
    ip, prefix = ip_cidr.split('/')
    prefix = int(prefix)
    
    octets = list(map(int, ip.split('.')))
    ip_int = (octets[0]<<24)|(octets[1]<<16)|(octets[2]<<8)|octets[3]
    
    mask = (0xFFFFFFFF << (32 - prefix)) & 0xFFFFFFFF
    network = ip_int & mask
    broadcast = network | (~mask & 0xFFFFFFFF)
    usable = max(0, (1 << (32 - prefix)) - 2)
    
    def to_ip(n):
        return f"{(n>>24)&0xFF}.{(n>>16)&0xFF}.{(n>>8)&0xFF}.{n&0xFF}"
    
    print(f"Network: {to_ip(network)}")
    print(f"Broadcast: {to_ip(broadcast)}")
    print(f"Usable hosts: {usable}")
    if qi < q - 1: print()
`,
            javascript: `const lines=require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const q=parseInt(lines[0]);
function toIP(n){return[(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255].join('.');}
const out=[];
for(let i=1;i<=q;i++){
    const[ip,pfx]=lines[i].split('/');const prefix=parseInt(pfx);
    const oct=ip.split('.').map(Number);
    const ipInt=(oct[0]<<24)|(oct[1]<<16)|(oct[2]<<8)|oct[3];
    const mask=prefix===0?0:(0xFFFFFFFF<<(32-prefix))>>>0;
    const net=(ipInt&mask)>>>0,bcast=(net|(~mask>>>0))>>>0;
    const usable=Math.max(0,Math.pow(2,32-prefix)-2);
    out.push('Network: '+toIP(net));out.push('Broadcast: '+toIP(bcast));out.push('Usable hosts: '+usable);
    if(i<q)out.push('');
}
console.log(out.join('\\n'));
`,
            java: `import java.util.*;
public class Main{
    static String toIP(long n){return ((n>>24)&255)+"."+ ((n>>16)&255)+"."+ ((n>>8)&255)+"."+(n&255);}
    public static void main(String[] a){
        Scanner sc=new Scanner(System.in);int q=sc.nextInt();
        for(int qi=0;qi<q;qi++){String s=sc.next();String[]p=s.split("/");int pfx=Integer.parseInt(p[1]);
            String[]octs=p[0].split("\\\\.");long ip=0;for(String o:octs)ip=(ip<<8)|Long.parseLong(o);
            long mask=pfx==0?0:((0xFFFFFFFFL<<(32-pfx))&0xFFFFFFFFL);
            long net=ip&mask,bc=net|(~mask&0xFFFFFFFFL);long usable=Math.max(0,(1L<<(32-pfx))-2);
            System.out.println("Network: "+toIP(net));System.out.println("Broadcast: "+toIP(bc));System.out.println("Usable hosts: "+usable);
            if(qi<q-1)System.out.println();}
    }
}
`,
            cpp: `#include <bits/stdc++.h>
using namespace std;
string toIP(unsigned int n){return to_string((n>>24)&255)+"."+to_string((n>>16)&255)+"."+to_string((n>>8)&255)+"."+to_string(n&255);}
int main(){int q;cin>>q;for(int qi=0;qi<q;qi++){
    string s;cin>>s;auto pos=s.find('/');int pfx=stoi(s.substr(pos+1));
    stringstream ss(s.substr(0,pos));unsigned int ip=0;string tok;int sh=24;
    while(getline(ss,tok,'.')){ip|=stoul(tok)<<sh;sh-=8;}
    unsigned int mask=pfx==0?0u:(0xFFFFFFFFu<<(32-pfx));
    unsigned int net=ip&mask,bc=net|(~mask);
    long long usable=max(0LL,(1LL<<(32-pfx))-2);
    cout<<"Network: "<<toIP(net)<<"\\nBroadcast: "<<toIP(bc)<<"\\nUsable hosts: "<<usable<<"\\n";
    if(qi<q-1)cout<<"\\n";}
}
`,
        },
        testCases: [
            { id: 'tc-cn-002-1', stdin: '1\n192.168.1.50/24', expectedOutput: 'Network: 192.168.1.0\nBroadcast: 192.168.1.255\nUsable hosts: 254', isHidden: false },
            { id: 'tc-cn-002-2', stdin: '1\n10.0.0.1/8', expectedOutput: 'Network: 10.0.0.0\nBroadcast: 10.255.255.255\nUsable hosts: 16777214', isHidden: false },
            { id: 'tc-cn-002-3', stdin: '1\n172.16.5.130/30', expectedOutput: 'Network: 172.16.5.128\nBroadcast: 172.16.5.131\nUsable hosts: 2', isHidden: true },
        ],
        roles: ['devops-engineer', 'backend-engineer', 'software-engineer'],
        timeSeconds: 1800,
    },

    {
        id: 'cp-cn-003',
        domain: 'computer_networks',
        topic: 'Protocols',
        difficulty: 'hard',
        title: 'Packet Loss Analyser',
        description: `Given a sequence of **packet IDs** received at a destination (packets may arrive **out of order** or be **lost**), determine:

1. **Lost packets**: IDs that were sent but never received.
2. **Out-of-order packets**: IDs that arrived earlier than expected (i.e., a packet with a higher ID arrived before it).
3. **Duplicate packets**: IDs that appear more than once.

Sent packets have consecutive IDs: 1 to n.

**Input:**
- Line 1: n (total packets sent)
- Line 2: m (packets received)
- Line 3: m space-separated received packet IDs

**Output:**
- \`Lost: <sorted ids or NONE>\`
- \`Out-of-order: <sorted ids or NONE>\`
- \`Duplicates: <sorted ids or NONE>\``,
        constraints: ['1 ≤ n ≤ 10^4', '0 ≤ m ≤ 2n'],
        examples: [
            {
                input: '5\n5\n1 3 2 4 5',
                output: 'Lost: NONE\nOut-of-order: 2\nDuplicates: NONE',
                explanation: '2 arrived after 3 (out of order). All received. No dups.',
            },
        ],
        starterCode: {
            python: `n = int(input())
m = int(input())
received = list(map(int, input().split()))

from collections import Counter
cnt = Counter(received)
received_set = set(received)

lost = sorted([i for i in range(1, n+1) if i not in received_set])
duplicates = sorted([k for k,v in cnt.items() if v > 1])

max_seen = 0
out_of_order = []
for pid in received:
    if pid < max_seen:
        out_of_order.append(pid)
    else:
        max_seen = pid

out_of_order = sorted(set(out_of_order))

def fmt(lst): return ' '.join(map(str,lst)) if lst else 'NONE'
print(f"Lost: {fmt(lost)}")
print(f"Out-of-order: {fmt(out_of_order)}")
print(f"Duplicates: {fmt(duplicates)}")
`,
            javascript: `const lines=require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const n=parseInt(lines[0]),m=parseInt(lines[1]);
const received=m>0?lines[2].split(' ').map(Number):[];
const cnt={};received.forEach(p=>cnt[p]=(cnt[p]||0)+1);
const recSet=new Set(received);
const lost=[...Array(n)].map((_,i)=>i+1).filter(i=>!recSet.has(i));
const dups=Object.entries(cnt).filter(([,v])=>v>1).map(([k])=>+k).sort((a,b)=>a-b);
let maxSeen=0;const ooo=new Set();
received.forEach(p=>{if(p<maxSeen)ooo.add(p);else maxSeen=p;});
const oooArr=[...ooo].sort((a,b)=>a-b);
const fmt=a=>a.length?a.join(' '):'NONE';
console.log('Lost: '+fmt(lost));console.log('Out-of-order: '+fmt(oooArr));console.log('Duplicates: '+fmt(dups));
`,
            java: `import java.util.*;
public class Main{public static void main(String[] a){
    Scanner sc=new Scanner(System.in);int n=sc.nextInt(),m=sc.nextInt();
    int[]recv=new int[m];Map<Integer,Integer>cnt=new HashMap<>();Set<Integer>recSet=new HashSet<>();
    for(int i=0;i<m;i++){recv[i]=sc.nextInt();cnt.merge(recv[i],1,Integer::sum);recSet.add(recv[i]);}
    List<Integer>lost=new ArrayList<>(),dups=new ArrayList<>(),ooo=new ArrayList<>();
    for(int i=1;i<=n;i++)if(!recSet.contains(i))lost.add(i);
    cnt.forEach((k,v)->{if(v>1)dups.add(k);});Collections.sort(dups);
    int max=0;Set<Integer>oooSet=new HashSet<>();
    for(int p:recv){if(p<max)oooSet.add(p);else max=p;}
    ooo.addAll(oooSet);Collections.sort(ooo);
    java.util.function.Function<List<Integer>,String>fmt=l->l.isEmpty()?"NONE":l.toString().replaceAll("[\\\\[\\\\],]","").trim();
    System.out.println("Lost: "+fmt.apply(lost));System.out.println("Out-of-order: "+fmt.apply(ooo));System.out.println("Duplicates: "+fmt.apply(dups));
}}
`,
            cpp: `#include <bits/stdc++.h>
using namespace std;
int main(){
    int n,m;cin>>n>>m;vector<int>recv(m);map<int,int>cnt;set<int>recSet;
    for(auto&x:recv){cin>>x;cnt[x]++;recSet.insert(x);}
    auto fmt=[](vector<int>v)->string{if(v.empty())return "NONE";string r;for(int i=0;i<(int)v.size();i++){if(i)r+=' ';r+=to_string(v[i]);}return r;};
    vector<int>lost;for(int i=1;i<=n;i++)if(!recSet.count(i))lost.push_back(i);
    vector<int>dups;for(auto&[k,v]:cnt)if(v>1)dups.push_back(k);sort(dups.begin(),dups.end());
    int maxS=0;set<int>oooSet;for(int p:recv){if(p<maxS)oooSet.insert(p);else maxS=p;}
    vector<int>ooo(oooSet.begin(),oooSet.end());
    cout<<"Lost: "<<fmt(lost)<<"\\nOut-of-order: "<<fmt(ooo)<<"\\nDuplicates: "<<fmt(dups)<<"\\n";
}
`,
        },
        testCases: [
            { id: 'tc-cn-003-1', stdin: '5\n5\n1 3 2 4 5', expectedOutput: 'Lost: NONE\nOut-of-order: 2\nDuplicates: NONE', isHidden: false },
            { id: 'tc-cn-003-2', stdin: '4\n3\n1 4 2', expectedOutput: 'Lost: 3\nOut-of-order: 2\nDuplicates: NONE', isHidden: false },
            { id: 'tc-cn-003-3', stdin: '5\n6\n1 2 2 3 4 5', expectedOutput: 'Lost: NONE\nOut-of-order: NONE\nDuplicates: 2', isHidden: true },
            { id: 'tc-cn-003-4', stdin: '3\n0\n', expectedOutput: 'Lost: 1 2 3\nOut-of-order: NONE\nDuplicates: NONE', isHidden: true },
        ],
        roles: ['software-engineer', 'backend-engineer', 'devops-engineer'],
        timeSeconds: 2400,
    },

    // ══════════════════════════════════════════════════════════════════════════
    // DOMAIN: system_design
    // ══════════════════════════════════════════════════════════════════════════

    {
        id: 'cp-sd-001',
        domain: 'system_design',
        topic: 'Load Balancing',
        difficulty: 'easy',
        title: 'Round-Robin Scheduler',
        description: `Simulate a **round-robin load balancer** distributing requests across n servers.

Given a sequence of requests, output which server handles each request (1-indexed).
Requests cycle through servers: 1, 2, ..., n, 1, 2, ..., n, ...

**Input:**
- Line 1: n (servers), q (requests)
- Next q lines: request ID (string)

**Output:** q lines: \`<request_id> → Server <k>\``,
        constraints: ['1 ≤ n ≤ 100', '1 ≤ q ≤ 1000'],
        examples: [
            { input: '3 5\nreq1\nreq2\nreq3\nreq4\nreq5', output: 'req1 → Server 1\nreq2 → Server 2\nreq3 → Server 3\nreq4 → Server 1\nreq5 → Server 2' },
        ],
        starterCode: {
            python: `n, q = map(int, input().split())
for i in range(q):
    req = input().strip()
    server = (i % n) + 1
    print(f"{req} \u2192 Server {server}")
`,
            javascript: `const lines=require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const[n,q]=lines[0].split(' ').map(Number);
for(let i=0;i<q;i++)console.log(lines[i+1]+' \u2192 Server '+(i%n+1));
`,
            java: `import java.util.*;
public class Main{public static void main(String[] a){
    Scanner sc=new Scanner(System.in);int n=sc.nextInt(),q=sc.nextInt();sc.nextLine();
    for(int i=0;i<q;i++){String req=sc.nextLine().trim();System.out.println(req+" \u2192 Server "+(i%n+1));}
}}
`,
            cpp: `#include <bits/stdc++.h>
using namespace std;
int main(){int n,q;cin>>n>>q;cin.ignore();
    for(int i=0;i<q;i++){string req;getline(cin,req);cout<<req<<" \u2192 Server "<<(i%n+1)<<"\\n";}
}
`,
        },
        testCases: [
            { id: 'tc-sd-001-1', stdin: '3 5\nreq1\nreq2\nreq3\nreq4\nreq5', expectedOutput: 'req1 → Server 1\nreq2 → Server 2\nreq3 → Server 3\nreq4 → Server 1\nreq5 → Server 2', isHidden: false },
            { id: 'tc-sd-001-2', stdin: '1 3\nA\nB\nC', expectedOutput: 'A → Server 1\nB → Server 1\nC → Server 1', isHidden: true },
        ],
        roles: ['software-engineer', 'backend-engineer', 'devops-engineer'],
        timeSeconds: 600,
    },

    {
        id: 'cp-sd-002',
        domain: 'system_design',
        topic: 'Message Queues',
        difficulty: 'medium',
        title: 'Message Queue Simulator',
        description: `Simulate a **FIFO message queue** with retry logic.

Operations:
- \`ENQUEUE msg priority\` — add a message (priority: 1=high, 2=medium, 3=low)
- \`DEQUEUE\` — remove and print the **highest-priority** (lowest number) message; if tied, FIFO order
- \`SIZE\` — print the current queue size
- \`PEEK\` — print the next message to be dequeued without removing it; print \`EMPTY\` if empty

**Input:**
- Line 1: q (operations)
- Next q lines: one operation per line

**Output:** One line per DEQUEUE, SIZE, PEEK operation.`,
        constraints: ['1 ≤ q ≤ 10^4'],
        examples: [
            { input: '6\nENQUEUE task1 2\nENQUEUE task2 1\nENQUEUE task3 2\nPEEK\nDEQUEUE\nSIZE', output: 'task2\ntask2\n2' },
        ],
        starterCode: {
            python: `import heapq, sys
input = sys.stdin.readline

q = int(input())
heap = []
counter = 0

for _ in range(q):
    line = input().split()
    op = line[0]
    if op == 'ENQUEUE':
        msg, priority = line[1], int(line[2])
        heapq.heappush(heap, (priority, counter, msg))
        counter += 1
    elif op == 'DEQUEUE':
        if heap:
            _, _, msg = heapq.heappop(heap)
            print(msg)
        else:
            print("EMPTY")
    elif op == 'SIZE':
        print(len(heap))
    elif op == 'PEEK':
        if heap:
            print(heap[0][2])
        else:
            print("EMPTY")
`,
            javascript: `// Min-heap implementation
class PQ {
    constructor(){this.h=[];}
    push(p,c,m){this.h.push([p,c,m]);this.h.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);}
    pop(){return this.h.shift();}
    peek(){return this.h[0];}
    size(){return this.h.length;}
}
const lines=require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const q=parseInt(lines[0]);const pq=new PQ();let cnt=0,out=[];
for(let i=1;i<=q;i++){const p=lines[i].split(' ');
    if(p[0]==='ENQUEUE'){pq.push(parseInt(p[2]),cnt++,p[1]);}
    else if(p[0]==='DEQUEUE'){out.push(pq.size()?pq.pop()[2]:'EMPTY');}
    else if(p[0]==='SIZE'){out.push(pq.size());}
    else if(p[0]==='PEEK'){out.push(pq.size()?pq.peek()[2]:'EMPTY');}
}
console.log(out.join('\\n'));
`,
            java: `import java.util.*;import java.io.*;
public class Main{public static void main(String[] a) throws Exception{
    BufferedReader br=new BufferedReader(new InputStreamReader(System.in));
    PriorityQueue<int[]>pq=new PriorityQueue<>((x,y)->x[0]!=y[0]?x[0]-y[0]:x[1]-y[1]);
    Map<String,String>msgs=new LinkedHashMap<>();int q=Integer.parseInt(br.readLine());
    List<String[]>tasks=new ArrayList<>();int cnt=0;StringBuilder sb=new StringBuilder();
    // Simplified: store (priority, counter, msg_index)
    List<Object[]>items=new ArrayList<>();
    for(int i=0;i<q;i++){StringTokenizer st=new StringTokenizer(br.readLine());String op=st.nextToken();
        if(op.equals("ENQUEUE")){String msg=st.nextToken();int pri=Integer.parseInt(st.nextToken());pq.offer(new int[]{pri,cnt++,items.size()});items.add(new Object[]{msg});}
        else if(op.equals("DEQUEUE")){if(pq.isEmpty())sb.append("EMPTY\\n");else{int[]t=pq.poll();sb.append(items.get(t[2])[0]).append('\\n');}}
        else if(op.equals("SIZE")){sb.append(pq.size()).append('\\n');}
        else if(op.equals("PEEK")){if(pq.isEmpty())sb.append("EMPTY\\n");else{int[]t=pq.peek();sb.append(items.get(t[2])[0]).append('\\n');}}
    }
    System.out.print(sb);
}}
`,
            cpp: `#include <bits/stdc++.h>
using namespace std;
int main(){
    int q;cin>>q;
    priority_queue<tuple<int,int,string>,vector<tuple<int,int,string>>,greater<>>pq;
    int cnt=0;vector<string>out;
    while(q--){string op;cin>>op;
        if(op=="ENQUEUE"){string msg;int pri;cin>>msg>>pri;pq.push({pri,cnt++,msg});}
        else if(op=="DEQUEUE"){if(pq.empty())out.push_back("EMPTY");else{out.push_back(get<2>(pq.top()));pq.pop();}}
        else if(op=="SIZE"){out.push_back(to_string(pq.size()));}
        else if(op=="PEEK"){out.push_back(pq.empty()?"EMPTY":get<2>(pq.top()));}
    }
    for(auto&s:out)cout<<s<<"\\n";
}
`,
        },
        testCases: [
            { id: 'tc-sd-002-1', stdin: '6\nENQUEUE task1 2\nENQUEUE task2 1\nENQUEUE task3 2\nPEEK\nDEQUEUE\nSIZE', expectedOutput: 'task2\ntask2\n2', isHidden: false },
            { id: 'tc-sd-002-2', stdin: '3\nPEEK\nDEQUEUE\nSIZE', expectedOutput: 'EMPTY\nEMPTY\n0', isHidden: false },
            { id: 'tc-sd-002-3', stdin: '5\nENQUEUE a 3\nENQUEUE b 1\nENQUEUE c 1\nDEQUEUE\nDEQUEUE', expectedOutput: 'b\nc', isHidden: true },
        ],
        roles: ['backend-engineer', 'software-engineer'],
        timeSeconds: 1800,
    },

    {
        id: 'cp-sd-003',
        domain: 'system_design',
        topic: 'Caching Strategies',
        difficulty: 'hard',
        title: 'Cache Hit Rate Calculator',
        description: `Simulate a **fixed-size cache** and calculate its hit rate.

The cache uses **LFU (Least Frequently Used)** eviction: when full, evict the least frequently accessed key. If there's a tie, evict the **least recently used** among those.

Process a sequence of GET requests. Track:
- **Cache hit**: key found in cache
- **Cache miss**: key not found (add to cache)

**Input:**
- Line 1: capacity c, number of requests n
- Line 2: n space-separated integer keys

**Output:**
- \`Hits: X\`
- \`Misses: Y\`
- \`Hit rate: Z.ZZ%\` (formatted to 2 decimal places)`,
        constraints: ['1 ≤ c ≤ 1000', '1 ≤ n ≤ 10^4', '1 ≤ key ≤ 10^6'],
        examples: [
            { input: '2 6\n1 2 1 3 2 1', output: 'Hits: 3\nMisses: 3\nHit rate: 50.00%', explanation: '1→miss,2→miss,1→hit,3→miss(evicts 2),2→miss(evicts 3? no—1 has freq 2, 2 freq 1, evict 2? wait: cache={1:2,3:1} after 3→miss. 2→miss: lfu is 3(freq1), evict 3. cache={1:2,2:1}. So hits: 1(pos3),2(pos5),1(pos6)? Let me recount. 1:miss,2:miss,1:hit,3:miss(evict 2,freq 1),2:miss(evict 3,freq1),1:hit. Hits=2? Recompute properly in solution.' },
        ],
        starterCode: {
            python: `from collections import defaultdict

c, n = map(int, input().split())
keys = list(map(int, input().split()))

cache = {}        # key -> freq
freq_order = defaultdict(list)  # freq -> [keys in insertion order]
key_freq = {}     # key -> freq
min_freq = 0
hits = 0

def access(key):
    global min_freq, hits
    if key in cache:
        hits += 1
        f = key_freq[key]
        freq_order[f].remove(key)
        if not freq_order[f] and f == min_freq:
            min_freq += 1
        key_freq[key] = f + 1
        freq_order[f+1].append(key)
    else:
        if len(cache) >= c:
            # evict LFU
            evict = freq_order[min_freq].pop(0)
            del cache[evict]
            del key_freq[evict]
        cache[key] = True
        key_freq[key] = 1
        freq_order[1].append(key)
        min_freq = 1

for k in keys:
    access(k)

misses = n - hits
rate = hits / n * 100
print(f"Hits: {hits}")
print(f"Misses: {misses}")
print(f"Hit rate: {rate:.2f}%")
`,
            javascript: `const lines=require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const[c,n]=lines[0].split(' ').map(Number);
const keys=lines[1].split(' ').map(Number);
const cache=new Map(),keyFreq=new Map(),freqList=new Map();let minFreq=0,hits=0;
function access(key){
    if(cache.has(key)){
        hits++;const f=keyFreq.get(key);
        freqList.get(f).delete(key);if(!freqList.get(f).size&&f===minFreq)minFreq++;
        keyFreq.set(key,f+1);if(!freqList.has(f+1))freqList.set(f+1,new Set());
        freqList.get(f+1).add(key);
    } else {
        if(cache.size>=c){const ev=freqList.get(minFreq).values().next().value;freqList.get(minFreq).delete(ev);cache.delete(ev);keyFreq.delete(ev);}
        cache.set(key,true);keyFreq.set(key,1);if(!freqList.has(1))freqList.set(1,new Set());
        freqList.get(1).add(key);minFreq=1;
    }
}
keys.forEach(access);
const misses=n-hits;console.log('Hits: '+hits);console.log('Misses: '+misses);console.log('Hit rate: '+(hits/n*100).toFixed(2)+'%');
`,
            java: `import java.util.*;
public class Main{public static void main(String[] a){
    Scanner sc=new Scanner(System.in);int c=sc.nextInt(),n=sc.nextInt();
    Map<Integer,Integer>cache=new HashMap<>(),kf=new HashMap<>();
    Map<Integer,LinkedHashSet<Integer>>fl=new HashMap<>();int minF=0,hits=0;
    for(int i=0;i<n;i++){int key=sc.nextInt();
        if(cache.containsKey(key)){hits++;int f=kf.get(key);fl.get(f).remove(key);if(fl.get(f).isEmpty()&&f==minF)minF++;
            kf.put(key,f+1);fl.computeIfAbsent(f+1,x->new LinkedHashSet<>()).add(key);}
        else{if(cache.size()>=c){int ev=fl.get(minF).iterator().next();fl.get(minF).remove(ev);cache.remove(ev);kf.remove(ev);}
            cache.put(key,1);kf.put(key,1);fl.computeIfAbsent(1,x->new LinkedHashSet<>()).add(key);minF=1;}
    }
    int miss=n-hits;System.out.printf("Hits: %d%nMisses: %d%nHit rate: %.2f%%%n",hits,miss,(double)hits/n*100);
}}
`,
            cpp: `#include <bits/stdc++.h>
using namespace std;
int main(){
    int cap,n;cin>>cap>>n;
    map<int,int>kf;map<int,list<int>>fl;map<int,list<int>::iterator>pos;
    int minF=0,hits=0,csize=0;
    for(int i=0;i<n;i++){int key;cin>>key;
        if(kf.count(key)){hits++;int f=kf[key];fl[f].erase(pos[key]);if(fl[f].empty()&&f==minF)minF++;
            kf[key]=f+1;fl[f+1].push_front(key);pos[key]=fl[f+1].begin();}
        else{if(csize==cap){int ev=fl[minF].back();fl[minF].pop_back();kf.erase(ev);pos.erase(ev);csize--;}
            kf[key]=1;fl[1].push_front(key);pos[key]=fl[1].begin();minF=1;csize++;}
    }
    int miss=n-hits;printf("Hits: %d\\nMisses: %d\\nHit rate: %.2f%%\\n",hits,miss,(double)hits/n*100);
}
`,
        },
        testCases: [
            { id: 'tc-sd-003-1', stdin: '2 6\n1 2 1 3 2 1', expectedOutput: 'Hits: 3\nMisses: 3\nHit rate: 50.00%', isHidden: false },
            { id: 'tc-sd-003-2', stdin: '1 4\n1 1 1 2', expectedOutput: 'Hits: 2\nMisses: 2\nHit rate: 50.00%', isHidden: false },
            { id: 'tc-sd-003-3', stdin: '3 5\n1 2 3 1 2', expectedOutput: 'Hits: 2\nMisses: 3\nHit rate: 40.00%', isHidden: true },
        ],
        roles: ['backend-engineer', 'software-engineer'],
        timeSeconds: 2400,
    },

    // ══════════════════════════════════════════════════════════════════════════
    // DOMAIN: dbms
    // ══════════════════════════════════════════════════════════════════════════

    {
        id: 'cp-db-001',
        domain: 'dbms',
        topic: 'SQL Queries',
        difficulty: 'easy',
        title: 'Student Grade Calculator',
        description: `You are given student records. Calculate the **letter grade** for each student based on their average score.

Grading scale:
- ≥ 90 → **A**
- ≥ 80 → **B**
- ≥ 70 → **C**
- ≥ 60 → **D**
- < 60  → **F**

**Input:**
- Line 1: n (students)
- Next n lines: \`name score1 score2 score3\`

**Output:** n lines: \`name: grade\` sorted alphabetically by name.`,
        constraints: ['1 ≤ n ≤ 100', '0 ≤ scores ≤ 100'],
        examples: [
            { input: '3\nAlice 95 88 92\nBob 60 55 70\nCarol 80 75 85', output: 'Alice: A\nBob: D\nCarol: B' },
        ],
        starterCode: {
            python: `n = int(input())
students = []
for _ in range(n):
    parts = input().split()
    name = parts[0]
    avg = sum(map(int, parts[1:])) / 3
    if avg >= 90: grade = 'A'
    elif avg >= 80: grade = 'B'
    elif avg >= 70: grade = 'C'
    elif avg >= 60: grade = 'D'
    else: grade = 'F'
    students.append((name, grade))

for name, grade in sorted(students):
    print(f"{name}: {grade}")
`,
            javascript: `const lines=require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const n=parseInt(lines[0]);const res=[];
for(let i=1;i<=n;i++){const[name,...scores]=lines[i].split(' ');const avg=scores.map(Number).reduce((a,b)=>a+b,0)/3;
    const g=avg>=90?'A':avg>=80?'B':avg>=70?'C':avg>=60?'D':'F';res.push([name,g]);}
res.sort((a,b)=>a[0].localeCompare(b[0])).forEach(([n,g])=>console.log(n+': '+g));
`,
            java: `import java.util.*;
public class Main{public static void main(String[] a){
    Scanner sc=new Scanner(System.in);int n=sc.nextInt();List<String[]>list=new ArrayList<>();
    while(n-->0){String name=sc.next();int s=sc.nextInt()+sc.nextInt()+sc.nextInt();double avg=s/3.0;
        String g=avg>=90?"A":avg>=80?"B":avg>=70?"C":avg>=60?"D":"F";list.add(new String[]{name,g});}
    list.sort(Comparator.comparing(x->x[0]));list.forEach(x->System.out.println(x[0]+": "+x[1]));
}}
`,
            cpp: `#include <bits/stdc++.h>
using namespace std;
int main(){int n;cin>>n;vector<pair<string,string>>v;
    while(n--){string name;int a,b,c;cin>>name>>a>>b>>c;double avg=(a+b+c)/3.0;
        string g=avg>=90?"A":avg>=80?"B":avg>=70?"C":avg>=60?"D":"F";v.push_back({name,g});}
    sort(v.begin(),v.end());for(auto&[n,g]:v)cout<<n<<": "<<g<<"\\n";
}
`,
        },
        testCases: [
            { id: 'tc-db-001-1', stdin: '3\nAlice 95 88 92\nBob 60 55 70\nCarol 80 75 85', expectedOutput: 'Alice: A\nBob: D\nCarol: B', isHidden: false },
            { id: 'tc-db-001-2', stdin: '2\nZara 30 40 50\nDeven 100 100 100', expectedOutput: 'Deven: A\nZara: F', isHidden: false },
            { id: 'tc-db-001-3', stdin: '1\nMike 70 70 70', expectedOutput: 'Mike: C', isHidden: true },
        ],
        roles: ['software-engineer', 'data-analyst', 'backend-engineer'],
        timeSeconds: 900,
    },

    {
        id: 'cp-db-002',
        domain: 'dbms',
        topic: 'Transactions & ACID',
        difficulty: 'medium',
        title: 'Bank Transaction Processor',
        description: `Simulate a simple bank account system with basic transactions.

Operations:
- \`CREATE id balance\` — create account with initial balance
- \`DEPOSIT id amount\` — add amount to account
- \`WITHDRAW id amount\` — subtract amount (print \`INSUFFICIENT\` if balance < amount)
- \`TRANSFER from to amount\` — move amount between accounts (print \`INSUFFICIENT\` if from balance < amount)
- \`BALANCE id\` — print current balance
- \`STATEMENT id\` — print total deposited and total withdrawn for that account

**Input:**
- Line 1: q (operations)
- Next q lines: one operation

**Output:** One line per BALANCE, STATEMENT, WITHDRAW failure, TRANSFER failure.`,
        constraints: ['1 ≤ q ≤ 1000', 'All IDs are strings, amounts are positive integers ≤ 10^9'],
        examples: [
            { input: '6\nCREATE acc1 1000\nDEPOSIT acc1 500\nWITHDRAW acc1 200\nBALANCE acc1\nWITHDRAW acc1 2000\nSTATEMENT acc1', output: '1300\nINSUFFICIENT\nDeposited: 500 Withdrawn: 200' },
        ],
        starterCode: {
            python: `import sys
input = sys.stdin.readline

q = int(input())
accounts = {}  # id -> balance
deposits = {}
withdrawals = {}

for _ in range(q):
    parts = input().split()
    op = parts[0]
    if op == 'CREATE':
        _, aid, bal = parts
        accounts[aid] = int(bal)
        deposits[aid] = 0
        withdrawals[aid] = 0
    elif op == 'DEPOSIT':
        _, aid, amt = parts
        accounts[aid] += int(amt)
        deposits[aid] += int(amt)
    elif op == 'WITHDRAW':
        _, aid, amt = parts[0], parts[1], int(parts[2])
        if accounts[aid] < amt:
            print("INSUFFICIENT")
        else:
            accounts[aid] -= amt
            withdrawals[aid] += amt
    elif op == 'TRANSFER':
        _, frm, to, amt = parts[0], parts[1], parts[2], int(parts[3])
        if accounts[frm] < amt:
            print("INSUFFICIENT")
        else:
            accounts[frm] -= amt
            accounts[to] += amt
            withdrawals[frm] += amt
            deposits[to] += amt
    elif op == 'BALANCE':
        print(accounts[parts[1]])
    elif op == 'STATEMENT':
        aid = parts[1]
        print(f"Deposited: {deposits[aid]} Withdrawn: {withdrawals[aid]}")
`,
            javascript: `const lines=require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const q=parseInt(lines[0]);
const bal={},dep={},wd={};const out=[];
for(let i=1;i<=q;i++){const p=lines[i].split(' ');const op=p[0];
    if(op==='CREATE'){bal[p[1]]=+p[2];dep[p[1]]=0;wd[p[1]]=0;}
    else if(op==='DEPOSIT'){bal[p[1]]+=+p[2];dep[p[1]]+=+p[2];}
    else if(op==='WITHDRAW'){if(bal[p[1]]<+p[2])out.push('INSUFFICIENT');else{bal[p[1]]-=+p[2];wd[p[1]]+=+p[2];}}
    else if(op==='TRANSFER'){if(bal[p[1]]<+p[3])out.push('INSUFFICIENT');else{bal[p[1]]-=+p[3];bal[p[2]]+=+p[3];wd[p[1]]+=+p[3];dep[p[2]]+=+p[3];}}
    else if(op==='BALANCE')out.push(bal[p[1]]);
    else if(op==='STATEMENT')out.push('Deposited: '+dep[p[1]]+' Withdrawn: '+wd[p[1]]);
}
console.log(out.join('\\n'));
`,
            java: `import java.util.*;import java.io.*;
public class Main{public static void main(String[] a) throws Exception{
    BufferedReader br=new BufferedReader(new InputStreamReader(System.in));int q=Integer.parseInt(br.readLine());
    Map<String,Long>bal=new HashMap<>(),dep=new HashMap<>(),wd=new HashMap<>();StringBuilder sb=new StringBuilder();
    while(q-->0){StringTokenizer st=new StringTokenizer(br.readLine());String op=st.nextToken();
        if(op.equals("CREATE")){String id=st.nextToken();long b=Long.parseLong(st.nextToken());bal.put(id,b);dep.put(id,0L);wd.put(id,0L);}
        else if(op.equals("DEPOSIT")){String id=st.nextToken();long amt=Long.parseLong(st.nextToken());bal.merge(id,amt,Long::sum);dep.merge(id,amt,Long::sum);}
        else if(op.equals("WITHDRAW")){String id=st.nextToken();long amt=Long.parseLong(st.nextToken());if(bal.get(id)<amt)sb.append("INSUFFICIENT\n");else{bal.merge(id,-amt,Long::sum);wd.merge(id,amt,Long::sum);}}
        else if(op.equals("TRANSFER")){String f=st.nextToken(),t=st.nextToken();long amt=Long.parseLong(st.nextToken());if(bal.get(f)<amt)sb.append("INSUFFICIENT\n");else{bal.merge(f,-amt,Long::sum);bal.merge(t,amt,Long::sum);wd.merge(f,amt,Long::sum);dep.merge(t,amt,Long::sum);}}
        else if(op.equals("BALANCE"))sb.append(bal.get(st.nextToken())).append('\n');
        else if(op.equals("STATEMENT")){String id=st.nextToken();sb.append("Deposited: "+dep.get(id)+" Withdrawn: "+wd.get(id)+"\n");}
    }
    System.out.print(sb);
}}
`,
            cpp: `#include <bits/stdc++.h>
using namespace std;
int main(){
    int q;cin>>q;
    map<string,long long>bal,dep,wd;vector<string>out;
    while(q--){string op;cin>>op;
        if(op=="CREATE"){string id;long long b;cin>>id>>b;bal[id]=b;dep[id]=0;wd[id]=0;}
        else if(op=="DEPOSIT"){string id;long long a;cin>>id>>a;bal[id]+=a;dep[id]+=a;}
        else if(op=="WITHDRAW"){string id;long long a;cin>>id>>a;if(bal[id]<a)out.push_back("INSUFFICIENT");else{bal[id]-=a;wd[id]+=a;}}
        else if(op=="TRANSFER"){string f,t;long long a;cin>>f>>t>>a;if(bal[f]<a)out.push_back("INSUFFICIENT");else{bal[f]-=a;bal[t]+=a;wd[f]+=a;dep[t]+=a;}}
        else if(op=="BALANCE"){string id;cin>>id;out.push_back(to_string(bal[id]));}
        else if(op=="STATEMENT"){string id;cin>>id;out.push_back("Deposited: "+to_string(dep[id])+" Withdrawn: "+to_string(wd[id]));}
    }
    for(auto&s:out)cout<<s<<"\\n";
}
`,
        },
        testCases: [
            { id: 'tc-db-002-1', stdin: '6\nCREATE acc1 1000\nDEPOSIT acc1 500\nWITHDRAW acc1 200\nBALANCE acc1\nWITHDRAW acc1 2000\nSTATEMENT acc1', expectedOutput: '1300\nINSUFFICIENT\nDeposited: 500 Withdrawn: 200', isHidden: false },
            { id: 'tc-db-002-2', stdin: '4\nCREATE a 500\nCREATE b 200\nTRANSFER a b 600\nBALANCE a', expectedOutput: 'INSUFFICIENT\n500', isHidden: true },
        ],
        roles: ['backend-engineer', 'software-engineer', 'data-analyst'],
        timeSeconds: 1800,
    },

    {
        id: 'cp-db-003',
        domain: 'dbms',
        topic: 'Query Optimisation',
        difficulty: 'hard',
        title: 'Index Analyser',
        description: `Simulate a **column index** on a dataset. Given rows of integer data and a series of range queries, efficiently answer each query.

A range query \`L R\` asks: how many values in the column satisfy \`L ≤ value ≤ R\`?

**Input:**
- Line 1: n (rows), q (queries)
- Line 2: n space-separated integers (the indexed column)
- Next q lines: \`L R\`

**Output:** q lines, one count per query.`,
        constraints: ['1 ≤ n, q ≤ 10^5', '-10^9 ≤ values, L, R ≤ 10^9'],
        examples: [
            { input: '6 3\n3 1 4 1 5 9\n1 4\n5 9\n2 8', output: '4\n2\n2' },
        ],
        starterCode: {
            python: `import sys
from bisect import bisect_left, bisect_right

input = sys.stdin.readline
n, q = map(int, input().split())
col = sorted(map(int, input().split()))

for _ in range(q):
    l, r = map(int, input().split())
    print(bisect_right(col, r) - bisect_left(col, l))
`,
            javascript: `const data=require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const[n,q]=data[0].split(' ').map(Number);
const col=data[1].split(' ').map(Number).sort((a,b)=>a-b);
function lb(arr,v){let lo=0,hi=arr.length;while(lo<hi){const m=(lo+hi)>>1;if(arr[m]<v)lo=m+1;else hi=m;}return lo;}
function ub(arr,v){let lo=0,hi=arr.length;while(lo<hi){const m=(lo+hi)>>1;if(arr[m]<=v)lo=m+1;else hi=m;}return lo;}
const out=[];for(let i=0;i<q;i++){const[l,r]=data[2+i].split(' ').map(Number);out.push(ub(col,r)-lb(col,l));}
console.log(out.join('\\n'));
`,
            java: `import java.util.*;import java.io.*;
public class Main{
    static int lowerBound(int[]a,int v){int lo=0,hi=a.length;while(lo<hi){int m=(lo+hi)/2;if(a[m]<v)lo=m+1;else hi=m;}return lo;}
    static int upperBound(int[]a,int v){int lo=0,hi=a.length;while(lo<hi){int m=(lo+hi)/2;if(a[m]<=v)lo=m+1;else hi=m;}return lo;}
    public static void main(String[] a) throws Exception{
        BufferedReader br=new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st=new StringTokenizer(br.readLine());int n=Integer.parseInt(st.nextToken()),q=Integer.parseInt(st.nextToken());
        int[]col=new int[n];st=new StringTokenizer(br.readLine());for(int i=0;i<n;i++)col[i]=Integer.parseInt(st.nextToken());
        Arrays.sort(col);StringBuilder sb=new StringBuilder();
        while(q-->0){st=new StringTokenizer(br.readLine());int l=Integer.parseInt(st.nextToken()),r=Integer.parseInt(st.nextToken());sb.append(upperBound(col,r)-lowerBound(col,l)).append('\n');}
        System.out.print(sb);
    }
}
`,
            cpp: `#include <bits/stdc++.h>
using namespace std;
int main(){
    ios_base::sync_with_stdio(false);cin.tie(NULL);
    int n,q;cin>>n>>q;vector<int>col(n);for(auto&x:col)cin>>x;sort(col.begin(),col.end());
    while(q--){int l,r;cin>>l>>r;
        cout<<(upper_bound(col.begin(),col.end(),r)-lower_bound(col.begin(),col.end(),l))<<"\\n";
    }
}
`,
        },
        testCases: [
            { id: 'tc-db-003-1', stdin: '6 3\n3 1 4 1 5 9\n1 4\n5 9\n2 8', expectedOutput: '4\n2\n2', isHidden: false },
            { id: 'tc-db-003-2', stdin: '5 2\n10 20 30 40 50\n15 35\n1 100', expectedOutput: '2\n5', isHidden: false },
            { id: 'tc-db-003-3', stdin: '3 2\n-5 0 5\n-10 -1\n0 5', expectedOutput: '1\n2', isHidden: true },
        ],
        roles: ['backend-engineer', 'data-analyst', 'software-engineer'],
        timeSeconds: 1800,
    },
];

/** Get coding problems for a given domain */
export function getCodingProblemsForDomain(
    domain: import('../types/domain').AssessmentDomain,
    count = 3
): CodingProblem[] {
    const pool = CODING_PROBLEMS.filter(p => p.domain === domain);
    // Shuffle and take `count`
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}
