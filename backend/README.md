# Backend API

A professional Node.js/Express backend API with MongoDB Native Driver, authentication, and comprehensive security features.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Database**: MongoDB Native Driver (no ODM overhead)
- **Security**: Helmet, CORS, rate limiting, input validation
- **Logging**: Winston logger with file and console transports
- **Testing**: Jest testing framework with Supertest
- **Code Quality**: ESLint and Prettier for consistent code style
- **Error Handling**: Comprehensive error handling middleware
- **API Documentation**: RESTful API design

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Native Driver)
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator
- **Security**: Helmet, CORS, bcryptjs
- **Logging**: Winston
- **Testing**: Jest, Supertest
- **Code Quality**: ESLint, Prettier

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Installation

1. **Navigate to backend directory**

   ```bash
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env` file and update the values:

   ```bash
   cp .env .env.local
   ```

   - Update the following variables:
     - `MONGODB_URI`: Your MongoDB connection string
     - `JWT_SECRET`: A strong secret key for JWT tokens
     - `PORT`: Server port (default: 5000)

4. **Start MongoDB**
   - If using local MongoDB, ensure it's running on port 27017
   - For MongoDB Atlas, update the connection string in `.env`

5. **Run the application**

   ```bash
   # Development mode with auto-restart
   npm run dev

   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000`

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run test:ci` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/update-password` - Update password
- `POST /api/auth/forgot-password` - Request password reset
- `PUT /api/auth/reset-password/:token` - Reset password

### Users (Admin only)

- `GET /api/users` - Get all users (paginated)
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user

### Health Check

- `GET /api/health` - Server health status

## Project Structure

```
backend/
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── routes/          # API routes
├── tests/           # Test files
├── utils/           # Database operations
├── logs/            # Log files
├── server.js        # Main server file
├── package.json     # Dependencies and scripts
├── .env             # Environment variables
├── .eslintrc.json   # ESLint configuration
├── .prettierrc      # Prettier configuration
└── jest.config.js   # Jest configuration
```

## Environment Variables

| Variable       | Description               | Default                                    |
| -------------- | ------------------------- | ------------------------------------------ |
| `NODE_ENV`     | Environment mode          | development                                |
| `PORT`         | Server port               | 5000                                       |
| `MONGODB_URI`  | MongoDB connection string | mongodb://localhost:27017/finalyearproject |
| `JWT_SECRET`   | JWT secret key            | -                                          |
| `JWT_EXPIRE`   | JWT expiration time       | 7d                                         |
| `FRONTEND_URL` | Frontend URL for CORS     | http://localhost:5173                      |
| `EMAIL_SERVICE`| Nodemailer service name   | gmail                                      |
| `EMAIL_USER`   | SMTP sender email address | your-email@gmail.com                       |
| `EMAIL_APP_PASSWORD` | SMTP app password   | your-gmail-app-password                    |

## Email Configuration

This project supports sending verification and complaint notification emails via Gmail SMTP.

- Set `EMAIL_SERVICE=gmail` for Gmail transport.
- Use `EMAIL_USER` for the Gmail address you want to send from.
- Use `EMAIL_APP_PASSWORD` for the Gmail app password (recommended) or `EMAIL_PASS` if you prefer a generic password variable.

If you need to use explicit SMTP settings instead of `EMAIL_SERVICE`, the backend already supports:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API rate limiting (100 requests/15min)
- **Input Validation**: Request validation with express-validator
- **Password Hashing**: bcryptjs for password encryption
- **JWT Authentication**: Secure token-based authentication
- **Error Handling**: Comprehensive error responses

## Database Operations

This backend uses the MongoDB Native Driver for direct database operations. All database operations are abstracted in `utils/database.js` with the following modules:

- **userOperations**: User CRUD operations
- **passwordUtils**: Password hashing and comparison
- **jwtUtils**: JWT token generation and verification

## Testing

Run tests with coverage:

```bash
npm run test:ci
```

Test files are located in the `tests/` directory and use Jest with Supertest for API testing.

## Code Quality

- **ESLint**: JavaScript linting
- **Prettier**: Code formatting
- Run both: `npm run lint && npm run format`

## Logging

Application logs are stored in the `logs/` directory:

- `error.log` - Error logs
- `combined.log` - All logs

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Run linting and formatting before committing
4. Update documentation as needed

## License

This project is licensed under the MIT License.
