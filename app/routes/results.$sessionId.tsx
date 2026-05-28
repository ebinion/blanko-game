import { redirect, useLoaderData, Link } from 'react-router'
import type { Route } from './+types/results.$sessionId'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Badge } from '~/components/ui/badge'
import { Separator } from '~/components/ui/separator'
import { Button } from '~/components/ui/button'
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
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Results</h1>

      <Card role="status" aria-live="polite" className="mb-6">
        <CardHeader>
          <CardTitle>
            {score.correct} of {score.total} correct
          </CardTitle>
        </CardHeader>
      </Card>

      {incorrect.length === 0 ? (
        <Alert className="mb-6">
          <AlertTitle>Perfect score</AlertTitle>
          <AlertDescription>Nothing to review — well done!</AlertDescription>
        </Alert>
      ) : (
        <ul className="space-y-3 mb-6">
          {incorrect.map((entry) => (
            <li key={entry.blankId}>
              <Card>
                <CardContent className="pt-4 flex items-center gap-3 flex-wrap">
                  <span className="text-muted-foreground">
                    {entry.userAnswer.trim() === ''
                      ? '(no answer)'
                      : entry.userAnswer}
                  </span>
                  <Separator orientation="vertical" className="h-5" />
                  <span className="font-medium">{entry.correctWord}</span>
                  <Badge
                    variant="destructive"
                    className="ml-auto flex items-center gap-1"
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

      <div className="flex gap-3">
        <Button nativeButton={false} render={<Link to="/play" />}>
          Start new round
        </Button>
        <Button
          nativeButton={false}
          variant="outline"
          render={<Link to="/sessions" />}
        >
          Back to sessions
        </Button>
      </div>
    </div>
  )
}
