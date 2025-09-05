import { runTwitter } from './client/X-bot';

async function main() {
  try {
    console.log('Starting Twitter bot...');
    await runTwitter();
    console.log('Twitter bot completed successfully');
  } catch (error) {
    console.error('Twitter bot failed:', error);
    process.exit(1);
  }
}

main();