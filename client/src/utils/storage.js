export function getStorageUrl(path) {
  if (!path) return ""
  if (/^https?:\/\//i.test(path)) return path

  const normalizedPath = String(path).replace(/^\/+/, "")

  if (normalizedPath.startsWith("storage/")) {
    return `/${normalizedPath}`
  }

  return `/storage/${normalizedPath}`
}
