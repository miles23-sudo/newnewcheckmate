# Overview

CHECKmate is a Learning Management System (LMS) designed for Our Lady of Lourdes College, featuring AI-enabled assessment tools. The system supports three user roles: students, instructors, and administrators, each with dedicated dashboards and functionality. The application provides course management, assignment creation and submission, automated grading capabilities, and comprehensive user management features.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Client-side routing implemented with Wouter for lightweight navigation
- **UI Components**: shadcn/ui component library providing a comprehensive set of accessible components
- **Styling**: Tailwind CSS with custom design system following academic institutional design patterns
- **State Management**: TanStack Query for server state management and data fetching
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon Database serverless PostgreSQL
- **Session Management**: Connect-pg-simple for PostgreSQL-backed session storage
- **API Design**: RESTful API structure with `/api` prefix for all endpoints

## Design System
- **Theme**: Academic-focused design with deep blue primary colors and clean typography
- **Typography**: Inter font family optimized for educational content readability
- **Component Library**: Comprehensive UI components based on Radix UI primitives
- **Responsive Design**: Mobile-first approach with consistent spacing and layout patterns

## Database Schema
- **Users**: Supports student, instructor, and administrator roles with role-specific fields
- **Courses**: Course management with instructor assignment and enrollment tracking
- **Assignments**: Assignment creation with rubric support and due date management
- **Submissions**: Student submission tracking with file upload capabilities
- **Grades**: Automated and manual grading system with AI integration
- **Enrollments**: Many-to-many relationship between students and courses

## Authentication & Authorization
- **Role-Based Access**: Three-tier permission system (student, instructor, administrator)
- **Session Management**: Server-side session storage with PostgreSQL backing
- **Route Protection**: Role-based route protection with dashboard redirection

## File Structure
- **Monorepo Structure**: Shared schema and types between client and server
- **Client**: React application with component-based architecture
- **Server**: Express API with modular route organization
- **Shared**: Common database schema and type definitions

# External Dependencies

## Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL database provider
- **Drizzle ORM**: Type-safe database toolkit and query builder
- **WebSocket Support**: For real-time database connections via `ws` package

## UI & Design
- **Radix UI**: Comprehensive primitive component library for accessibility
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **Lucide React**: Icon library for consistent iconography
- **Google Fonts**: Inter font family for typography

## Development Tools
- **TypeScript**: Type safety across the entire application
- **Vite**: Build tool with hot module replacement and optimization
- **ESBuild**: Fast JavaScript/TypeScript bundler for production builds
- **Replit Integration**: Development environment integration with runtime error handling

## Form & Validation
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: TypeScript-first schema validation library
- **Hookform Resolvers**: Integration between React Hook Form and Zod

## State Management
- **TanStack Query**: Server state management with caching and synchronization
- **React Router**: Client-side routing with Wouter for lightweight navigation

## Styling & Animation
- **Class Variance Authority**: Utility for creating variant-based component APIs
- **Tailwind Merge**: Utility for merging Tailwind CSS classes
- **Date-fns**: Date manipulation and formatting library

# Recent Changes

## Real-Time Data Updates Implementation (September 2024)
- **Auto-Refresh Polling**: Implemented automatic data refresh every 5 seconds across all dashboards using TanStack Query's `refetchInterval` option
  - **Student Dashboard**: Auto-refreshes courses, chat messages, announcements, assignments, and grades
  - **Instructor Dashboard**: Auto-refreshes teaching courses, course stats, assignments, and recent submissions
  - **Admin Dashboard**: Auto-refreshes users, pending registrations, and system statistics
- **Architecture Decision**: Chose polling-based auto-refresh over WebSocket implementation for security and simplicity
  - Polling provides adequate real-time experience for LMS use case (5-second intervals)
  - Avoids complexity of WebSocket session validation and authentication
  - More reliable and easier to maintain than WebSocket connections
- **Future Consideration**: WebSocket implementation documented for future enhancement when session-based authentication can be properly integrated

## Settings Functionality Implementation (December 2024)
- **API Endpoints**: Created comprehensive API endpoints for saving user profile and settings data:
  - `/api/users/:id/profile` - For updating user profile information
  - `/api/users/:id/settings` - For updating notification and privacy preferences
- **Complete Settings Implementation**: Successfully implemented full settings functionality across all three user roles:
  - **Student Dashboard**: Profile, notification, and privacy settings with working save functionality
  - **Instructor Dashboard**: Profile, notification, and privacy settings with working save functionality  
  - **Admin Dashboard**: Profile, notification, and privacy settings with working save functionality
- **State Management**: Added comprehensive state management for all settings sections with proper form handling
- **User Experience**: Implemented loading states, success/error feedback via toast notifications, and proper error handling
- **API Integration**: Connected frontend forms to backend endpoints with proper authentication and validation
- **Critical Issue Resolution**: Fixed non-functioning save buttons that were previously placeholder implementations

This completes the settings functionality requirements ensuring that all settings changes are properly applied and saved across all user roles in the CHECKmate Learning Management System.