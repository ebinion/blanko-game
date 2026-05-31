import { redirect, useLoaderData, Link } from 'react-router'
import type { Route } from './+types/results.$sessionId'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Badge } from '~/components/ui/badge'
import { Separator } from '~/components/ui/separator'
import { buttonVariants } from '~/components/ui/button'
import { cn } from '~/lib/utils'
import { XCircle } from 'lucide-react'
import { get } from '~/storage/session-store'

export function clientLoader({ params }: Route.ClientLoaderArgs) {
  const session = get(params.sessionId)
  if (!session) return redirect('/sessions')
  if (session.status !== 'completed') return redirect(`/play/${session.id}`)
  return { session }
}

export default function Results() {
  const { session } = useLoaderData<typeof clientLoader>()
  const { result } = session

  if (!result) return null

  const { score, incorrect } = result

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8 lg:py-12">
      <div className="mb-8 border-b border-foreground/20 pb-6">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.08em] text-muted-foreground">
          Round complete
        </p>
        <h1 className="font-heading text-6xl font-semibold leading-none sm:text-7xl">
          Results<span className="text-primary">.</span>
        </h1>
      </div>

      <Card role="status" aria-live="polite" className="mb-6 bg-primary">
        <CardHeader>
          <CardTitle className="font-heading text-5xl font-semibold">
            {score.correct} of {score.total} correct
          </CardTitle>
        </CardHeader>
      </Card>

      {incorrect.length === 0 ? (
        <Alert className="mb-6 border-2 border-foreground bg-card">
          <AlertTitle>Perfect score</AlertTitle>
          <AlertDescription>Nothing to review — well done!</AlertDescription>
        </Alert>
      ) : (
        <ul className="space-y-3 mb-6">
          {incorrect.map((entry) => (
            <li key={entry.blankId}>
              <Card>
                <CardContent className="pt-4 flex items-center gap-3 flex-wrap">
                  <span className="rounded-full bg-muted px-3 py-1 text-foreground/80">
                    {entry.userAnswer.trim() === ''
                      ? '(no answer)'
                      : entry.userAnswer}
                  </span>
                  <Separator orientation="vertical" className="h-5" />
                  <span className="rounded-full bg-primary px-3 py-1 font-semibold">
                    {entry.correctWord}
                  </span>
                  <Badge
                    variant="destructive"
                    className="ml-auto flex items-center gap-1 border border-foreground bg-destructive text-foreground"
                  >
                    <XCircle aria-hidden="true" className="h-3.5 w-3.5" />
                    Incorrect
                  </Badge>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-3">
        <Link to="/play" className={cn(buttonVariants())}>
          Start new round
        </Link>
        <Link
          to="/sessions"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Back to sessions
        </Link>
      </div>
    </div>
  )
}
