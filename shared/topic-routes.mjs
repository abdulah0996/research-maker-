export const topicSlug = title => title.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
  .replace(/\+/g, '-plus').replace(/#/g, '-sharp').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
export const topicPath = (category, topic) => '/tutoring/' + category + '/' + topic.slug
export const categoryKey = subject => String(subject._id ?? subject.slug)

