export interface AptitudeQuestion {
  id: string;
  category: "Quantitative" | "Logical" | "Verbal" | "Technical" | "Behavioral";
  difficulty: "Easy" | "Medium" | "Hard";
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  source?: "static" | "procedural" | "cloud_ai";
}

// Lists of vocab words for Verbal questions
const VOCAB_WORDS = [
  { word: "BENEVOLENT", antonyms: ["Malevolent", "Cruel", "Spiteful"], synonyms: ["Generous", "Kind", "Charitable"], def: "well-meaning and kindly" },
  { word: "EPHEMERAL", antonyms: ["Permanent", "Eternal", "Enduring"], synonyms: ["Fleeting", "Transient", "Short-lived"], def: "lasting for a very short time" },
  { word: "SAGACIOUS", antonyms: ["Foolish", "Ignorant", "Daft"], synonyms: ["Wise", "Clever", "Astute"], def: "having or showing keen mental discernment and good judgment" },
  { word: "LOQUACIOUS", antonyms: ["Taciturn", "Silent", "Quiet"], synonyms: ["Talkative", "Garrulous", "Chatty"], def: "tending to talk a great deal; talkative" },
  { word: "PRAGMATIC", antonyms: ["Idealistic", "Impractical", "Visionary"], synonyms: ["Practical", "Realistic", "Sensible"], def: "dealing with things sensibly and realistically in a way that is based on practical rather than theoretical considerations" },
  { word: "ALACRITY", antonyms: ["Apathy", "Lethargy", "Reluctance"], synonyms: ["Eagerness", "Readiness", "Enthusiasm"], def: "brisk and cheerful readiness" },
  { word: "CAPRICIOUS", antonyms: ["Consistent", "Stable", "Predictable"], synonyms: ["Fickle", "Inconstant", "Volatile"], def: "given to sudden and unaccountable changes of mood or behavior" },
  { word: "MITIGATE", antonyms: ["Aggravate", "Intensify", "Worsen"], synonyms: ["Alleviate", "Reduce", "Diminish"], def: "make less severe, serious, or painful" }
];

// SQL questions parameters
const SQL_TABLES = ["Orders", "Employees", "Products", "Customers", "Transactions", "Subscribers"];
const SQL_COLUMNS = ["customer_id", "department_id", "category_id", "country_code", "status_flag", "store_id"];

// Behavioral templates
const BEHAVIORAL_SCENARIOS = [
  {
    topic: "Technical design disagreement",
    question: "A colleague disagrees with your technical design proposal during a team review. Which response best exhibits high emotional intelligence and teamwork?",
    options: [
      "Acknowledge their feedback, ask them to explain their perspective, and work together to compare structural trade-offs.",
      "Defend your design aggressively and point out potential flaws in their past work.",
      "Ignore their objections and appeal directly to the manager to override their opinion.",
      "Politely tell them that your proposal has already been approved and cannot be changed."
    ],
    answer: "Acknowledge their feedback, ask them to explain their perspective, and work together to compare structural trade-offs.",
    explanation: "High EQ in engineering involves seeking understanding, fostering collaboration, and objectifying decisions by evaluating design trade-offs together."
  },
  {
    topic: "Scope creep and deadlines",
    question: "Your project manager introduces a major feature addition just 3 days before a release deadline. What is the most professional response?",
    options: [
      "Accept the task quietly but work overnight, risking burnout and bugs.",
      "Refuse the task outright and accuse the project manager of poor planning.",
      "Assess the implementation complexity, present the team capacity trade-offs, and suggest either pushing the release date or phase-two scheduling.",
      "Complain to senior leadership about the lack of process and refuse to ship the original build."
    ],
    answer: "Assess the implementation complexity, present the team capacity trade-offs, and suggest either pushing the release date or phase-two scheduling.",
    explanation: "Professional software development requires objective communication about capacity constraints, presenting clear options, and managing stakeholder expectations constructively."
  },
  {
    topic: "Production bug emergency",
    question: "A severe bug is discovered in production that was caused by a commit you pushed. What should be your immediate action?",
    options: [
      "Quietly commit a hotfix under a different branch name to avoid blame.",
      "Immediately notify the team, help triage and roll back or patch the bug, and conduct a post-mortem to prevent future occurrences.",
      "Blame the QA team for not catching the issue before release.",
      "Argue that it is an edge case and not worth rushing a fix for."
    ],
    answer: "Immediately notify the team, help triage and roll back or patch the bug, and conduct a post-mortem to prevent future occurrences.",
    explanation: "Accountability and speed of mitigation are critical during production incidents. Owning the mistake and leading the recovery builds team trust."
  }
];

