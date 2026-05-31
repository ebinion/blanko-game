import { useState } from 'react'
import {
  Form,
  redirect,
  useActionData,
  useLoaderData,
  Link,
} from 'react-router'
import type { Route } from './+types/play'
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/textarea'
import { Label } from '~/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { ToggleGroup, ToggleGroupItem } from '~/components/ui/toggle-group'
import { readStore, isSaveDisabled } from '~/storage/safe-storage'
import { create, CapReachedError } from '~/storage/session-store'
import type { Difficulty } from '~/engine/types'
import { Clipboard, Info, Pencil } from 'lucide-react'

export function clientLoader() {
  const store = readStore()
  return {
    lastDifficulty: store.settings.lastDifficulty,
    saveDisabled: isSaveDisabled(),
  }
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData()
  const passage = (formData.get('passage') as string | null) ?? ''
  const difficulty =
    (formData.get('difficulty') as Difficulty | null) ?? 'medium'

  if (!passage.trim()) {
    return { error: 'empty_passage', passage, difficulty }
  }

  try {
    const session = await create({ practiceText: passage, difficulty })
    return redirect(`/play/${session.id}`)
  } catch (err) {
    if (err instanceof CapReachedError) {
      return { error: 'cap_reached', passage, difficulty }
    }
    throw err
  }
}

