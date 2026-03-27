import { URL } from "url"

const visited = new Set()
const queue = []

export function addUrl(url) {
    try {
        const normalized = new URL(url).href.replace(/\/$/, ""); // remove trailing slash
        if (!visited.has(normalized)) {
            queue.push(normalized);
        }
    } catch {}
}

export function getNextUrl() {
    return queue.shift()
}

export function markVisited(url) {
    visited.add(url)
}

export function hasUrls() {
    return queue.length > 0
}
