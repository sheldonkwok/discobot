import * as http from 'http';
import * as fs from 'mz/fs';
import * as cp from 'mz/child_process';
import * as crypto from 'crypto';
import * as path from 'path';
import * as qs from 'querystring';

const config = require('../config.json');

export const HOST = 'translate.google.com';
const AUDIO_DIR = config.mp3CacheDir;
const MY_MAN_MP3 = path.resolve(__dirname, '../assets/myman.mp3');

const BASE_QS = {
  ie: 'UTF-8',
  total: 1,
  idx: 0,
  textlen: 32,
  client: 'tw-ob',
  tl: 'En-gb',
};

function hashSHA1(str: string): string {
  return crypto
    .createHash('sha1')
    .update(str)
    .digest('hex');
}

export async function create(username: string, filename: string): Promise<void> {
  const qStr = qs.stringify({ ...BASE_QS, q: username });
  const opts = {
    hostname: HOST,
    path: `/translate_tts?${qStr}`,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
    },
  };

  return new Promise<void>((resolve, rej) => {
    http.get(opts, response => {
      const code = response.statusCode;
      if (code !== 200) return rej(new Error(`Unable to create tts code: ${code}`));

      response
        .pipe(fs.createWriteStream(filename))
        .on('close', () => resolve())
        .on('error', () => rej(new Error(`Failed to create tts of ${username} to ${filename}`)));
    });
  });
}

async function appendMyMan(filePath: string): Promise<string> {
  const newPath = `${filePath}.myman`;
  await cp.execFile('ffmpeg', ['-y', '-i', `concat:${filePath}|${MY_MAN_MP3}`, '-f', 'mp3', newPath]);

  return newPath;
}

// async function convertPCM(filePath: string): Promise<string> {
//   const pcmPath = `${filePath}.pcm`;
//   await cp.execFile('ffmpeg', ['-y', '-i', filePath, '-f', 's16le', '-ar', '48000', '-ac', '2', pcmPath]);
//
//   return pcmPath;
// }

export async function getFile(id: string, username: string): Promise<string> {
  const userHash = hashSHA1(username);
  const filename = `${id}-${userHash}`;
  const filePath = path.join(AUDIO_DIR, filename);

  if (await fs.exists(filePath)) return filePath;

  const tmpFile = `${filePath}.tmp`;
  await create(username, tmpFile);
  const appended = await appendMyMan(tmpFile);

  await fs.rename(appended, filePath);
  await fs.unlink(tmpFile);

  return filePath;
}

export async function get(id: string, username: string): Promise<fs.ReadStream> {
  const filename = await getFile(id, username);

  return fs.createReadStream(filename);
}
