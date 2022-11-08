import * as fs from 'fs';
import * as fsProm from 'fs/promises';
import * as cp from 'child_process';
import * as crypto from 'crypto';
import * as path from 'path';
import * as util from 'node:util';

const execFile = util.promisify(cp.execFile);

const AUDIO_DIR = '/tmp/discoCache';
const MY_MAN_MP3 = path.resolve('./assets/myman.mp3');

async function getFile(id: string, username: string): Promise<string> {
  const userHash = hashSHA1(username);
  const filename = `${id}-${userHash}.mp3`;
  const filePath = path.join(AUDIO_DIR, filename);

  if (await fileExists(filePath)) return filePath;

  const tmpFile = `${filePath}.tmp.mp3`;
  await createMP3(username, tmpFile);
  const appended = await appendMyMan(tmpFile);

  await fsProm.rename(appended, filePath);
  await fsProm.unlink(tmpFile);

  return filePath;
}

function hashSHA1(str: string): string {
  return crypto.createHash('sha1').update(str).digest('hex');
}

async function createMP3(username: string, filename: string): Promise<void> {
  await execFile('bash', ['-c', `espeak "${username}" --stdout | ffmpeg -i pipe:0 ${filename}`]);
}

async function appendMyMan(filePath: string): Promise<string> {
  const newPath = `${filePath}.myman`;
  await execFile('ffmpeg', ['-y', '-i', `concat:${filePath}|${MY_MAN_MP3}`, '-f', 'mp3', newPath]);

  return newPath;
}

async function fileExists(filename: string): Promise<boolean> {
  try {
    await fsProm.access(filename, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

export async function get(id: string, username: string): Promise<string> {
  const filename = await getFile(id, username);

  return filename;
}
