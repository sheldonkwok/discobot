import * as http from 'http';
import * as fs from 'fs';
import * as qs from 'querystring';

export const HOST = 'translate.google.com';

export async function create(username: string, filename: string): Promise<void> {
  const qStr = qs.stringify({ client: 'tw-obj', tl: 'En-gb', q: username });
  const fileStream = fs.createWriteStream(filename);
  const opts = { hostname: HOST, path: `/translate_tts?${qStr}` };

  return new Promise<void>((resolve, rej) => {
    http.get(opts, response => {
      response
        .pipe(fileStream)
        .on('close', () => resolve())
        .on('error', () => rej(new Error(`Failed to create tts of ${username} to ${filename}`)));
    });
  });
}
