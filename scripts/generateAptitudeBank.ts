import fs from 'fs';
import path from 'path';

type AptitudeCategory = 'quantitative' | 'logical' | 'verbal' | 'data_interpretation';

interface AptitudeQuestion {
    id: string;
    category: AptitudeCategory;
    difficulty: 'easy' | 'medium' | 'hard';
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    timeSeconds: number;
}

const questions: AptitudeQuestion[] = [];

// 1. Procedural Quantitative Questions (Train speed, time/work, percentage, SI)
for (let i = 0; i < 150; i++) {
    const len = 100 + Math.floor(Math.random() * 300); // 100 to 400m
    const sec = 10 + Math.floor(Math.random() * 20); // 10 to 30s
    const speed = (len / sec) * 3.6;
    
    questions.push({
        id: `gen-qa-${i}`,
        category: 'quantitative',
        difficulty: 'medium',
        question: `A train ${len} m long passes a pole in ${sec} seconds. What is its speed in km/h?`,
        options: [
            `${Math.round(speed - 5)} km/h`,
            `${Math.round(speed)} km/h`,
            `${Math.round(speed + 5)} km/h`,
            `${Math.round(speed + 10)} km/h`
        ].sort(() => Math.random() - 0.5),
        correctIndex: -1, // Set below after sort
        explanation: `Speed = ${len} / ${sec} m/s = ${(len/sec).toFixed(2)} m/s. In km/h: ${(len/sec).toFixed(2)} * 3.6 = ${speed.toFixed(2)} km/h.`,
        timeSeconds: 60
    });
    // Fix correct index
    const correctOpt = `${Math.round(speed)} km/h`;
    questions[questions.length - 1].correctIndex = questions[questions.length - 1].options.indexOf(correctOpt);
}

// 2. Procedural Logical Reasoning (Number series)
for (let i = 0; i < 150; i++) {
    const start = Math.floor(Math.random() * 10) + 1;
    const diff = Math.floor(Math.random() * 5) + 2;
    const series = [start, start + diff, start + diff * 2, start + diff * 3, start + diff * 4];
    const next = start + diff * 5;
    
    questions.push({
        id: `gen-lr-${i}`,
        category: 'logical',
        difficulty: 'easy',
        question: `Complete the series: ${series.join(', ')}, ?`,
        options: [
            `${next - diff}`,
            `${next}`,
            `${next + diff}`,
            `${next + diff * 2}`
        ].sort(() => Math.random() - 0.5),
        correctIndex: -1,
        explanation: `The series increases by a constant difference of ${diff}. ${series[series.length - 1]} + ${diff} = ${next}.`,
        timeSeconds: 30
    });
    questions[questions.length - 1].correctIndex = questions[questions.length - 1].options.indexOf(`${next}`);
}

// 3. Procedural Verbal Ability (Synonyms from a pool)
const vocab = [
    { w: 'ABUNDANT', s: 'Plentiful', o: ['Scarce', 'Rare', 'Minimal'] },
    { w: 'CANDID', s: 'Honest', o: ['Deceptive', 'Tricky', 'Secretive'] },
    { w: 'DILIGENT', s: 'Hardworking', o: ['Lazy', 'Careless', 'Slow'] },
    { w: 'ELATED', s: 'Overjoyed', o: ['Depressed', 'Sad', 'Angry'] },
    { w: 'LUCID', s: 'Clear', o: ['Confusing', 'Dark', 'Murky'] }
];
for (let i = 0; i < 150; i++) {
    const item = vocab[i % vocab.length];
    const opts = [item.s, ...item.o].sort(() => Math.random() - 0.5);
    questions.push({
        id: `gen-va-${i}`,
        category: 'verbal',
        difficulty: 'easy',
        question: `Choose the synonym of "${item.w}":`,
        options: opts,
        correctIndex: opts.indexOf(item.s),
        explanation: `The word '${item.w}' means ${item.s}.`,
        timeSeconds: 30
    });
}

// 4. Procedural Data Interpretation (Averages)
for (let i = 0; i < 100; i++) {
    const v1 = Math.floor(Math.random() * 50) + 50;
    const v2 = Math.floor(Math.random() * 50) + 50;
    const v3 = Math.floor(Math.random() * 50) + 50;
    const avg = Math.round((v1 + v2 + v3) / 3);
    
    questions.push({
        id: `gen-di-${i}`,
        category: 'data_interpretation',
        difficulty: 'medium',
        question: `A company's revenue for Q1, Q2, and Q3 were ${v1}M, ${v2}M, and ${v3}M respectively. What is the average quarterly revenue?`,
        options: [
            `${avg - 5}M`,
            `${avg}M`,
            `${avg + 5}M`,
            `${avg + 10}M`
        ].sort(() => Math.random() - 0.5),
        correctIndex: -1,
        explanation: `Average = (${v1} + ${v2} + ${v3}) / 3 = ${avg}M.`,
        timeSeconds: 45
    });
    questions[questions.length - 1].correctIndex = questions[questions.length - 1].options.indexOf(`${avg}M`);
}

const outputPath = path.join(process.cwd(), 'src', 'data', 'aptitudeDataExtra.json');
fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2));
console.log(`Generated ${questions.length} procedural aptitude questions at ${outputPath}`);
