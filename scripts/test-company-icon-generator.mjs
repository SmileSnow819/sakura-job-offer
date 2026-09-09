import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const GENERATOR_PATH = resolve('scripts/generate-company-icons.mjs');

/** 构造包含 BMP 像素的最小 ICO，覆盖 Sharp 无法直接读取的常见 favicon 格式。 */
const createBmpIco = () => {
  const width = 16;
  const height = 16;
  const pixelBytes = width * height * 4;
  const maskBytes = width * 4;
  const imageBytes = 40 + pixelBytes + maskBytes;
  const buffer = Buffer.alloc(6 + 16 + imageBytes);
  buffer.writeUInt16LE(0, 0);
  buffer.writeUInt16LE(1, 2);
  buffer.writeUInt16LE(1, 4);
  buffer[6] = width;
  buffer[7] = height;
  buffer.writeUInt16LE(1, 10);
  buffer.writeUInt16LE(32, 12);
  buffer.writeUInt32LE(imageBytes, 14);
  buffer.writeUInt32LE(22, 18);
  buffer.writeUInt32LE(40, 22);
  buffer.writeInt32LE(width, 26);
  buffer.writeInt32LE(height * 2, 30);
  buffer.writeUInt16LE(1, 34);
  buffer.writeUInt16LE(32, 36);
  buffer.writeUInt32LE(pixelBytes, 42);
  for (let offset = 62; offset < 62 + pixelBytes; offset += 4) {
    buffer[offset] = 0x35;
    buffer[offset + 1] = 0x8f;
    buffer[offset + 2] = 0xf2;
    buffer[offset + 3] = 0xff;
  }
  return buffer;
};

const runGenerator = (cwd) =>
  new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [GENERATOR_PATH], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolvePromise(stdout);
      else reject(new Error(`图标生成失败 (${code}): ${stderr || stdout}`));
    });
  });

const createWorkspace = async (links) => {
  const workspace = await mkdtemp(join(tmpdir(), 'sakura-icon-test-'));
  await mkdir(join(workspace, 'src'), { recursive: true });
  await mkdir(join(workspace, 'public'), { recursive: true });
  await writeFile(
    join(workspace, 'src/bookmarks.json'),
    JSON.stringify({ categories: [{ links }] }),
  );
  await writeFile(
    join(workspace, 'public/sakura-offer-icon.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#fff"/></svg>',
  );
  return workspace;
};

void test('生成器将 BMP 格式 ICO 转为本地 WebP，而不是误用兜底图', async (context) => {
  const ico = createBmpIco();
  const server = createServer((request, response) => {
    if (request.url === '/favicon.ico') {
      response.writeHead(200, { 'content-type': 'image/x-icon' });
      response.end(ico);
      return;
    }
    response.writeHead(200, { 'content-type': 'text/html' });
    response.end('<link rel="icon" href="/favicon.ico">');
  });
  await new Promise((resolvePromise) => server.listen(0, '127.0.0.1', resolvePromise));
  context.after(() => {
    server.closeAllConnections();
    server.close();
  });

  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const workspace = await createWorkspace([
    { title: 'ICO 测试公司', url: `http://127.0.0.1:${address.port}/jobs` },
  ]);

  await runGenerator(workspace);

  const manifest = await readFile(join(workspace, 'src/companyIcons.ts'), 'utf8');
  assert.match(manifest, /"name:ico测试公司": "(?!sakura-offer-icon\.webp)[a-f0-9]{12}\.webp"/);
});

void test('三个不同公司抓到相同图标时拒绝通用招聘平台占位图', async (context) => {
  const ico = createBmpIco();
  const server = createServer((request, response) => {
    if (request.url === '/favicon.ico') {
      response.writeHead(200, { 'content-type': 'image/x-icon' });
      response.end(ico);
      return;
    }
    response.writeHead(200, { 'content-type': 'text/html' });
    response.end('<link rel="icon" href="/favicon.ico">');
  });
  await new Promise((resolvePromise) => server.listen(0, '127.0.0.1', resolvePromise));
  context.after(() => {
    server.closeAllConnections();
    server.close();
  });

  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const workspace = await createWorkspace(
    ['甲公司', '乙公司', '丙公司'].map((title, index) => ({
      title,
      url: `http://127.0.0.1:${address.port}/jobs/${index}`,
    })),
  );

  await runGenerator(workspace);

  const manifest = await readFile(join(workspace, 'src/companyIcons.ts'), 'utf8');
  for (const name of ['甲公司', '乙公司', '丙公司']) {
    assert.match(manifest, new RegExp(`"name:${name}": "sakura-offer-icon\\.webp"`));
  }
  assert.deepEqual(await readdir(join(workspace, 'public/assets/company-icons')), [
    'sakura-offer-icon.webp',
  ]);
});
