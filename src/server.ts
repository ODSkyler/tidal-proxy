import Fastify from "fastify";

const app = Fastify({
  logger: true,
});

const PORT = Number(process.env.PORT) || 3000;

const ALLOWED_AUDIO_HOSTS = new Set([
  "sp-ad-fa.audio.tidal.com",
  "sp-ad-cf.audio.tidal.com",
]);

app.get("/proxy/segment", async (request, reply) => {
  const { url } = request.query as { url?: string };

  if (!url) {
    return reply.code(400).send({
      error: "Missing url parameter",
    });
  }

  let target: URL;

  try {
    target = new URL(url);
  } catch {
    return reply.code(400).send({
      error: "Invalid URL",
    });
  }

  /*
   * Only allow TIDAL FA audio segments.
   * This prevents the endpoint from becoming an open proxy.
   */
  if (!ALLOWED_AUDIO_HOSTS.has(target.hostname)) {
    return reply.code(403).send({
      error: "Host not allowed",
    });
  }

  try {
    const upstreamHeaders: Record<string, string> = {
      "User-Agent": "Mozilla/5.0",
      "Accept": "*/*",
    };

    /*
     * Forward Range requests from the client.
     */
    if (request.headers.range) {
      upstreamHeaders.Range = request.headers.range;
    }

    const response = await fetch(target, {
      method: "GET",
      headers: upstreamHeaders,
      signal: AbortSignal.timeout(30_000),
    });

    /*
     * Forward relevant media headers.
     */
    const headersToForward = [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
      "etag",
      "last-modified",
      "cache-control",
    ];

    for (const header of headersToForward) {
      const value = response.headers.get(header);

      if (value) {
        reply.header(header, value);
      }
    }

    /*
     * CORS
     */
    reply.header(
      "Access-Control-Allow-Origin",
      "https://tidal-dl.pages.dev",
    );

    reply.header(
      "Access-Control-Expose-Headers",
      "Content-Length, Content-Range, Accept-Ranges, ETag",
    );

    /*
     * Return upstream errors without buffering successful media.
     */
    if (!response.ok) {
      const errorBody = await response.text();

      return reply.code(response.status).send(errorBody);
    }

    /*
     * Stream the TIDAL response directly to the client.
     */
    return reply.send(response.body);
  } catch (error) {
    request.log.error(error, "TIDAL proxy request failed");

    return reply.code(502).send({
      error: "Failed to fetch TIDAL segment",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get("/health", async (_request, reply) => {
  return reply.send({
    status: "ok",
    service: "tidal-proxy",
  });
});

app.listen({
  port: PORT,
  host: "0.0.0.0",
}).then(() => {
  console.log(`TIDAL proxy listening on port ${PORT}`);
}).catch((error) => {
  app.log.error(error);
  process.exit(1);
});