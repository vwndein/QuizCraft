import { strict_output } from "@/lib/groq";

type McqQuestion = {
  question: string;
  answer: string;
  option1: string;
  option2: string;
  option3: string;
};

type OpenQuestion = {
  question: string;
  answer: string;
};

const PLACEHOLDER_PATTERNS = [
  /max length of \d+ words/i,
  /^\d+(st|nd|rd|th) option/i,
  /^answer with/i,
  /^questions?$/i,
  /^<.*>$/,
];

function isPlaceholderText(text: string): boolean {
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(text.trim()));
}

function sanitizeQuestion<T extends Record<string, string>>(item: T): T {
  const cleaned = { ...item };
  for (const key of Object.keys(cleaned)) {
    if (isPlaceholderText(cleaned[key])) {
      throw new Error(`AI returned placeholder text for field "${key}"`);
    }
  }
  return cleaned;
}

export async function generateQuestions({
  amount,
  topic,
  type,
  pastQuestions,
}: {
  amount: number;
  topic: string;
  type: "mcq" | "open_ended";
  pastQuestions?: { question: string; answer: string }[];
}): Promise<McqQuestion[] | OpenQuestion[]> {
  const reviewNote =
    pastQuestions && pastQuestions.length > 0
      ? ` The user has studied this topic before. Do NOT repeat these questions: ${pastQuestions
          .map((q) => `"${q.question}"`)
          .join(", ")}.`
      : "";

  const userPrompts = Array.from(
    { length: amount },
    (_, i) =>
      `Generate unique question ${i + 1} of ${amount} about "${topic}".${reviewNote}`
  );

  if (type === "open_ended") {
    const questions = (await strict_output(
      "You are a quiz generator. Create challenging open-ended questions with concise correct answers (max 15 words each). Replace every <placeholder> in the JSON template with real quiz content. Never copy the placeholder text itself.",
      userPrompts,
      {
        question: "<the quiz question>",
        answer: "<the correct answer>",
      }
    )) as OpenQuestion[];

    return questions.map(sanitizeQuestion);
  }

  const questions = (await strict_output(
    "You are a quiz generator. Create multiple choice questions with one correct answer and three plausible wrong options (max 15 words each). Replace every <placeholder> in the JSON template with real quiz content. Never copy the placeholder text itself.",
    userPrompts,
    {
      question: "<the quiz question>",
      answer: "<the correct answer>",
      option1: "<a wrong answer option>",
      option2: "<a wrong answer option>",
      option3: "<a wrong answer option>",
    }
  )) as McqQuestion[];

  return questions.map(sanitizeQuestion);
}
