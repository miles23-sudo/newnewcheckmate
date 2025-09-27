import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Setting up development environment...\n');

// Check if .env exists
if (!fs.existsSync('.env')) {
  console.log('❌ .env file not found. Please create it with your DATABASE_URL');
  process.exit(1);
}

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed\n');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
}

// Check database connection
console.log('🔍 Checking database connection...');
try {
  execSync('node -e "import(\'./server/db.js\').then(db => console.log(\'✅ Database connected\'))"', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Database connection failed:', error.message);
  process.exit(1);
}

// Check if sample data exists
console.log('\n📊 Checking for sample data...');
try {
  const { Pool } = await import('@neondatabase/serverless');
  const dotenv = await import('dotenv');
  dotenv.config();
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  
  const userCount = await client.query('SELECT COUNT(*) FROM users');
  const courseCount = await client.query('SELECT COUNT(*) FROM courses');
  
  client.release();
  await pool.end();
  
  if (userCount.rows[0].count === '0') {
    console.log('🌱 No sample data found. Would you like to seed sample data? (y/n)');
    // In a real implementation, you'd use readline for user input
    console.log('💡 Run: node scripts/seed-sample-data.js');
  } else {
    console.log(`✅ Found ${userCount.rows[0].count} users and ${courseCount.rows[0].count} courses`);
  }
} catch (error) {
  console.log('⚠️  Could not check sample data:', error.message);
}

console.log('\n🎯 Development environment is ready!');
console.log('\n📋 Available commands:');
console.log('  npm run dev          - Start development server');
console.log('  npm run build        - Build for production');
console.log('  npm run db:push      - Push schema changes to database');
console.log('  node scripts/seed-sample-data.js - Add sample data');

console.log('\n🌐 Your application will be available at:');
console.log('  http://localhost:5000');

console.log('\n📚 Next steps:');
console.log('  1. Start the development server: npm run dev');
console.log('  2. Add sample data: node scripts/seed-sample-data.js');
console.log('  3. Open your browser and start developing!');
console.log('  4. Check the NEXT_STEPS.md file for detailed guidance');

console.log('\n🎉 Happy coding! 🚀');
