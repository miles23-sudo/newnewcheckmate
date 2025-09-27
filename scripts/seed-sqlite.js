import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('./dev.db');

async function seedSQLiteData() {
  try {
    console.log('🌱 Seeding SQLite database...\n');
    
    // Create users table
    console.log('👥 Creating users table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('student', 'instructor', 'administrator')),
        student_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    db.exec('DELETE FROM users');
    console.log('✅ Existing data cleared\n');
    
    // Create test users
    console.log('👥 Creating test users...');
    const saltRounds = 12;
    
    const users = [
      {
        first_name: 'Dr. Sarah',
        last_name: 'Johnson',
        email: 'sarah.johnson@university.edu',
        password: await bcrypt.hash('password123', saltRounds),
        role: 'instructor',
        student_id: null
      },
      {
        first_name: 'Alice',
        last_name: 'Smith',
        email: 'alice.smith@student.edu',
        password: await bcrypt.hash('password123', saltRounds),
        role: 'student',
        student_id: 'STU001'
      },
      {
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@university.edu',
        password: await bcrypt.hash('password123', saltRounds),
        role: 'administrator',
        student_id: null
      }
    ];
    
    const insertUser = db.prepare(`
      INSERT INTO users (first_name, last_name, email, password, role, student_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    for (const user of users) {
      insertUser.run(
        user.first_name,
        user.last_name,
        user.email,
        user.password,
        user.role,
        user.student_id
      );
    }
    
    console.log(`✅ Created ${users.length} test users`);
    
    console.log('\n🎉 SQLite database seeding completed successfully!');
    console.log('\n🔑 Test Credentials:');
    console.log('  Instructor: sarah.johnson@university.edu / password123');
    console.log('  Student: alice.smith@student.edu / password123');
    console.log('  Admin: admin@university.edu / password123');
    
  } catch (error) {
    console.error('❌ Error seeding SQLite data:', error.message);
    process.exit(1);
  } finally {
    db.close();
  }
}

seedSQLiteData();
