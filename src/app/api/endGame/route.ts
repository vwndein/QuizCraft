import prisma from "@/lib/db";
import { getAuthSession } from "@/lib/nextauth";
import { endGameSchema } from "@/schemas/form/quiz";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { gameId } = endGameSchema.parse(body);

    const game = await prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game || game.userId !== session.user.id) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    await prisma.game.update({
      where: { id: gameId },
      data: { timeEnded: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    console.error("/api/endGame error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
