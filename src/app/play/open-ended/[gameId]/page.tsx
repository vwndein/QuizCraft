import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/nextauth";
import { prisma } from "@/lib/db";
import OpenEnded from "@/components/OpenEnded";

type Props = {
  params: {
    gameId: string;
  };
};

const OpenEndedPage = async ({
  params,
}: {
  params: { gameId: string } | Promise<{ gameId: string }>;
}) => {
  const resolvedParams = await params;
  const { gameId } = resolvedParams;

  const session = await getAuthSession();
  if (!session?.user) {
    redirect("/");
  }

  if (!gameId) {
    redirect("/quiz");
  }

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      questions: { select: { id: true, question: true, answer: true } },
    },
  });

  if (!game || game.gameType !== "open_ended") {
    redirect("/quiz");
  }

  return <OpenEnded game={game} />;
};

export default OpenEndedPage;
