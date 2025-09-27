# CHECKmate Setup Guide

This is a classroom management system built with React, TypeScript, and PostgreSQL.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A PostgreSQL database (we recommend Neon for easy setup)

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up the database:**
   
   **Option A: Use Neon (Recommended)**
   - Go to [https://console.neon.tech/](https://console.neon.tech/)
   - Sign up for a free account
   - Create a new project
   - Copy the connection string from the dashboard

   **Option B: Use any PostgreSQL database**
   - Set up a PostgreSQL database locally or use any cloud provider
   - Get the connection string

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Configure your database:**
   Edit the `.env` file and add your database URL:
   ```
   DATABASE_URL=postgresql://username:password@hostname:port/database?sslmode=require
   SESSION_SECRET=your-session-secret-here
   ```

5. **Set up the database schema:**
   ```bash
   npm run db:push
   ```

6. **Start the development server:**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push database schema changes
- `npm run check` - Type check the codebase

## Database Schema

The application uses Drizzle ORM with PostgreSQL. The schema includes:

- Users (students, instructors, administrators)
- Courses
- Assignments and Submissions
- Grades
- Announcements
- Materials
- Enrollments

## Troubleshooting

### DATABASE_URL Error
If you see "DATABASE_URL must be set" error:
1. Make sure you have a `.env` file in the project root
2. Check that the DATABASE_URL is correctly formatted
3. Ensure your database is accessible and running

### Database Connection Issues
- Verify your database credentials
- Check if your database server is running
- Ensure the connection string format is correct for PostgreSQL

## Features

- **Student Dashboard**: View courses, assignments, grades
- **Instructor Dashboard**: Manage courses, create assignments, grade submissions
- **Admin Dashboard**: User management, system administration
- **Course Management**: Create and manage courses
- **Assignment System**: Create assignments, collect submissions
- **Grading System**: Grade submissions and provide feedback
- **Announcements**: Course-wide announcements
- **Material Management**: Upload and organize course materials

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: Radix UI, Lucide React
- **State Management**: TanStack Query
- **Routing**: Wouter

