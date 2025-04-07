# Hotel Room Booking System

A full-stack application for hotel room booking management with secure authentication, payment integration, and responsive UI.

## Project Structure

- **Backend**: ASP.NET Core 6.0 Web API
- **Frontend**: Next.js 15 with React 19

## Features

### Core Functionality
- Hotel room browsing and booking
- User authentication (JWT + Google OAuth)
- Secure payment processing via VNPay
- Email notifications
- Image management via Cloudinary

### Security Features
- JWT authentication
- Password hashing with BCrypt
- Cloudflare Turnstile bot protection
- Redis for token management

## Tech Stack

### Backend (.NET 6)
- Entity Framework Core with SQL Server
- JWT Authentication
- Redis caching
- OData for API queries
- MailKit for email services
- Cloudinary integration

### Frontend (Next.js)
- React 19
- Radix UI components
- Tailwind CSS
- Axios for API communication
- Google OAuth integration

## Setup Instructions

### Backend Setup
1. Ensure .NET 6 SDK is installed
2. Install SQL Server and Redis
3. Update connection strings in `appsettings.Development.json`
4. Run migrations: `dotnet ef database update`
5. Start API: `dotnet run`

### Frontend Setup
1. Install Node.js and npm
2. Navigate to client directory: `cd PRN231Client`
3. Install dependencies: `npm install`
4. Run development server: `npm run dev`

## Environment Configuration

Update the following configuration files:
- `appsettings.Development.json` - Database, Redis, OAuth, and service credentials
- Client environment variables for API URLs

## API Documentation

API documentation is available through Swagger UI at `/swagger` when running the backend.

## Deployment

- Backend: Deploy as ASP.NET Core application to IIS or Azure
- Frontend: Build with `npm run build` and deploy static files to hosting service

## Git Integration

Ensure the client folder is properly added to your repository:
```bash
git add PRN231Client/
git commit -m "Add client application"
git push
```

## Notes

Make sure to secure sensitive information in environment variables or secrets management before deployment.
