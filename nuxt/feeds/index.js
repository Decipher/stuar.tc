import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { DruxtClient } from 'druxt'

export default ({ baseUrl }) => {
  const druxt = new DruxtClient(baseUrl)
  const domain = 'https://stuar.tc'

  return [
    // Blog feed.
    {
      path: '/blog.xml',
      async create(feed) {
        feed.options = {
          title: 'Stuart Clark - Experimenting with Druxt',
          link: `${domain}/blog.xml`,
          description: "Stuart Clark's Blog feed.",
        }

        const query = new DrupalJsonApiParams()
          // Filter Article Type Blog.
          .addFilter(
            'field_article_type.id',
            '95c7fc60-bf15-4867-a0cf-bce941748e6e'
          )
        const result = await druxt.getCollection('node--article', query)
        result.data.forEach((o) => {
          feed.addItem({
            title: o.attributes.title,
            id: `${domain}${o.attributes.path.alias}`,
            link: `${domain}${o.attributes.path.alias}`,
            description: o.attributes.field_description,
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

    // Planet Drupal feed
    {
      path: '/planet-drupal.xml',
      async create(feed) {
        feed.options = {
          title: 'Stuart Clark - Experimenting with Druxt',
          link: `${domain}/planet-drupal.xml`,
          description: "Stuart Clark's Planet Drupal feed.",
        }

        const query = new DrupalJsonApiParams()
          // Filter Article Type Blog.
          .addFilter(
            'field_article_type.id',
            '95c7fc60-bf15-4867-a0cf-bce941748e6e'
          )
          // Filter Article Category Drupal Planet.
          .addFilter(
            'field_article_category.id',
            '7e0d3d5c-d9a0-40e6-aa6c-7e8f7b457695'
          )
        const result = await druxt.getCollection('node--article', query)
        result.data.forEach((o) => {
          feed.addItem({
            title: o.attributes.title,
            id: `${domain}${o.attributes.path.alias}`,
            link: `${domain}${o.attributes.path.alias}`,
            description: o.attributes.field_description,
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
