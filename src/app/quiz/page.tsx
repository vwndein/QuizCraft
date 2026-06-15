import QuizCreation from "@/components/QuizCreation";
import { getAuthSession } from "@/lib/nextauth";
import { getQuizMeSuggestions } from "@/lib/quiz-me-suggestions";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Quiz - QuizCraft",
};

const QuizPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>;
}) => {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect("/");
  }

  const { source } = await searchParams;
  const fromQuizMe = source === "quiz-me";

  const suggestedDefaults =
    fromQuizMe && session.user.id
      ? await getQuizMeSuggestions(session.user.id)
      : null;

  return (
    <QuizCreation
      fromQuizMe={fromQuizMe}
      suggestedDefaults={suggestedDefaults}
    />
  );
};

export default QuizPage;
