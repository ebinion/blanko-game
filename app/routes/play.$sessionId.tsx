import { useState } from 'react'
import { redirect, useFetcher, useLoaderData } from 'react-router'
import type { Route } from './+types/play.$sessionId'
import { Button } from '~/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { PassageView } from '~/components/passage-view'
import { get, update } from '~/storage/session-store'
import { scoreSession } from '~/engine/score'
import { isSaveDisabled } from '~/storage/safe-storage'

export function clientLoader({ params }: Route.ClientLoaderArgs) {
  const session = get(params.sessionId)
  if (!session || session.status === 'completed') {
    return redirect('/sessions')
  }
  return { session, saveDisabled: isSaveDisabled() }
}

export async function clientAction({
  request,
  params,
}: Route.ClientActionArgs) {
  const formData = await request.formData()
  const intent = formData.get('intent') as string

  if (intent === 'save_answer') {
    const blankId = formData.get('blankId') as string
    const value = formData.get('value') as string
    const session = get(params.sessionId)
    if (session) {
      update(session.id, {
        answers: { ...session.answers, [blankId]: value },
      })
    }
    return null
  }

  if (intent === 'submit') {
    const session = get(params.sessionId)
    if (!session) return redirect('/sessions')
    const result = scoreSession(session)
    update(session.id, { status: 'completed', result })
    return redirect(`/results/${session.id}`)
  }

  return null
}

export default function PlaySession() {
  const { session, saveDisabled } = useLoaderData<typeof clientLoader>()
  const fetcher = useFetcher()

  // Local state so controlled inputs update immediately on each keystroke.
  // Initialized from persisted answers so resuming a session pre-fills blanks.
  const [answers, setAnswers] = useState<Record<string, string>>(
    session.answers,
  )

  function handleAnswerChange(blankId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [blankId]: value }))
  }

  function handleBlur(blankId: string, value: string) {
    // Persist to localStorage on blur so a closed tab can be resumed
    update(session.id, {
      answers: { ...session.answers, ...answers, [blankId]: value },
    })
    fetcher.submit(
      { intent: 'save_answer', blankId, value },
      { method: 'post' },
    )
  }

  function handleSubmit() {
    // Flush all current answers to storage before scoring
    update(session.id, { answers })
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8 lg:py-12">
      <div className="mb-8 border-b border-foreground/20 pb-6">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.08em] text-muted-foreground">
          Practice round
        </p>
        <h1 className="font-heading text-5xl font-semibold leading-tight sm:text-6xl">
          {session.label}
          <span className="text-primary">.</span>
        </h1>
        <p className="mt-4 inline-flex rounded-full border-2 border-foreground bg-primary px-4 py-1 text-sm font-semibold capitalize shadow-[0_2px_0_var(--foreground)]">
          {session.difficulty} difficulty
        </p>
      </div>

      {saveDisabled && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Sessions will not be saved</AlertTitle>
          <AlertDescription>
            Your browser is not allowing saved sessions. This round will play
            through but will not be saved.
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-8 rounded-3xl border-2 border-foreground bg-card p-5 shadow-[0_3px_0_var(--foreground)] sm:p-8">
        <PassageView
          session={session}
          answers={answers}
          onAnswerChange={handleAnswerChange}
          onBlur={handleBlur}
        />
      </div>

      <fetcher.Form method="post" onSubmit={handleSubmit}>
        <input type="hidden" name="intent" value="submit" />
        <Button type="submit" size="lg">
          Submit answers
        </Button>
      </fetcher.Form>
    </div>
  )
}
