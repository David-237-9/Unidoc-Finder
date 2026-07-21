import { request } from "undici";

/**
 * Triggers a search index synchronization by sending a POST request to the sync endpoint.
 * TODO: Remove "undici" dependency and let synchronization run without waiting for the response (but wait enough for an error)
 * @param apiUrl {string} The base URL of the API (e.g., "https://example.com/api/thesis").
 * @param apiToken {string} The API token for authentication.
 * @return {Promise<void>} A promise that resolves when the sync is complete or rejects if an error occurs.
 */
export async function triggerAPISync(apiUrl, apiToken) {
    const syncUrl = `${apiUrl}/api/search/sync`

    console.log('Triggering API synchronization at', syncUrl);

    const { body } = await request(syncUrl, {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiToken}` },
        headersTimeout: 0,
        bodyTimeout: 0
    });

    console.log(await body.text());

    console.log("Search index sync completed.")
}
