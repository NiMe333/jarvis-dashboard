# JARVIS Dashboard deployment

The dashboard is a React 19 application built with Vite 7. It is deployed as
static files and does not require Node.js at runtime. The production output is
written to `dist/`.

## Requirements

- Node.js `^20.19.0` or `>=22.12.0` on the build machine
- npm
- Nginx inside the target LXC container

## Local development

Install the exact dependency versions from the lockfile:

```bash
npm ci
```

Start the Vite development server:

```bash
npm run dev
```

To expose the development server on the local network:

```bash
npm run dev -- --host 0.0.0.0
```

## Production build

Create the optimized static build:

```bash
npm run build
```

The generated website is in `dist/`. The contents of that directory, rather
than the directory itself, should be copied to the Nginx web root.

## API configuration

Copy the example environment file before building:

```bash
cp .env.example .env.production
```

For same-origin production deployments behind the included Nginx proxy, leave
the production value empty:

```dotenv
VITE_API_BASE_URL=
```

The frontend then requests `/api/...` from the current host. Local development
can still set `VITE_API_BASE_URL=http://localhost:3001` in `.env`.

The value is available to frontend code through `src/config/runtimeConfig.js`.
Vite embeds environment values during the build, so rebuild and redeploy after
changing the URL. Do not place secrets in any `VITE_` variable because those
values are visible in the browser bundle.

## Nginx deployment in the LXC container

Install Nginx on a Debian or Ubuntu based container:

```bash
sudo apt update
sudo apt install -y nginx rsync
```

Create the web root and copy the build output. If the project is built inside
the container, run this from the `frontend` directory:

```bash
sudo mkdir -p /var/www/jarvis-dashboard
sudo rsync -a --delete dist/ /var/www/jarvis-dashboard/
```

When building on another machine, build and deploy from the project root with:

```bash
npm run build

rsync -av --delete \
  frontend/dist/ \
  root@192.168.0.30:/var/www/jarvis-dashboard/
```

This copies the contents of `frontend/dist/` to the Nginx web root. The
`--delete` option removes old hashed assets that are no longer part of the
current build.

Install the included Nginx site configuration:

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/jarvis-dashboard
sudo ln -s /etc/nginx/sites-available/jarvis-dashboard /etc/nginx/sites-enabled/jarvis-dashboard
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

The configuration uses `server_name _` and does not hardcode a production
domain. It serves hashed assets with long-term caching, prevents caching of
`index.html`, and falls back to `index.html` for unknown paths so future
client-side routes work correctly.

After deployment, open the LXC container's IP address in a browser. DNS and TLS
can be added later without rebuilding the dashboard unless the API URL changes.


nikmejak@niks-macbook-pro-m4 jarvis-dashboard % npm run build
rsync -av --delete \
  frontend/dist/ \
  root@192.168.0.30:/var/www/jarvis-dashboard/
