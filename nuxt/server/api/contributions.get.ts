import { defineEventHandler } from 'h3'

const GH_LOGIN = 'Decipher'

interface ContributionDay {
  date: string
  contributionCount: number
}

interface GraphQLResponse {
  data?: {
    user?: {
      contributionsCollection?: {
        contributionCalendar?: {
          weeks: Array<{ contributionDays: ContributionDay[] }>
        }
      }
    }
  }
}

export interface ContributionEvent {
  date: string
}

export async function fetchContributions(token?: string): Promise<{ events: ContributionEvent[] }> {
  if (!token) return { events: [] }

  const today = new Date()
  const from = new Date(today)
  from.setFullYear(from.getFullYear() - 1)

  const query = `{
    user(login: "${GH_LOGIN}") {
      contributionsCollection(from: "${from.toISOString()}", to: "${today.toISOString()}") {
        contributionCalendar {
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }`

  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })

    const data: GraphQLResponse = await res.json()
    const weeks = data.data?.user?.contributionsCollection?.contributionCalendar?.weeks ?? []
    const days = weeks.flatMap(w => w.contributionDays)

    const events: ContributionEvent[] = []
    for (const day of days) {
      for (let i = 0; i < day.contributionCount; i++) {
        events.push({ date: day.date })
      }
    }

    return { events }
  }
  catch {
    return { events: [] }
  }
}

export default defineEventHandler(async () => {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
  return fetchContributions(token)
})
