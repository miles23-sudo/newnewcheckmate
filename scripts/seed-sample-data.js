import { Pool, neonConfig } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import ws from 'ws';

dotenv.config();

// Configure WebSocket constructor for Neon
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function seedSampleData() {
  let client;
  
  try {
    client = await pool.connect();
    console.log('🌱 Seeding sample data...\n');
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🧹 Clearing existing data...');
    await client.query('DELETE FROM grades');
    await client.query('DELETE FROM submissions');
    await client.query('DELETE FROM assignments');
    await client.query('DELETE FROM materials');
    await client.query('DELETE FROM announcements');
    await client.query('DELETE FROM enrollments');
    await client.query('DELETE FROM courses');
    await client.query('DELETE FROM users');
    console.log('✅ Existing data cleared\n');
    
    // 1. Create Users
    console.log('👥 Creating users...');
    
    // Hash passwords properly
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
        first_name: 'Prof. Michael',
        last_name: 'Chen',
        email: 'michael.chen@university.edu',
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
        first_name: 'Bob',
        last_name: 'Wilson',
        email: 'bob.wilson@student.edu',
        password: await bcrypt.hash('password123', saltRounds),
        role: 'student',
        student_id: 'STU002'
      },
      {
        first_name: 'Carol',
        last_name: 'Davis',
        email: 'carol.davis@student.edu',
        password: await bcrypt.hash('password123', saltRounds),
        role: 'student',
        student_id: 'STU003'
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
    
    const createdUsers = [];
    for (const user of users) {
      const result = await client.query(`
        INSERT INTO users (first_name, last_name, email, password, role, student_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, first_name, last_name, email, role
      `, [user.first_name, user.last_name, user.email, user.password, user.role, user.student_id]);
      createdUsers.push(result.rows[0]);
    }
    
    const instructor1 = createdUsers[0];
    const instructor2 = createdUsers[1];
    const student1 = createdUsers[2];
    const student2 = createdUsers[3];
    const student3 = createdUsers[4];
    const admin = createdUsers[5];
    console.log(`✅ Created ${createdUsers.length} users`);
    
    // 2. Create Courses
    console.log('\n📚 Creating courses...');
    const courses = [
      {
        title: 'Introduction to Computer Science',
        description: 'Fundamental concepts of computer science and programming',
        code: 'CS101',
        section: 'A',
        instructor_id: instructor1.id,
        is_active: true
      },
      {
        title: 'Data Structures and Algorithms',
        description: 'Advanced programming concepts and algorithm design',
        code: 'CS201',
        section: 'A',
        instructor_id: instructor1.id,
        is_active: true
      },
      {
        title: 'Database Systems',
        description: 'Introduction to database design and management',
        code: 'CS301',
        section: 'B',
        instructor_id: instructor2.id,
        is_active: true
      },
      {
        title: 'Web Development',
        description: 'Modern web development with React and Node.js',
        code: 'CS401',
        section: 'A',
        instructor_id: instructor2.id,
        is_active: true
      }
    ];
    
    const createdCourses = [];
    for (const course of courses) {
      const result = await client.query(`
        INSERT INTO courses (title, description, code, section, instructor_id, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, title, code, section
      `, [course.title, course.description, course.code, course.section, course.instructor_id, course.is_active]);
      createdCourses.push(result.rows[0]);
    }
    
    const cs101 = createdCourses[0];
    const cs201 = createdCourses[1];
    const cs301 = createdCourses[2];
    const cs401 = createdCourses[3];
    console.log(`✅ Created ${createdCourses.length} courses`);
    
    // 3. Create Enrollments
    console.log('\n🎓 Creating enrollments...');
    const enrollments = [
      { course_id: cs101.id, student_id: student1.id },
      { course_id: cs101.id, student_id: student2.id },
      { course_id: cs101.id, student_id: student3.id },
      { course_id: cs201.id, student_id: student1.id },
      { course_id: cs201.id, student_id: student2.id },
      { course_id: cs301.id, student_id: student2.id },
      { course_id: cs301.id, student_id: student3.id },
      { course_id: cs401.id, student_id: student1.id },
      { course_id: cs401.id, student_id: student3.id }
    ];
    
    for (const enrollment of enrollments) {
      await client.query(`
        INSERT INTO enrollments (course_id, student_id)
        VALUES ($1, $2)
      `, [enrollment.course_id, enrollment.student_id]);
    }
    console.log(`✅ Created ${enrollments.length} enrollments`);
    
    // 4. Create Assignments
    console.log('\n📝 Creating assignments...');
    const assignments = [
      {
        course_id: cs101.id,
        title: 'Programming Fundamentals Quiz',
        description: 'Basic programming concepts and syntax',
        instructions: 'Complete all questions within 60 minutes',
        max_score: 100,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        is_published: true,
        rubric: JSON.stringify({
          'Code Quality': 30,
          'Correctness': 40,
          'Documentation': 15,
          'Style': 15
        })
      },
      {
        course_id: cs101.id,
        title: 'Hello World Program',
        description: 'Create your first program',
        instructions: 'Write a program that prints "Hello, World!" in your chosen language',
        max_score: 50,
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        is_published: true,
        rubric: JSON.stringify({
          'Functionality': 50,
          'Code Quality': 30,
          'Documentation': 20
        })
      },
      {
        course_id: cs201.id,
        title: 'Binary Search Implementation',
        description: 'Implement binary search algorithm',
        instructions: 'Write a binary search function with proper error handling',
        max_score: 100,
        due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        is_published: true,
        rubric: JSON.stringify({
          'Algorithm Correctness': 40,
          'Code Quality': 30,
          'Edge Cases': 20,
          'Documentation': 10
        })
      }
    ];
    
    const createdAssignments = [];
    for (const assignment of assignments) {
      const result = await client.query(`
        INSERT INTO assignments (course_id, title, description, instructions, max_score, due_date, is_published, rubric)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, title, course_id
      `, [assignment.course_id, assignment.title, assignment.description, assignment.instructions, 
          assignment.max_score, assignment.due_date, assignment.is_published, assignment.rubric]);
      createdAssignments.push(result.rows[0]);
    }
    console.log(`✅ Created ${createdAssignments.length} assignments`);
    
    // 5. Create Announcements
    console.log('\n📢 Creating announcements...');
    const announcements = [
      {
        course_id: cs101.id,
        title: 'Welcome to CS101!',
        content: 'Welcome to Introduction to Computer Science. Please review the syllabus and course materials.',
        is_important: true,
        created_by: instructor1.id
      },
      {
        course_id: cs101.id,
        title: 'Assignment 1 Due Soon',
        content: 'Remember that Assignment 1 is due next week. Please submit your work on time.',
        is_important: false,
        created_by: instructor1.id
      },
      {
        course_id: cs201.id,
        title: 'Office Hours Update',
        content: 'Office hours have been updated to Tuesdays and Thursdays 2-4 PM.',
        is_important: false,
        created_by: instructor1.id
      }
    ];
    
    for (const announcement of announcements) {
      await client.query(`
        INSERT INTO announcements (course_id, title, content, is_important, created_by)
        VALUES ($1, $2, $3, $4, $5)
      `, [announcement.course_id, announcement.title, announcement.content, 
          announcement.is_important, announcement.created_by]);
    }
    console.log(`✅ Created ${announcements.length} announcements`);
    
    // 6. Create Materials
    console.log('\n📖 Creating course materials...');
    const materials = [
      {
        course_id: cs101.id,
        title: 'Introduction to Programming',
        description: 'Basic programming concepts and terminology',
        type: 'lesson',
        content: 'Programming is the process of creating instructions for computers...',
        is_published: true,
        order_index: 1,
        created_by: instructor1.id
      },
      {
        course_id: cs101.id,
        title: 'Variables and Data Types',
        description: 'Understanding different data types in programming',
        type: 'lesson',
        content: 'Variables are containers for storing data...',
        is_published: true,
        order_index: 2,
        created_by: instructor1.id
      },
      {
        course_id: cs101.id,
        title: 'Programming Best Practices',
        description: 'Guidelines for writing clean and maintainable code',
        type: 'resource',
        content: 'Always write clear comments and use meaningful variable names...',
        is_published: true,
        order_index: 3,
        created_by: instructor1.id
      },
      {
        course_id: cs201.id,
        title: 'Algorithm Complexity',
        description: 'Understanding Big O notation and algorithm efficiency',
        type: 'lesson',
        content: 'Big O notation describes the performance of an algorithm...',
        is_published: true,
        order_index: 1,
        created_by: instructor1.id
      }
    ];
    
    for (const material of materials) {
      await client.query(`
        INSERT INTO materials (course_id, title, description, type, content, is_published, order_index, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [material.course_id, material.title, material.description, material.type, 
          material.content, material.is_published, material.order_index, material.created_by]);
    }
    console.log(`✅ Created ${materials.length} course materials`);
    
    // 7. Create Sample Submissions
    console.log('\n📄 Creating sample submissions...');
    const submissions = [
      {
        assignment_id: createdAssignments[0].id,
        student_id: student1.id,
        content: 'Here is my solution to the programming quiz...',
        status: 'submitted',
        submitted_at: new Date()
      },
      {
        assignment_id: createdAssignments[0].id,
        student_id: student2.id,
        content: 'My answers to the quiz questions...',
        status: 'submitted',
        submitted_at: new Date()
      },
      {
        assignment_id: createdAssignments[1].id,
        student_id: student1.id,
        content: 'print("Hello, World!")',
        status: 'submitted',
        submitted_at: new Date()
      }
    ];
    
    const createdSubmissions = [];
    for (const submission of submissions) {
      const result = await client.query(`
        INSERT INTO submissions (assignment_id, student_id, content, status, submitted_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, student_id, assignment_id
      `, [submission.assignment_id, submission.student_id, submission.content, 
          submission.status, submission.submitted_at]);
      createdSubmissions.push(result.rows[0]);
    }
    console.log(`✅ Created ${createdSubmissions.length} submissions`);
    
    // 8. Create Sample Grades
    console.log('\n📊 Creating sample grades...');
    const grades = [
      {
        submission_id: createdSubmissions[0].id,
        score: 85,
        feedback: 'Good work! Your understanding of basic concepts is solid. Consider improving your code documentation.',
        rubric_scores: JSON.stringify({
          'Code Quality': 25,
          'Correctness': 35,
          'Documentation': 10,
          'Style': 15
        }),
        graded_by: 'ai',
        graded_at: new Date()
      },
      {
        submission_id: createdSubmissions[1].id,
        score: 92,
        feedback: 'Excellent work! Your solutions are correct and well-explained.',
        rubric_scores: JSON.stringify({
          'Code Quality': 28,
          'Correctness': 38,
          'Documentation': 14,
          'Style': 12
        }),
        graded_by: 'ai',
        graded_at: new Date()
      }
    ];
    
    for (const grade of grades) {
      await client.query(`
        INSERT INTO grades (submission_id, score, feedback, rubric_scores, graded_by, graded_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [grade.submission_id, grade.score, grade.feedback, grade.rubric_scores, 
          grade.graded_by, grade.graded_at]);
    }
    console.log(`✅ Created ${grades.length} grades`);
    
    console.log('\n🎉 Sample data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  👥 Users: ${createdUsers.length}`);
    console.log(`  📚 Courses: ${createdCourses.length}`);
    console.log(`  🎓 Enrollments: ${enrollments.length}`);
    console.log(`  📝 Assignments: ${createdAssignments.length}`);
    console.log(`  📢 Announcements: ${announcements.length}`);
    console.log(`  📖 Materials: ${materials.length}`);
    console.log(`  📄 Submissions: ${createdSubmissions.length}`);
    console.log(`  📊 Grades: ${grades.length}`);
    
    console.log('\n🔑 Test Credentials:');
    console.log('  Instructor: sarah.johnson@university.edu / password123');
    console.log('  Student: alice.smith@student.edu / password123');
    console.log('  Admin: admin@university.edu / password123');
    console.log('  (All passwords are properly hashed in the database)');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

seedSampleData();
