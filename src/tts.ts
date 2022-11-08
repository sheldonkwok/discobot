import * as fs from 'fs';
import * as fsProm from 'fs/promises';
import * as cp from 'child_process';
import * as crypto from 'crypto';
import * as path from 'path';
import * as util from 'node:util';
import * as polly from '@aws-sdk/client-polly';

const execFile = util.promisify(cp.execFile);

const AUDIO_DIR = '/tmp/discoCache';
const MY_MAN_MP3 = path.resolve('./assets/myman.mp3');
const pollyClient = new polly.PollyClient({ region: 'us-west-2' });

export async function get(id: string, username: string): Promise<string> {
  const userHash = hashSHA1(username);
  const filename = `${id}-${userHash}.mp3`;
  const filePath = path.join(AUDIO_DIR, filename);

  if (await fileExists(filePath)) return filePath;

  const tmpFile = `${filePath}.tmp.mp3`;

  await synth(username, tmpFile);
  const appended = await appendMyMan(tmpFile);

  await fsProm.rename(appended, filePath);
  await fsProm.unlink(tmpFile);

  return filePath;
}

function hashSHA1(str: string): string {
  return crypto.createHash('sha1').update(str).digest('hex');
}

async function synth(username: string, filename: string): Promise<void> {
  const cmd = new polly.SynthesizeSpeechCommand({
    Engine: 'neural',
    Text: username,
    OutputFormat: 'mp3',

    VoiceId: 'Brian',
  });

  const pollyOut = await pollyClient.send(cmd);
  const byteArr = await pollyOut.AudioStream.transformToByteArray();

  await fsProm.writeFile(filename, byteArr);
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
