type Entry = { promise: Promise<string>; controller: AbortController; blob?: string }
const clips = new Map<string, Entry>()
let consumers = 0

// S3 and S4 own players, but share one download and blob per source URL.
export function retainDemoClips() {
  consumers++
  return () => {
    consumers--
    if (consumers) return
    clips.forEach(entry => { entry.controller.abort(); if (entry.blob) URL.revokeObjectURL(entry.blob) })
    clips.clear()
  }
}
export function requestDemoClip(url: string) {
  const existing = clips.get(url)
  if (existing) return existing.promise
  const controller = new AbortController(), entry: Entry = { controller, promise: Promise.resolve('') }
  entry.promise = fetch(url, { cache: 'force-cache', signal: controller.signal })
    .then(response => { if (!response.ok) throw Error('Demo clip unavailable'); return response.blob() })
    .then(blob => { entry.blob = URL.createObjectURL(blob); return entry.blob })
    .catch(error => { if (clips.get(url) === entry) clips.delete(url); throw error })
  clips.set(url, entry)
  return entry.promise
}
