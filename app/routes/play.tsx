import { useState } from "react";
import { Form, redirect, useActionData, useLoaderData, Link } from "react-router";
import type { Route } from "./+types/play";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { readStore, isSaveDisabled } from "~/storage/safe-storage";
import { create, CapReachedError } from "~/storage/session-store";
import type { Difficulty } from "~/engine/types";

export function clientLoader() {
  const store = readStore();
  return {
    lastDifficulty: store.settings.lastDifficulty,
    saveDisabled: isSaveDisabled(),
  };
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const passage = (formData.get("passage") as string | null) ?? "";
  const difficulty = (formData.get("difficulty") as Difficulty | null) ?? "medium";

  if (!passage.trim()) {
    return { error: "empty_passage", passage, difficulty };
  }

  try {
    const session = await create({ practiceText: passage, difficulty });
    return redirect(`/play/${session.id}`);
  } catch (err) {
    if (err instanceof CapReachedError) {
      return { error: "cap_reached", passage, difficulty };
    }
    throw err;
  }
}

export default function Play() {
  const { lastDifficulty, saveDisabled } = useLoaderData<typeof clientLoader>();
  const actionData = useActionData<typeof clientAction>();

  const currentPassage =
    actionData && "passage" in actionData ? actionData.passage : "";
  const defaultDifficulty: Difficulty =
    actionData && "difficulty" in actionData
      ? actionData.difficulty
      : lastDifficulty;

  const [difficulty, setDifficulty] = useState<Difficulty>(defaultDifficulty);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Blanko</h1>

      {saveDisabled && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Sessions will not be saved</AlertTitle>
          <AlertDescription>
            Your browser is not allowing saved sessions. This round will play
            through but will not be saved.
          </AlertDescription>
        </Alert>
      )}

      {actionData?.error === "cap_reached" && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Too many sessions</AlertTitle>
          <AlertDescription>
            You have reached the 20-session limit. Finish or delete an existing
            session before starting a new one.{" "}
            <Link to="/sessions" className="underline">
              View sessions
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {actionData?.error === "no_eligible_words" && (
        <Alert className="mb-4">
          <AlertTitle>No eligible words</AlertTitle>
          <AlertDescription>
            The passage does not have enough words at this difficulty level.{" "}
            <Form method="post" className="inline">
              <input type="hidden" name="passage" value={currentPassage} />
              <input type="hidden" name="difficulty" value="easy" />
              <button type="submit" className="underline">
                Try Easy instead
              </button>
            </Form>
          </AlertDescription>
        </Alert>
      )}

      <Form method="post" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="passage">Paste a passage in your target language</Label>
          <Textarea
            id="passage"
            name="passage"
            placeholder="Paste your text here…"
            rows={6}
            defaultValue={currentPassage}
          />
        </div>

        <input type="hidden" name="difficulty" value={difficulty} />

        <div className="space-y-2" role="group" aria-labelledby="difficulty-label">
          <Label id="difficulty-label">Difficulty</Label>
          <ToggleGroup
            defaultValue={[defaultDifficulty]}
            onValueChange={(vals) => {
              const v = vals[0] as Difficulty | undefined;
              if (v) setDifficulty(v);
            }}
            className="justify-start"
          >
            <ToggleGroupItem value="easy" role="radio" aria-label="Easy">
              Easy
            </ToggleGroupItem>
            <ToggleGroupItem value="medium" role="radio" aria-label="Medium">
              Medium
            </ToggleGroupItem>
            <ToggleGroupItem value="hard" role="radio" aria-label="Hard">
              Hard
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <Button type="submit">Start round</Button>
      </Form>

      <div className="mt-4">
        <Link to="/sessions" className="text-sm text-muted-foreground underline">
          View saved sessions
        </Link>
      </div>
    </div>
  );
}
