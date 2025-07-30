# Simplified Backend Structure

This is your new simplified backend structure with clean separation of concerns and ES6 module syntax.

## 📁 Structure

```
server/src/
├── controllers/
│   ├── authController.js      # Authentication logic
│   ├── projectController.js   # Project management
│   └── teacherController.js   # Teacher management
│
├── middlewares/
│   ├── authMiddleware.js      # JWT authentication
│   ├── roleMiddleware.js      # Role-based access
│   └── validateMiddleware.js  # Request validation
│
├── routes/
│   ├── authRoutes.js         # Authentication routes
│   ├── projectRoutes.js      # Project routes
│   └── teacherRoutes.js      # Teacher routes (admin only)
│
├── utils/
│   └── validators.js         # Yup validation schemas
│
├── config/                   # Your existing config files
└── newServer.js             # New simplified server entry point
```

## 🔐 Auth Routes (`/api/auth`)

- `POST /register` - Register new user with optional profile picture
- `POST /login` - User login
- `POST /forgot-password` - Send password reset email
- `POST /reset-password` - Reset password with token
- `POST /verify-email` - Verify email with token
- `POST /logout` - User logout

## 📊 Project Routes (`/api/projects`)

**User Routes (authenticated):**
- `GET /` - Get user's projects
- `POST /` - Create new project with validation
- `POST /:projectId/upload-image` - Upload project image
- `DELETE /:projectId` - Delete own project

**Admin Routes:**
- `GET /admin` - Get all projects
- `PUT /:projectId/status` - Update project status

## 👨‍🏫 Teacher Routes (`/api/teachers`) - Admin Only

- `GET /` - Get all teachers
- `GET /:id` - Get teacher by ID
- `POST /` - Add new teacher
- `PUT /:id` - Update teacher
- `DELETE /:id` - Delete teacher

## 🛡️ Security Features

- JWT token authentication
- Role-based access control
- Request validation with Yup schemas
- File upload validation (images only, 5MB limit)
- Cookie-based auth with httpOnly cookies

## 🚀 How to Use

1. **Start the new server:**
   ```bash
   cd server
   node src/newServer.js
   ```

2. **Test the endpoints:**
   - Health check: `GET /api/health`
   - Register: `POST /api/auth/register`
   - Login: `POST /api/auth/login`

## 🔄 Migration from Old Structure

The new structure maintains all your existing functionality but with:
- Cleaner separation of concerns
- Better validation
- Simplified authentication
- More maintainable code
- ES6 module syntax throughout

## 📝 Validation Schemas

All requests are validated using Yup schemas:
- User registration validation
- Project creation validation
- Teacher management validation
- Email format validation

## 🎯 Key Improvements

1. **Simplified Authentication** - No complex token handling
2. **Better Organization** - Clear separation by feature
3. **Validation** - Comprehensive request validation
4. **Error Handling** - Consistent error responses
5. **Role-Based Access** - Clean role checking middleware
6. **File Uploads** - Consistent file handling across routes

Your Firebase configuration and existing database structure remain unchanged!
