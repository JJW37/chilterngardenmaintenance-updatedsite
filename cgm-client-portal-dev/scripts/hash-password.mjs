import { stdin } from 'node:process';
import { hashPassword } from '../functions/_lib/auth.js';

let input = '';
stdin.setEncoding('utf8');
stdin.on('data', (chunk) => { input += chunk; });
stdin.on('end', async () => {
  const password = input.replace(/\r?\n$/, '');
  if (!password) {
    console.error('Paste a password through standard input. No hash was produced.');
    process.exitCode = 1;
    return;
  }
  try {
    console.log(await hashPassword(password));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
});
