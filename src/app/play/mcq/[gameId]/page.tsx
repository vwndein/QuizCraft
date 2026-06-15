// app/play/mcq/[gameId]/page.tsx
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/nextauth";
import { prisma } from "@/lib/db";
import MCQ from "@/components/MCQ";

const MCQPage = async ({ params }: { params: Promise<{ gameId: string }> }) => {
  const { gameId } = await params; // ← await params

  const session = await getAuthSession();
  if (!session?.user) {
    redirect("/");
  }

  const game = await prisma.game.findUnique({
    where: {
      id: gameId,
    },
    include: {
      questions: {
        select: {
          id: true,
          question: true,
          options: true,
        },
      },
    },
  });

  if (!game || game.gameType !== "mcq" || game.questions.length === 0) {
    redirect("/quiz");
  }

  return <MCQ game={game} />;
};

export default MCQPage;
