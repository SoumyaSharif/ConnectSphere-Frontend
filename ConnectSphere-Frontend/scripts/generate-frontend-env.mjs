import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const frontendRoot = resolve(import.meta.dirname, '..');
const workspaceRoot = resolve(frontendRoot, '..');
const envPath = resolve(workspaceRoot, '.env');
const outputPath = resolve(frontendRoot, 'public', 'env.js');

const parseEnvFile = (content) => {
  const values = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex < 1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
};

let envContent = '';
try {
  envContent = await readFile(envPath, 'utf8');
} catch {
  envContent = '';
}

const fileEnv = parseEnvFile(envContent);
const env = {
  ...fileEnv,
  ...process.env,
};
const runtimeConfig = {
  apiUrl: env.FRONTEND_API_URL || 'http://localhost:8080',
  googleClientId: env.FRONTEND_GOOGLE_CLIENT_ID || '',
  razorpayKeyId: env.FRONTEND_RAZORPAY_KEY_ID || '',
};

const fileContents = `window.__connectSphereEnv = ${JSON.stringify(runtimeConfig, null, 2)};\n`;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, fileContents, 'utf8');

console.log(`Generated ${outputPath}`);
