import { getAuthSession } from "@/lib/nextauth";
import { NextResponse } from "next/server";
import { quizCreationSchema } from "@/schemas/form/quiz";
import { ZodError } from "zod";
import prisma from "@/lib/db";
import { generateQuestions } from "@/lib/generate-questions";

/* ===== TYPES ===== */
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

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { amount, topic, type } = quizCreationSchema.parse(body);

    // 1️⃣ Create game
    const game = await prisma.game.create({
      data: {
        gameType: type,
        timeStarted: new Date(),
        userId: session.user.id,
        topic,
      },
    });

    // 2️⃣ Generate questions
    const questions = await generateQuestions({ amount, topic, type });

    if (!Array.isArray(questions)) {
      throw new Error("Invalid questions response");
    }

    // 3️⃣ Save questions
    if (type === "mcq") {
      const manyData = (questions as McqQuestion[]).map((q) => {
        const options = [q.answer, q.option1, q.option2, q.option3].sort(
          () => Math.random() - 0.5
        );

        return {
          question: q.question,
          answer: q.answer,
          options,
          gameId: game.id,
          questionType: "mcq" as const,
        };
      });

      await prisma.question.createMany({ data: manyData });
    }

    if (type === "open_ended") {
      const manyData = (questions as OpenQuestion[]).map((q) => ({
        question: q.question,
        answer: q.answer,
        gameId: game.id,
        questionType: "open_ended" as const,
      }));

      await prisma.question.createMany({ data: manyData });
    }

    // 4️⃣ SUCCESS
    return NextResponse.json({ gameId: game.id });
  } catch (error) {
    console.error("/api/game error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
