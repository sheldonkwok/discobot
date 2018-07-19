import * as http from 'http';
import * as fs from 'fs';
import * as qs from 'querystring';

export const HOST = 'translate.google.com';

const BASE_QS = {
  ie: 'UTF-8',
  total: 1,
  idx: 0,
  textlen: 32,
  client: 'tw-ob',
  tl: 'En-gb',
};

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

      const fileStream = fs.createWriteStream(filename);
      response
        .pipe(fileStream)
        .on('close', () => resolve())
        .on('error', () => rej(new Error(`Failed to create tts of ${username} to ${filename}`)));
    });
  });
}
