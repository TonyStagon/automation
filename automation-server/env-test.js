const express = require('express');
require('dotenv').config({ path: '../.env' });

console.log('Testing environment variables:');
console.log('INSTAGRAM_USERNAME:', process.env.INSTAGRAM_USERNAME);
console.log('INSTAGRAM_PASSWORD:', process.env.INSTAGRAM_PASSWORD ? '*** (password hidden)' : 'NOT SET');
console.log('Instagram credentials available:',
    process.env.INSTAGRAM_USERNAME && process.env.INSTAGRAM_PASSWORD ? '✅ YES' : '❌ NO');

// Also check for alternative environment variable names
console.log('IG_USERNAME:', process.env.IG_USERNAME);
console.log('Other relevant env vars available:',
    process.env.IG_USERNAME && process.env.IG_PASSWORD ? '✅ YES' : '❌ NO');