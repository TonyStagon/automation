import dotenv from 'dotenv';
dotenv.config();

console.log('TWITTER_USERNAME:', process.env.TWITTER_USERNAME || 'NOT SET');
console.log('TWIT_PASSWORD:', process.env.TWIT_PASSWORD || 'NOT SET');
console.log('Environment keys containing TWIT:', Object.keys(process.env).filter(key => key.includes('TWIT')));
console.log('HEADLESS:', process.env.HEADLESS);