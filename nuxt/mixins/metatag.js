export default {
  head() {
    return {
      title: this.entity.attributes.metatag.find(
        (o) => o.attributes.name === 'title'
      ).attributes.content,
      meta: this.entity.attributes.metatag
        .filter((o) => o.tag === 'meta')
        .map((o) => ({
          hid: o.attributes.name,
          name: o.attributes.name,
          content: o.attributes.content,
        })),
    }
  },
}
