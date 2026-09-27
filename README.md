# TIDAL Proxy

A lightweight **Fastify-based proxy for TIDAL audio segments**.

TIDAL sometimes return audio segments from different CDN hosts. In particular, some `sp-ad-fa.audio.tidal.com` segments may return `403 Forbidden` when requested directly from a browser, while the same signed segment URL can be successfully retrieved from a server.

This project provides a small server-side proxy that forwards TIDAL audio segment requests to the allowed TIDAL CDN and streams the response back to the client.

It is designed primarily as a fallback proxy for **TIDAL-DL**.

---

## Features

* ⚡ Fastify + Node.js
* 🎵 Streams TIDAL audio segments without buffering the entire file
* 🔒 Restricts upstream requests to allowed TIDAL CDN hosts
* 📡 Supports HTTP `Range` requests
* 🌐 CORS support for TIDAL-DL
* 🚀 Works locally or on cloud platforms
* ☁️ Easy deployment on Render
* 🪶 Lightweight and suitable for small personal deployments

---

## Requirements

* Node.js 20+
* npm
* Git

Node.js 24 is currently used successfully with this project.

---

## Installation

Clone the repository:

```bash
git clone https://github.com/ODSkyler/tidal-proxy.git
cd tidal-proxy
```

Install dependencies:

```bash
npm install
```

---

## Development

Start the local server:

```bash
npm run dev
```

The server will listen on:

```text
http://localhost:3000
```

Check the health endpoint:

```text
http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "tidal-proxy"
}
```
---

## TIDAL-DL Configuration

The proxy endpoint is:

```text
/proxy/segment?url=
```

For a local installation, configure TIDAL-DL's custom proxy as:

```text
http://localhost:3000/proxy/segment?url=
```

The complete TIDAL segment URL is appended after the `url=` parameter.

For example:

```text
http://localhost:3000/proxy/segment?url=https%3A%2F%2Fsp-ad-fa.audio.tidal.com%2F...
```

---

## Render Deployment

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/ODSkyler/tidal-proxy)

The easiest way to deploy your own TIDAL Proxy is with Render.

Click the **Deploy** button above and follow the setup wizard. The repository includes a `render.yaml` Blueprint that automatically configures the build command, start command, and health check.

### 1. One-Click Deployment

Click:

**Deploy to Render**

Render will detect the included `render.yaml` and configure the service automatically.

You will need to:

1. Sign in to your Render account.
2. Select the workspace where you want to deploy the service.
3. Review the generated service configuration.
4. Choose an instance type.
5. Click **Apply** to deploy.

For personal use and testing, the **Free** instance is sufficient.

### 2. Manual Deployment

Alternatively, you can deploy the service manually.

Open the Render Dashboard and select:

```text
New → Web Service
```
---

## Note

The proxy can run on Render's Free Web Service for personal/testing use.

Keep in mind that Render Free web services can **spin down after periods of inactivity**, so the first request after inactivity may take longer while the service starts again.

A proxy also consumes bandwidth because audio data travels through the proxy server.

For larger public usage, consider using an appropriate paid server or another hosting provider.

---

## API Schema

### `GET /health`

Checks whether the proxy is running.

Example:

```text
GET /health
```

Response:

```json
{
  "status": "ok",
  "service": "tidal-proxy"
}
```

---

### `GET /proxy/segment`

Proxies an allowed TIDAL audio segment.

Example:

```text
GET /proxy/segment?url=<encoded-tidal-url>
```

The `url` parameter must contain a valid URL from an allowed TIDAL audio CDN.

The proxy forwards the following request information when applicable:

* `Range`
* `User-Agent`
* `Accept`

Relevant upstream response headers are also forwarded, including:

* `Content-Type`
* `Content-Length`
* `Content-Range`
* `Accept-Ranges`
* `ETag`
* `Last-Modified`
* `Cache-Control`

Successful audio responses are streamed directly instead of being fully buffered in memory.

---

## Security

This project intentionally does **not** operate as an unrestricted URL proxy.

The server validates the hostname of the requested upstream URL against an allowlist:

```ts
const ALLOWED_AUDIO_HOSTS = new Set([
  "sp-ad-fa.audio.tidal.com",
]);
```

This prevents the endpoint from being used to request arbitrary internet resources.

### Adding another TIDAL CDN

If you intentionally want to support another TIDAL audio CDN, add its exact hostname to the allowlist:

```ts
const ALLOWED_AUDIO_HOSTS = new Set([
  "sp-ad-fa.audio.tidal.com",
  "sp-ad-cf.audio.tidal.com",
]);
```

Only add hosts that you have verified are legitimate TIDAL audio endpoints.

---

## Self Host

You can deploy your own instance on:

* Render
* VPS
* Dedicated server
* Home server
* Raspberry Pi
* Other Node.js-compatible hosting providers

---

## Disclaimer

This project is an independent server-side proxy and is not affiliated with or endorsed by TIDAL.

Users are responsible for complying with TIDAL's terms, applicable laws, and any other restrictions that apply to their use of the service.

The proxy does not bypass TIDAL authentication or generate TIDAL credentials. It forwards URLs that have already been provided by the client.

---

## License

This project is licensed under **MIT License**.

## Author

Made with ❤️ by OD Skyler