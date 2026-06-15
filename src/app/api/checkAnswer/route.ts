import prisma from "@/lib/db";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { checkAnswerSchema } from "@/schemas/form/quiz";

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function calculateSimilarity(userAnswer: string, correctAnswer: string): number {
  const a = userAnswer.toLowerCase().trim();
  const b = correctAnswer.toLowerCase().trim();

  if (!a && !b) return 100;
  if (a === b) return 100;

  const maxLen = Math.max(a.length, b.length);
  const distance = levenshteinDistance(a, b);
  return Math.round((1 - distance / maxLen) * 100);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { questionId, userAnswer } = checkAnswerSchema.parse(body);

    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    if (question.questionType === "mcq") {
      const isCorrect =
        question.answer.toLowerCase().trim() ===
        userAnswer.toLowerCase().trim();

      await prisma.question.update({
        where: { id: questionId },
        data: { userAnswer, isCorrect },
      });

      return NextResponse.json({ isCorrect });
    }

    const percentageSimilar = calculateSimilarity(userAnswer, question.answer);

    await prisma.question.update({
      where: { id: questionId },
      data: {
        userAnswer,
        percentageCorrect: percentageSimilar,
        isCorrect: percentageSimilar >= 80,
      },
    });

    return NextResponse.json({ percentageSimilar });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
