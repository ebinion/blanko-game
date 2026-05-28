import { redirect } from 'react-router'
import { list } from '~/storage/session-store'

export function clientLoader() {
  const sessions = list()
  const inProgress = sessions.filter((s) => s.status === 'in_progress')
  if (inProgress.length > 0) {
    return redirect(`/play/${inProgress[0].id}`)
  }
  return redirect('/play')
}

export default function Home() {
  return null
}