export default function Play() {
  const { lastDifficulty, saveDisabled } = useLoaderData<typeof clientLoader>()
  const actionData = useActionData<typeof clientAction>()

  const currentPassage =
    actionData && 'passage' in actionData ? actionData.passage : ''
  const defaultDifficulty: Difficulty =
    actionData && 'difficulty' in actionData
      ? actionData.difficulty
      : lastDifficulty

  const [difficulty, setDifficulty] = useState<Difficulty>(defaultDifficulty)
  const difficultyOptions: {
    value: Difficulty
    title: string
    detail: string
    dots: number
  }[] = [
    {
      value: 'easy',
      title: 'Easy',
      detail: 'Fewer blanks\nShorter words',
      dots: 1,
    },
    {
      value: 'medium',
      title: 'Medium',
      detail: 'Balanced\nchallenge',
      dots: 2,
    },
    {
      value: 'hard',
      title: 'Hard',
      detail: 'More blanks\nLonger words',
      dots: 3,
    },
  ]

  return (
    <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:py-10">
      <section className="grid items-center gap-8 border-b border-foreground/20 pb-8 lg:grid-cols-[1.1fr_0.9fr] lg:pb-12">
        <div>
          <div className="mb-8 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-bold uppercase tracking-[0.08em] text-primary-foreground shadow-[0_2px_0_var(--foreground)]">
            Blanko Practice
          </div>
          <h1 className="font-heading text-7xl font-semibold leading-none tracking-tight sm:text-8xl lg:text-[8.5rem]">
            Blanko<span className="text-primary">.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-2xl leading-relaxed text-foreground/85">
            A fill-in-the-blank game to help you practice spelling and recall in
            your target language.
          </p>
        </div>
        <BlankoHeroArt />
      </section>

      <div className="mx-auto mt-8 max-w-5xl">
        {saveDisabled && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Sessions will not be saved</AlertTitle>
            <AlertDescription>
              Your browser is not allowing saved sessions. This round will play
              through but will not be saved.
            </AlertDescription>
          </Alert>
        )}

        {actionData?.error === 'cap_reached' && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Too many sessions</AlertTitle>
            <AlertDescription>
              You have reached the 20-session limit. Finish or delete an
              existing session before starting a new one.{' '}
              <Link to="/sessions" className="underline">
                View sessions
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {actionData?.error === 'no_eligible_words' && (
          <Alert className="mb-4">
            <AlertTitle>No eligible words</AlertTitle>
            <AlertDescription>
              The passage does not have enough words at this difficulty level.{' '}
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

        <Form method="post" className="grid gap-8 lg:grid-cols-[1fr_0.95fr]">
          <section className="space-y-4">
            <Label
              htmlFor="passage"
              className="text-base font-bold uppercase tracking-[0.06em]"
            >
              Paste a passage in your target language
            </Label>
            <div className="overflow-hidden rounded-2xl">
              <div className="grid grid-cols-2">
                <div className="flex items-center justify-center gap-2 rounded-tl-2xl border-2 border-b-0 border-foreground bg-primary px-4 py-3 text-sm font-semibold">
                  <Clipboard aria-hidden="true" className="size-4" /> Paste text
                </div>
                <div className="flex items-center justify-center gap-2 rounded-tr-2xl border-2 border-b-0 border-l-0 border-foreground bg-card px-4 py-3 text-sm font-semibold">
                  <Pencil aria-hidden="true" className="size-4" /> Type text
                </div>
              </div>
              <Textarea
                id="passage"
                name="passage"
                placeholder="Paste your text here…"
                rows={6}
                defaultValue={currentPassage}
                maxLength={5000}
              />
            </div>
            <p className="text-right text-sm text-muted-foreground">
              0 / 5,000
            </p>
          </section>

          <section
            className="space-y-4"
            role="group"
            aria-labelledby="difficulty-label"
          >
            <Label
              id="difficulty-label"
              className="text-base font-bold uppercase tracking-[0.06em]"
            >
              Difficulty selection
            </Label>
            <input type="hidden" name="difficulty" value={difficulty} />
            <ToggleGroup
              defaultValue={[defaultDifficulty]}
              onValueChange={(vals) => {
                const v = vals[0] as Difficulty | undefined
                if (v) setDifficulty(v)
              }}
              className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3"
            >
              {difficultyOptions.map((option) => (
                <ToggleGroupItem
                  key={option.value}
                  value={option.value}
                  role="radio"
                  aria-label={option.title}
                  variant="outline"
                  className="h-auto min-h-36 w-full flex-col gap-3 rounded-2xl px-5 py-5 text-center data-[state=on]:bg-primary"
                >
                  <span className="text-xl font-bold">{option.title}</span>
                  <span aria-hidden="true" className="flex gap-3">
                    {[0, 1, 2].map((dot) => (
                      <span
                        key={dot}
                        className={
                          dot < option.dots
                            ? 'size-3 rounded-full border border-foreground bg-primary'
                            : 'size-3 rounded-full border border-foreground/40 bg-muted'
                        }
                      />
                    ))}
                  </span>
                  <span className="whitespace-pre-line text-sm font-normal leading-relaxed text-foreground/80">
                    {option.detail}
                  </span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            <div className="flex items-center gap-3 rounded-full bg-muted px-4 py-3 text-sm text-foreground/80">
              <span className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-foreground bg-primary font-bold">
                <Info aria-hidden="true" className="size-4" />
              </span>
              You can change the difficulty anytime before starting.
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <Button type="submit" size="lg" aria-label="Start round">
                Start Game
              </Button>
              <Button
                nativeButton={false}
                variant="outline"
                size="lg"
                render={<Link to="/sessions" />}
              >
                View saved sessions
              </Button>
            </div>
          </section>
        </Form>
      </div>
    </div>
  )
}

function BlankoHeroArt() {
  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-sm"
      aria-hidden="true"
    >
      <div className="blanko-dots absolute bottom-8 left-6 h-16 w-64 -rotate-3 rounded-[50%] bg-destructive text-foreground/70" />
      <div className="absolute right-4 top-2 rounded-[1.5rem] border-4 border-foreground bg-card px-9 py-5 shadow-[0_6px_0_var(--foreground)]">
        <span className="font-heading text-6xl text-primary [-webkit-text-stroke:2px_var(--foreground)]">
          A
        </span>
        <span className="absolute -bottom-5 left-12 h-8 w-8 rotate-45 border-b-4 border-r-4 border-foreground bg-card" />
      </div>
      <div className="absolute bottom-16 left-12 right-10 space-y-2">
        <div className="h-20 -rotate-6 rounded-md border-4 border-foreground bg-card shadow-[0_4px_0_var(--foreground)]" />
        <div className="h-16 rotate-2 rounded-md border-4 border-foreground bg-primary shadow-[0_4px_0_var(--foreground)]" />
        <div className="h-16 -rotate-3 rounded-md border-4 border-foreground bg-card shadow-[0_4px_0_var(--foreground)]" />
      </div>
      <div className="absolute right-12 top-24 h-24 w-16 rounded-full bg-primary" />
      <div className="absolute right-20 top-30 h-20 w-12 rounded-full border-4 border-foreground bg-card" />
      <div className="absolute right-11 top-40 h-32 w-20 rounded-t-full border-4 border-foreground bg-card" />
      <div className="absolute right-16 top-56 h-24 w-14 rounded-full border-4 border-foreground bg-foreground" />
    </div>
  )
}