function generateDynamicAptitudeQuestionInternal(
  category: "Quantitative" | "Logical" | "Verbal" | "Technical" | "Behavioral",
  difficulty: "Easy" | "Medium" | "Hard"
): AptitudeQuestion {
  const uniqueId = `dyn-apt-${category.toLowerCase().slice(0,3)}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  switch (category) {
    case "Quantitative": {
      // 1. Time, Speed and Distance
      if (Math.random() > 0.5) {
        const speedKmh = [45, 60, 72, 90, 108][Math.floor(Math.random() * 5)];
        const timeSec = [9, 12, 15, 18, 20, 24][Math.floor(Math.random() * 6)];
        const speedMs = (speedKmh * 5) / 18;
        const length = speedMs * timeSec;

        const fakeLengths = [
          length - 30,
          length + 30,
          Math.round(speedKmh * timeSec),
          length + 50
        ].map(val => `${val} meters`);
        
        // Ensure correct answer is in options
        const correctAnswerStr = `${length} meters`;
        const optionsSet = new Set(fakeLengths);
        optionsSet.delete(correctAnswerStr);
        const optionsList = Array.from(optionsSet).slice(0, 3);
        optionsList.push(correctAnswerStr);
        optionsList.sort(() => 0.5 - Math.random());

        return {
          id: uniqueId,
          category,
          difficulty,
          question: `A train running at the speed of ${speedKmh} km/hr crosses a static utility pole in exactly ${timeSec} seconds. What is the length of the train?`,
          options: optionsList,
          answer: correctAnswerStr,
          explanation: `First convert speed to meters per second: Speed in m/s = ${speedKmh} * (5/18) = ${speedMs.toFixed(2)} m/s. The distance covered by the train to cross the pole is equal to its own length. Therefore, Length = Speed * Time = ${speedMs.toFixed(2)} * ${timeSec} = ${length} meters.`
        };
      } else {
        // 2. Compound Interest doubling
        const years = [8, 10, 12, 15, 20][Math.floor(Math.random() * 5)];
        const timesMultiplier = [4, 8, 16][Math.floor(Math.random() * 3)];
        // timesMultiplier = 2^power
        const power = Math.log2(timesMultiplier);
        const finalYears = years * power;

        const fakeYears = [
          years * 2,
          years * 3,
          finalYears - 5,
          finalYears + 5,
          finalYears
        ].filter(val => val > 0 && val !== years);
        
        const correctAnswerStr = `${finalYears} years`;
        const optionsSet = new Set(fakeYears.map(v => `${v} years`));
        optionsSet.delete(correctAnswerStr);
        const optionsList = Array.from(optionsSet).slice(0, 3);
        optionsList.push(correctAnswerStr);
        optionsList.sort(() => 0.5 - Math.random());

        return {
          id: uniqueId,
          category,
          difficulty,
          question: `A sum of money at compound interest doubles (2x) itself in ${years} years. In how many years will it accumulate to become ${timesMultiplier} times of itself?`,
          options: optionsList,
          answer: correctAnswerStr,
          explanation: `Using the compound interest formula, the sum becomes 2 times in ${years} years. To become ${timesMultiplier} (${timesMultiplier} = 2^${power}) times, the time required is ${power} * ${years} = ${finalYears} years.`
        };
      }
    }

    case "Logical": {
      if (Math.random() > 0.5) {
        // Number Series
        const multiplier = [2, 3][Math.floor(Math.random() * 2)];
        const start = [3, 4, 5, 6][Math.floor(Math.random() * 4)];
        
        const seq = [start];
        for (let i = 0; i < 5; i++) {
          const nextVal = seq[seq.length - 1] * multiplier + (i + 1);
          seq.push(nextVal);
        }
        
        const sequenceStr = seq.slice(0, 5).join(", ") + ", ___";
        const answer = seq[5].toString();
        
        const fakeAnswers = [
          seq[5] - 5,
          seq[5] + 5,
          seq[4] * multiplier,
          seq[5]
        ].map(v => v.toString());

        const optionsSet = new Set(fakeAnswers);
        const optionsList = Array.from(optionsSet).slice(0, 4);
        if (optionsList.length < 4) optionsList.push((seq[5] + 10).toString());
        optionsList.sort(() => 0.5 - Math.random());

        return {
          id: uniqueId,
          category,
          difficulty,
          question: `Identify the missing term that logically completes the numerical sequence: ${sequenceStr}.`,
          options: optionsList,
          answer,
          explanation: `The progression rule is: (Previous Term * ${multiplier}) + K, where K is an incrementing step index (+1, +2, +3...). Working out the terms: ` +
            seq.map((v, i) => i === 0 ? "" : `${seq[i-1]}*${multiplier}+${i}=${v}`).filter(Boolean).join("; ") + "."
        };
      } else {
        // Circular Sitting
        const names = ["A", "B", "C", "D", "E", "F"];
        const rightPerson = "D";
        return {
          id: uniqueId,
          category,
          difficulty,
          question: `Six friends (A, B, C, D, E, F) sit in a circle facing the center. F is seated directly to A's left. B sits opposite E. C sits between A and B. Who must be sitting directly to F's right?`,
          options: ["A", "B", "D", "E"],
          answer: rightPerson,
          explanation: `Plotting the circular nodes: F is left of A. C is between A and B. B sits opposite E. This leaves D to sit in the only remaining slot between E and F. Since all face the center, D is to the immediate right of F.`
        };
      }
    }

    case "Verbal": {
      const selection = VOCAB_WORDS[Math.floor(Math.random() * VOCAB_WORDS.length)];
      const antonymMode = Math.random() > 0.5;

      const questionText = antonymMode 
        ? `Select the word that is most opposite in meaning (Antonym) to '${selection.word}':`
        : `Select the word that is most similar in meaning (Synonym) to '${selection.word}':`;

      const correctAnswer = antonymMode ? selection.antonyms[0] : selection.synonyms[0];
      const wrongPool = antonymMode ? selection.synonyms.concat([selection.def]) : selection.antonyms.concat([selection.def]);

      const optionsList = [correctAnswer, ...wrongPool.slice(0, 3)];
      optionsList.sort(() => 0.5 - Math.random());

      return {
        id: uniqueId,
        category,
        difficulty,
        question: questionText,
        options: optionsList,
        answer: correctAnswer,
        explanation: `'${selection.word}' is defined as: "${selection.def}". Therefore, its primary ${antonymMode ? "antonym" : "synonym"} is '${correctAnswer}'.`
      };
    }

    case "Technical": {
      const typeRand = Math.random();
      if (typeRand < 0.33) {
        // SQL query
        const table = SQL_TABLES[Math.floor(Math.random() * SQL_TABLES.length)];
        const column = SQL_COLUMNS[Math.floor(Math.random() * SQL_COLUMNS.length)];
        const idVal = [101, 102, 201, 505][Math.floor(Math.random() * 4)];

        const correctAnswer = `SELECT COUNT(*) FROM ${table} WHERE ${column} = ${idVal};`;
        const options = [
          correctAnswer,
          `SELECT SUM(*) FROM ${table} WHERE ${column} = ${idVal};`,
          `SELECT COUNT(${column}) FROM ${table} GROUP BY ${column} = ${idVal};`,
          `SELECT COUNT(*) FROM ${table} HAVING ${column} = ${idVal};`
        ];
        options.sort(() => 0.5 - Math.random());

        return {
          id: uniqueId,
          category,
          difficulty,
          question: `In a standard relational database, which SQL query retrieves the exact total count of rows from table '${table}' where '${column}' equals ${idVal}?`,
          options,
          answer: correctAnswer,
          explanation: `COUNT(*) is the standard and highly optimized function for calculating total rows. A simple WHERE clause efficiently filters rows by '${column} = ${idVal}' before performing the count.`
        };
      } else if (typeRand < 0.66) {
        // Unbalanced BST
        return {
          id: uniqueId,
          category,
          difficulty,
          question: `What is the worst-case time complexity of searching an element in a binary search tree (BST) that is completely unbalanced (skewed)?`,
          options: ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
          answer: "O(N)",
          explanation: "In an unbalanced/skewed BST, the tree structure collapses into a linear linked list. To search an element, we may have to traverse all N elements, making the worst-case time complexity O(N)."
        };
      } else {
        // Recursion snippet generator
        const baseVal = [1, 2][Math.floor(Math.random() * 2)];
        const step = [1, 2][Math.floor(Math.random() * 2)];
        const mult = [2, 3][Math.floor(Math.random() * 2)];
        const queryVal = step === 1 ? 3 : 5;

        // fn(queryVal) calculation
        // fn(n) { if (n <= 1) return baseVal; return n * fn(n - step); }
        // For step = 1: queryVal = 3 -> fn(3) = 3 * fn(2) = 3 * (2 * fn(1)) = 3 * 2 * baseVal = 6 * baseVal
        // For step = 2: queryVal = 5 -> fn(5) = 5 * fn(3) = 5 * (3 * fn(1)) = 15 * baseVal
        let ansVal = 0;
        if (step === 1) {
          ansVal = 3 * 2 * baseVal;
        } else {
          ansVal = 5 * 3 * baseVal;
        }

        const answerStr = ansVal.toString();
        const fakeVals = [
          ansVal - baseVal,
          ansVal + baseVal,
          ansVal * 2,
          ansVal
        ].map(v => v.toString());

        const optionsSet = new Set(fakeVals);
        const optionsList = Array.from(optionsSet).slice(0, 4);
        if (optionsList.length < 4) optionsList.push((ansVal + 12).toString());
        optionsList.sort(() => 0.5 - Math.random());

        return {
          id: uniqueId,
          category,
          difficulty,
          question: `Analyze this recursion snippet: \`int fn(int n) { if (n <= 1) return ${baseVal}; return n * fn(n - ${step}); }\`. What is the evaluated output of \`fn(${queryVal})\`?`,
          options: optionsList,
          answer: answerStr,
          explanation: step === 1 
            ? `Tracing execution: fn(3) = 3 * fn(2). fn(2) = 2 * fn(1). Since n <= 1 evaluates to true at n=1, fn(1) returns ${baseVal}. Hence, fn(3) = 3 * 2 * ${baseVal} = ${ansVal}.`
            : `Tracing execution: fn(5) = 5 * fn(3). fn(3) = 3 * fn(1). Since n <= 1 evaluates to true at n=1, fn(1) returns ${baseVal}. Hence, fn(5) = 5 * 3 * ${baseVal} = ${ansVal}.`
        };
      }
    }

    case "Behavioral":
    default: {
      const item = BEHAVIORAL_SCENARIOS[Math.floor(Math.random() * BEHAVIORAL_SCENARIOS.length)];
      return {
        id: uniqueId,
        category,
        difficulty,
        question: item.question,
        options: item.options,
        answer: item.answer,
        explanation: item.explanation
      };
    }
  }
}

