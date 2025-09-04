# Bus Safety Portal

## Overview

A comprehensive web application for daily pre-travel safety inspections designed for bus operations. The system provides digital checklist management, compliance tracking, and historical record keeping to ensure vehicle safety standards are maintained. Built as a full-stack application with modern React frontend and Express backend, featuring secure authentication and PostgreSQL data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent, accessible design
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **Form Handling**: React Hook Form with Zod validation for robust form management
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API development
- **Language**: TypeScript with ES modules for modern JavaScript features
- **Database ORM**: Drizzle ORM for type-safe database operations and migrations
- **Authentication**: OpenID Connect (OIDC) integration with Passport.js for secure user authentication
- **Session Management**: Express sessions with PostgreSQL storage for persistent user sessions
- **API Design**: RESTful endpoints with proper HTTP status codes and error handling

### Database Design
- **Primary Database**: PostgreSQL for reliable data persistence
- **Schema Management**: Drizzle Kit for database migrations and schema evolution
- **Connection Pooling**: Neon serverless driver for scalable database connections
- **Key Tables**:
  - Users table for authentication and profile management
  - Checklists table for safety inspection records
  - Sessions table for secure session storage

### Authentication & Authorization
- **Provider**: Replit OIDC for seamless authentication integration
- **Session Security**: HTTP-only cookies with secure flags and configurable TTL
- **Route Protection**: Middleware-based authentication checks for protected endpoints
- **User Management**: Automatic user creation and profile updates on login

### Development & Deployment
- **Environment**: Replit-optimized with development tooling and error overlays
- **Code Quality**: TypeScript strict mode with comprehensive type checking
- **Development Server**: Hot module replacement and runtime error handling
- **Build Process**: Separate client and server builds with optimized asset bundling

## External Dependencies

### Core Infrastructure
- **Database**: PostgreSQL via Neon serverless for cloud-native data storage
- **Authentication**: Replit OIDC service for user identity management
- **Session Store**: PostgreSQL-backed session storage using connect-pg-simple

### UI & Design System
- **Component Library**: Radix UI for accessible, unstyled component primitives
- **Icon System**: Lucide React for consistent iconography
- **Typography**: Google Fonts integration (Roboto, DM Sans, Fira Code, Geist Mono)
- **Styling**: Tailwind CSS with PostCSS for advanced CSS processing

### Development Tools
- **Package Manager**: npm with lockfile for dependency management
- **Build Tools**: Vite for client bundling, esbuild for server compilation
- **Development Environment**: Replit-specific plugins for enhanced development experience
- **Type Checking**: TypeScript compiler with strict configuration

### Runtime Libraries
- **Date Handling**: date-fns for reliable date manipulation and formatting
- **Validation**: Zod for runtime type validation and schema definition
- **HTTP Client**: Native fetch API with custom request wrapper for API communication
- **WebSocket**: ws library for Neon database connections in serverless environment