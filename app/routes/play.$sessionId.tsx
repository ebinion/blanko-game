import { redirect, useFetcher, useLoaderData } from "react-router";
import type { Route } from "./+types/play.$sessionId";
import { Button } from "~/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { PassageView } from "~/components/passage-view";
import { get, update } from "~/storage/session-store";
import { scoreSession } from "~/engine/score";
import { isSaveDisabled } from "~/storage/safe-storage";

export function clientLoader({ params }: Route.ClientLoaderArgs) {
  const session = get(params.sessionId);
  if (!session || session.status === "completed") {
    return redirect("/sessions");
  }
  return { session, saveDisabled: isSaveDisabled() };
}

export async function clientAction({ request, params }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "save_answer") {
    const blankId = formData.get("blankId") as string;
    const value = formData.get("value") as string;
    const session = get(params.sessionId);
    if (session) {
      update(session.id, {
        answers: { ...session.answers, [blankId]: value },
      });
    }
    return null;
  }

  if (intent === "submit") {
    const session = get(params.sessionId);
    if (!session) return redirect("/sessions");
    const result = scoreSession(session);
    update(session.id, { status: "completed", result });
    return redirect(`/results/${session.id}`);
  }

  return null;
}

export default function PlaySession() {
  const { session, saveDisabled } = useLoaderData<typeof clientLoader>();
  const fetcher = useFetcher();

  function handleAnswerChange(blankId: string, value: string) {
    update(session.id, {
      answers: { ...session.answers, [blankId]: value },
    });
  }

  function handleBlur(blankId: string, value: string) {
    fetcher.submit(
      { intent: "save_answer", blankId, value },
      { method: "post" }
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-semibold mb-2">{session.label}</h1>
      <p className="text-sm text-muted-foreground mb-6 capitalize">
        {session.difficulty} difficulty
      </p>

      {saveDisabled && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Sessions will not be saved</AlertTitle>
          <AlertDescription>
            Your browser is not allowing saved sessions. This round will play
            through but will not be saved.
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-6">
        <PassageView
          session={session}
          onAnswerChange={handleAnswerChange}
          onBlur={handleBlur}
        />
      </div>

      <fetcher.Form method="post">
        <input type="hidden" name="intent" value="submit" />
        <Button type="submit">Submit answers</Button>
      </fetcher.Form>
    </div>
  );
}
