const https = require('https')
const fetch = require('node-fetch')

const agent = new https.Agent({ rejectUnauthorized: false })

const BASE_URL = process.env.BASE_URL || 'https://stuartclark.ddev.site'

const fetchJsonApi = async (path, params) => {
  const url = new URL(path, BASE_URL)
  Object.entries(params).forEach(([key, value]) =>
    url.searchParams.set(key, value)
  )
  const res = await fetch(url.toString(), { agent })
  return { status: res.status, data: await res.json() }
}

describe('JSON:API article endpoint', () => {
  test('article listing returns 200 without errors', async () => {
    const { status, data } = await fetchJsonApi('/jsonapi/node/article', {
      'fields[node--article]': 'title,field_content',
    })
    expect(status).toBe(200)
    expect(data.errors).toBeUndefined()
    expect(data.data).toBeDefined()
  })

  test('article with field_content include does not return 500', async () => {
    const { status, data } = await fetchJsonApi('/jsonapi/node/article', {
      include: 'field_content',
      'fields[node--article]': 'title,field_content',
    })
    expect(status).toBe(200)
    expect(data.errors).toBeUndefined()
  })

  test('article with metatag field does not return 500', async () => {
    const { status, data } = await fetchJsonApi('/jsonapi/node/article', {
      'fields[node--article]': 'title,metatag,path',
    })
    expect(status).toBe(200)
    expect(data.errors).toBeUndefined()
  })
})
