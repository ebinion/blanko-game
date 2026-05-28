import { useLoaderData, Link } from "react-router";
import type { Route } from "./+types/sessions";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import { list, remove } from "~/storage/session-store";
import { isSaveDisabled } from "~/storage/safe-storage";

export function clientLoader() {
  return { sessions: list(), saveDisabled: isSaveDisabled() };
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  if (intent === "delete") {
    const sessionId = formData.get("sessionId") as string;
    remove(sessionId);
    toast.success("Session deleted");
  }
  return null;
}

export default function Sessions() {
  const { sessions, saveDisabled } = useLoaderData<typeof clientLoader>();

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Saved Sessions</h1>

      {saveDisabled && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Sessions will not be saved</AlertTitle>
          <AlertDescription>
            Your browser is not allowing saved sessions. New sessions will not persist.
          </AlertDescription>
        </Alert>
      )}

      {sessions.length === 0 ? (
        <Alert className="mb-4">
          <AlertTitle>No sessions yet</AlertTitle>
          <AlertDescription>
            <Button nativeButton={false} render={<Link to="/play" />} className="mt-2">
              Start your first round
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <ul className="space-y-3">
          {sessions.map((session) => (
            <li key={session.id}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{session.label}</CardTitle>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary" className="capitalize">
                      {session.difficulty}
                    </Badge>
                    <Badge variant="secondary">
                      {session.status === "in_progress"
                        ? "In progress"
                        : `Completed: ${session.result?.score.correct ?? 0}/${session.result?.score.total ?? 0}`}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex gap-2 pt-0">
                  <Button
                    size="sm"
                    render={
                      <Link
                        to={
                          session.status === "in_progress"
                            ? `/play/${session.id}`
                            : `/results/${session.id}`
                        }
                      />
                    }
                  >
                    {session.status === "in_progress" ? "Resume" : "Review"}
                  </Button>
                  <form method="post">
                    <input type="hidden" name="intent" value="delete" />
                    <input type="hidden" name="sessionId" value={session.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Delete
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