export function generateDynamicAptitudeQuestion(
  category: "Quantitative" | "Logical" | "Verbal" | "Technical" | "Behavioral",
  difficulty: "Easy" | "Medium" | "Hard"
): AptitudeQuestion {
  const q = generateDynamicAptitudeQuestionInternal(category, difficulty);
  q.source = "procedural";
  return q;
}

export async function generateCloudAptitudeQuestionsBatch(
  category: "Quantitative" | "Logical" | "Verbal" | "Technical" | "Behavioral",
  difficulty: "Easy" | "Medium" | "Hard",
  count: number = 5
): Promise<AptitudeQuestion[]> {
  // Free Serverless Endpoint with robust instruction model
  const modelUrl = "https://api-inference.huggingface.co/models/Qwen/Qwen2.5-Coder-7B-Instruct/v1/chat/completions";
  
  const systemPrompt = `You are a professional aptitude test author. Generate exactly ${count} diverse and highly realistic multiple-choice questions for the category "${category}" and difficulty "${difficulty}".
Each question must be challenging, unique, and strictly structured.
Respond ONLY with a valid JSON array of objects matching this TypeScript interface:
interface GeneratedQuestion {
  question: string;
  options: string[]; // exactly 4 unique choices
  answer: string; // must match exactly one of the options
  explanation: string; // detailed step-by-step reasoning
}`;

  const response = await fetch(modelUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate the ${count} questions now.` }
      ],
      temperature: 0.7,
      max_tokens: 2048
    })
  });

  if (!response.ok) {
    throw new Error(`Hugging Face API returned error: ${response.statusText}`);
  }

  const result = await response.json();
  const rawText = result.choices?.[0]?.message?.content || "";
  
  // Find JSON block in the response (handles wrapping in markdown blocks cleanly)
  const jsonStart = rawText.indexOf("[");
  const jsonEnd = rawText.lastIndexOf("]") + 1;
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("Invalid format received from AI model.");
  }
  
  const parsed = JSON.parse(rawText.slice(jsonStart, jsonEnd));
  if (!Array.isArray(parsed)) {
    throw new Error("AI did not return a valid array.");
  }

  return parsed.map((item: any, idx: number) => ({
    id: `dyn-apt-cloud-${category.toLowerCase().slice(0,3)}-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
    category,
    difficulty,
    question: item.question,
    options: item.options,
    answer: item.answer,
    explanation: item.explanation,
    source: "cloud_ai" as const
  }));
}
