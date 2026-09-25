import sys
import json
import re

# Comprehensive list of tech keywords to look for
TECH_DICTIONARY = set([
    "react", "react.js", "python", "java", "c++", "c#", "javascript", "typescript",
    "node", "node.js", "express", "django", "flask", "spring", "spring boot",
    "sql", "mysql", "postgresql", "mongodb", "nosql", "redis", "firebase",
    "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "ci/cd",
    "html", "css", "sass", "tailwind", "bootstrap", "git", "github", "bitbucket",
    "machine learning", "ai", "artificial intelligence", "data science",
    "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy",
    "golang", "rust", "ruby", "ruby on rails", "php", "laravel",
    "swift", "kotlin", "react native", "flutter", "dart",
    "graphql", "rest api", "linux", "bash", "shell", "powershell"
])

def parse_resume(text):
    text_lower = text.lower()
    
    # 1. Extract Skills (Keyword Matching)
    # Using regex to find word boundaries for accurate matching
    found_skills = set()
    for tech in TECH_DICTIONARY:
        # Escape special characters like ++ or .
        escaped_tech = re.escape(tech)
        if re.search(r'\b' + escaped_tech + r'\b', text_lower):
            found_skills.add(tech)
            
    # Normalize skill names (e.g., capitalize correctly)
    normalized_skills = [s.title() if len(s) > 3 else s.upper() for s in found_skills]
    # Specific fixes
    normalized_skills = ["Node.js" if s == "Node.Js" else s for s in normalized_skills]
    normalized_skills = ["React" if s == "React.Js" else s for s in normalized_skills]

    # 2. Extract Emails (Regex)
    email_match = re.search(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', text)
    email = email_match.group(0) if email_match else None

    # 3. Naive extraction of Name (usually first line or two)
    # Just grabbing the first non-empty line as a fallback name
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    name = lines[0] if lines else "Unknown Candidate"
    # Basic cleanup if email is in the name
    if '@' in name:
        name = "Candidate"

    # Construct the JSON matching the ParsedResume schema expected by the frontend
    result = {
        "profile": {
            "name": name,
            "headline": None,
            "bio": None,
            "location": None,
            "email": email,
            "githubUsername": None,
            "linkedinUrl": None,
            "portfolioUrl": None
        },
        "skills": list(normalized_skills),
        "projects": [
            # In a full NLP implementation (like spaCy), we would use Named Entity Recognition (NER)
            # to extract actual project blocks. For now, we return empty so the user can manually add them,
            # or we rely on the skill extraction which is the most critical part.
        ],
        "education": [],
        "experience": [],
        "certifications": []
    }
    
    return result

if __name__ == "__main__":
    # Read entire text from stdin
    input_text = sys.stdin.read()
    if not input_text.strip():
        print(json.dumps({"error": "No text provided"}))
        sys.exit(1)
        
    parsed_data = parse_resume(input_text)
    
    # Print JSON to stdout so Node.js can parse it
    print(json.dumps(parsed_data))
