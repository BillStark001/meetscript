#!/usr/bin/env tsx
/**
 * MeetScript deployment script.
 *
 * Usage:
 *   tsx scripts/deploy.ts [options]
 *
 * Options:
 *   --nginx          Configure Nginx reverse-proxy and launch the server
 *   --cert <path>    TLS certificate base-path (without .crt/.key extension)
 *   --site <name>    Nginx site name (default: ms)
 *   --server <name>  Nginx server_name directive (default: _)
 *   --port <n>       Uvicorn port (default: 8000)
 *   --allow-lan      Allow the server to bind on 0.0.0.0 (LAN-accessible)
 *   --mount-static   Serve the frontend static files from within FastAPI
 *   --gen-cert <n>   Generate a self-signed TLS certificate with the given name
 */

import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

function flag(name: string): boolean {
  return args.includes(name);
}

function option(name: string, fallback: string): string {
  const idx = args.indexOf(name);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : fallback;
}

const useNginx = flag('--nginx');
const certBasePath = option('--cert', '');
const siteName = option('--site', 'ms');
const serverName = option('--server', '_');
const port = Number(option('--port', '8000'));
const allowLan = flag('--allow-lan');
const mountStatic = flag('--mount-static');
const genCertName = option('--gen-cert', '');

// ---------------------------------------------------------------------------
// Certificate generation (--gen-cert)
// ---------------------------------------------------------------------------

if (genCertName) {
  const dir = '.';
  const name = genCertName;
  run(`openssl genpkey -algorithm RSA -out ${dir}/${name}.pass.key -aes256 -pass pass:temp_password`);
  run(`openssl rsa -in ${dir}/${name}.pass.key -out ${dir}/${name}.key -passin pass:temp_password`);
  run(`openssl req -new -key ${dir}/${name}.key -out ${dir}/${name}.csr -subj "/CN=localhost"`);
  run(`openssl x509 -req -in ${dir}/${name}.csr -signkey ${dir}/${name}.key -out ${dir}/${name}.crt`);
  console.log(`Generated: ${dir}/${name}.{key,csr,crt}`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function run(cmd: string, cwd?: string): void {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd });
}

function resolve(...parts: string[]): string {
  return path.resolve(__dirname, '..', ...parts);
}

// ---------------------------------------------------------------------------
// 1. Build frontend
// ---------------------------------------------------------------------------

const frontendDir = resolve('ms-frontend');
if (!fs.existsSync(frontendDir)) {
  console.error('ms-frontend directory not found. Aborting.');
  process.exit(1);
}

run('pnpm install', frontendDir);
run('pnpm run build', frontendDir);

const staticDir = path.join(frontendDir, 'dist');

// ---------------------------------------------------------------------------
// 2. Configure Nginx (optional)
// ---------------------------------------------------------------------------

if (useNginx) {
  try {
    execSync('nginx -v', { stdio: 'ignore' });
  } catch {
    console.error('Nginx is not installed. Aborting --nginx flow.');
    process.exit(1);
  }

  let listenBlock: string;

  if (certBasePath) {
    const certFull = path.resolve(certBasePath);
    listenBlock = `listen 80;
    server_name ${serverName};

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    root ${staticDir};
    server_name ${serverName};

    ssl_certificate ${certFull}.crt;
    ssl_certificate_key ${certFull}.key;`;
  } else {
    listenBlock = `listen 80;
    root ${staticDir};
    server_name ${serverName};`;
  }

  const nginxConfig = `server {
    ${listenBlock}

    location /ms {
        alias ${path.join(staticDir, 'index.html')};
        default_type text/html;
    }

    location /api {
        proxy_pass http://127.0.0.1:${port};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws {
        proxy_pass http://127.0.0.1:${port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location / {
        try_files $uri $uri/ =404;
    }
}
`;

  const nginxAvailable = `/etc/nginx/sites-available/${siteName}`;
  const nginxEnabled = `/etc/nginx/sites-enabled/${siteName}`;

  fs.writeFileSync('/tmp/_ms_nginx.conf', nginxConfig);
  run(`sudo cp /tmp/_ms_nginx.conf ${nginxAvailable}`);

  if (fs.existsSync(nginxEnabled)) {
    run(`sudo rm ${nginxEnabled}`);
  }
  run(`sudo ln -s ${nginxAvailable} ${nginxEnabled}`);
  run('sudo nginx -s reload');
}

// ---------------------------------------------------------------------------
// 3. Launch uvicorn
// ---------------------------------------------------------------------------

const serverDir = resolve('ms-server');
const host = allowLan ? '0.0.0.0' : '127.0.0.1';

const env: NodeJS.ProcessEnv = {
  ...process.env,
  MOUNT_STATIC: mountStatic ? 'true' : 'false',
  ALLOW_LAN: allowLan ? 'true' : 'false',
};

console.log(`\nLaunching server on ${host}:${port} ...`);

const proc = spawn(
  'uvicorn',
  ['main:app', '--host', host, '--port', String(port), '--app-dir', serverDir],
  { stdio: 'inherit', env },
);

proc.on('exit', (code) => process.exit(code ?? 0));

process.on('SIGINT', () => proc.kill('SIGINT'));
process.on('SIGTERM', () => proc.kill('SIGTERM'));
