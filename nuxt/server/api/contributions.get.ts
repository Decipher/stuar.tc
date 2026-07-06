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

export default defineEventHandler(async () => {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
  if (!token) return { events: [] as { date: string }[] }

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
    const days = data.data?.user?.contributionsCollection?.contributionCalendar?.weeks
      ?.flatMap(w => w.contributionDays) ?? []

    const events: { date: string }[] = []
    for (const day of days) {
      for (let i = 0; i < day.contributionCount; i++) {
        events.push({ date: day.date })
      }
    }

    return { events }
  }
  catch {
    return { events: [] as { date: string }[] }
  }
})
