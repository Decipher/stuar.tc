import { DruxtClient } from 'druxt'

export default ({ baseUrl }) => {
  const druxt = new DruxtClient(baseUrl)
  const domain = 'https://stuar.tc'

  return [
    {
      path: '/blog.xml',
      async create(feed) {
        feed.options = {
          title: 'Stuart Clark Blog',
          link: `${domain}/blog.xml`,
          description: "Stuart Clark's personal Blog feed.",
        }

        // @TODO - filter articles tagged with blog.
        const result = await druxt.getCollection('node--article')
        result.data.forEach((o) => {
          feed.addItem({
            title: o.attributes.title,
            id: `${domain}${o.attributes.path.alias}`,
            link: `${domain}${o.attributes.path.alias}`,
            content: o.attributes.field_description.processed,
            author: [
              {
                name: 'Stuart Clark',
                email: 'stu@rtclark.net',
                link: domain,
              },
            ],
            date: new Date(o.attributes.created),
          })
        })
      },
      type: 'rss2',
    },
  ]
}
