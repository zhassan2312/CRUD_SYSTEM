# Backend Architecture Documentation

## Project Structure

```
server/
├── src/
│   ├── config/             # Configuration files
│   │   ├── firebase.config.js
│   │   ├── env.config.js
│   │   └── gcloud.config.js
│   │
│   ├── constants/          # Application constants
│   │   └── notifications.js
│   │
│   ├── controllers/        # Route controllers
│   │   ├── admin.controller.js
│   │   ├── project.controller.js
│   │   ├── teacher.controller.js
│   │   ├── user.controller.js
│   │   └── notificationController.js
│   │
│   ├── middlewares/        # Custom middleware
│   │   ├── authMiddleware.js
│   │   ├── roleMiddleware.js
│   │   └── validateMiddleware.js
│   │
│   ├── routes/            # API route definitions
│   │   ├── admin.route.js
│   │   ├── project.route.js
│   │   ├── teacher.route.js
│   │   ├── user.route.js
│   │   └── notificationRoutes.js
│   │
│   ├── services/          # Business logic services
│   │   ├── emailService.js
│   │   └── notificationService.js
│   │
│   ├── templates/         # Email templates
│   │   └── email/
│   │       ├── base.html
│   │       ├── project-status-change.html
│   │       ├── new-assignment.html
│   │       ├── system-announcement.html
│   │       └── general.html
│   │
│   ├── utils/             # Utility functions
│   │   ├── responseHelpers.js
│   │   └── validators.js
│   │
│   └── server.js          # Application entry point
│
├── package.json
└── README.md
```

## Service Layer Architecture

### Email Service (`services/emailService.js`)
- **Purpose**: Handle all email-related operations
- **Features**:
  - Template loading and caching
  - Dynamic template variable replacement
  - Template configuration based on email type
  - Fallback email generation
  - Firebase integration for email queue

### Notification Service (`services/notificationService.js`)
- **Purpose**: Manage in-app notifications
- **Features**:
  - Create, read, update, delete notifications
  - Bulk notification creation
  - User preference management
  - Email notification integration
  - Filtering and pagination

## Email Template System

### Base Template (`templates/email/base.html`)
- Responsive HTML structure
- Consistent styling across all emails
- Dynamic color theming
- Footer with company information

### Template Types:
1. **Project Status Change** - Notify users of project status updates
2. **New Assignment** - Notify supervisors of new project assignments
3. **System Announcement** - General system notifications
4. **General** - Fallback template for basic notifications

### Template Variables:
- `{{userName}}` - Recipient name
- `{{projectTitle}}` - Project title
- `{{newStatus}}` - Project status
- `{{reviewerComment}}` - Optional reviewer feedback
- `{{projectUrl}}` - Link to project details

## Constants and Configuration

### Notification Constants (`constants/notifications.js`)
- Notification types (INFO, SUCCESS, WARNING, ERROR)
- Categories (GENERAL, PROJECT, SYSTEM, ADMIN)
- Email template types
- Status colors for UI consistency
- Default user preferences

## Response Helpers (`utils/responseHelpers.js`)

### Standardized API Responses:
- `sendSuccess()` - Success responses with data
- `sendError()` - Error responses with details
- `sendValidationError()` - Validation error handling
- `sendNotFound()` - 404 responses
- `sendUnauthorized()` - 401 responses
- `sendForbidden()` - 403 responses

### Error Handling:
- `asyncHandler()` - Wrapper for async route handlers
- `globalErrorHandler()` - Centralized error handling middleware

## Authentication & Authorization

### Auth Middleware (`middlewares/authMiddleware.js`)
- JWT token verification
- User data attachment to request object
- Firebase Firestore user validation
- Support for both `id` and `uid` properties

### Role Middleware (`middlewares/roleMiddleware.js`)
- Role-based access control
- Multiple role support
- Hierarchical permission checking

## API Design Patterns

### Controller Structure:
```javascript
export const controllerFunction = asyncHandler(async (req, res) => {
  const result = await service.method(params);
  sendSuccess(res, result, "Operation successful");
});
```

### Error Handling:
```javascript
try {
  await service.riskyOperation();
} catch (error) {
  if (error.message === 'Specific Error') {
    return sendNotFound(res, 'Resource');
  }
  throw error; // Let global handler catch it
}
```

## Best Practices Implemented

1. **Separation of Concerns**: Controllers handle HTTP, services handle business logic
2. **Error Handling**: Centralized error handling with consistent responses
3. **Template System**: Reusable email templates with dynamic content
4. **Configuration Management**: Environment-based configuration
5. **Caching**: Template caching for improved performance
6. **Logging**: Structured logging throughout the application
7. **Validation**: Input validation and sanitization
8. **Security**: Authentication and authorization middleware

## Environment Variables Required

```env
# Firebase Configuration
PROJECT_ID=your-project-id
STORAGE_BUCKET=your-storage-bucket
AUTH_DOMAIN=your-auth-domain

# JWT Configuration
JWT_SECRET=your-jwt-secret

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## Usage Examples

### Sending Notifications with Email:
```javascript
import { sendNotificationWithEmail } from '../controllers/notificationController.js';
import { EMAIL_TEMPLATE_TYPES } from '../constants/notifications.js';

// Send project status change notification
await sendNotificationWithEmail(
  userId,
  {
    title: 'Project Status Updated',
    message: 'Your project status has changed',
    type: NOTIFICATION_TYPES.INFO,
    category: NOTIFICATION_CATEGORIES.PROJECT
  },
  {
    email: user.email,
    subject: 'Project Status Update',
    templateData: {
      userName: user.fullName,
      projectTitle: project.title,
      newStatus: project.status
    }
  },
  EMAIL_TEMPLATE_TYPES.PROJECT_STATUS_CHANGE
);
```

### Creating Custom Templates:
1. Add new template file in `templates/email/`
2. Update `EMAIL_TEMPLATE_TYPES` constant
3. Add template configuration in `emailService.js`
4. Use the new template type when sending emails

This modular architecture provides:
- **Maintainability**: Clear separation of concerns
- **Scalability**: Easy to add new features and templates
- **Testability**: Services can be unit tested independently
- **Consistency**: Standardized responses and error handling
- **Performance**: Template caching and optimized queries
