import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'

type HealthResponse = {
  status: string
}

export function DashboardPage() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await api.get<HealthResponse>('/health')
      return response.data
    },
    retry: false,
  })

  return (
    <section className="page-section">
      <p className="eyebrow">Overview</p>
      <h2>Admin Dashboard</h2>
      <p>Routing, API fetching, and server state management are ready.</p>
      <p>
        API status:{' '}
        {isPending ? 'Loading...' : isError ? 'Unavailable' : data.status}
      </p>
      <Link to="/users">Go to users</Link>
    </section>
  )
}
