import { editorialPhoto } from './editorial-media'
import catalogue from './photo-catalogue.json'
import type { Subject, Topic } from './types'

const topicPhotos: Record<string, Record<string, string | string[]>> = catalogue.topics

export const sitePhotos = catalogue.site
export const academicSubjectPhotos: Record<string, { src: string; alt: string }> = catalogue.academicSubjects

export function topicPhoto(subject: Subject, topic: Topic) {
  const photo = topicPhotos[subject.slug]?.[topic.slug]
  if (!photo) return editorialPhoto(subject.slug)
  if (Array.isArray(photo)) return { src: photo[0], alt: photo[1] }
  return { src: '/images/topics/' + subject.slug + '-' + topic.slug + '.webp', alt: photo }
}
