import * as yup from 'yup';

// Project validation schema
export const projectSchema = yup.object().shape({
  title: yup.string()
    .required('Title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
  
  description: yup.string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  
  students: yup.array()
    .of(
      yup.object().shape({
        name: yup.string()
          .required('Student name is required')
          .min(2, 'Student name must be at least 2 characters'),
        email: yup.string()
          .email('Invalid email format')
          .required('Student email is required'),
        studentId: yup.string()
          .optional()
      })
    )
    .max(4, 'Maximum 4 students allowed per project'),
  
  supervisorId: yup.string()
    .required('Supervisor is required'),
  
  coSupervisorId: yup.string()
    .optional()
    .nullable(),
  
  sustainability: yup.string()
    .required('Sustainability information is required')
    .min(10, 'Sustainability description must be at least 10 characters')
    .max(500, 'Sustainability description must be less than 500 characters')
});

// Teacher validation schema
export const teacherSchema = yup.object().shape({
  name: yup.string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  
  email: yup.string()
    .email('Invalid email format')
    .required('Email is required'),
  
  department: yup.string()
    .optional()
    .max(50, 'Department must be less than 50 characters'),
  
  specialization: yup.string()
    .optional()
    .max(100, 'Specialization must be less than 100 characters')
});

// User registration validation schema
export const userRegistrationSchema = yup.object().shape({
  fullName: yup.string()
    .required('Full name is required')
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name must be less than 50 characters'),
  
  email: yup.string()
    .email('Invalid email format')
    .required('Email is required'),
  
  password: yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(50, 'Password must be less than 50 characters'),
  
  gender: yup.string()
    .required('Gender is required')
    .oneOf(['male', 'female', 'other'], 'Invalid gender'),
  
  age: yup.number()
    .required('Age is required')
    .min(16, 'Age must be at least 16')
    .max(100, 'Age must be less than 100'),
  
  role: yup.string()
    .optional()
    .oneOf(['user', 'admin', 'teacher'], 'Invalid role')
    .default('user')
});

// User login validation schema
export const userLoginSchema = yup.object().shape({
  email: yup.string()
    .email('Invalid email format')
    .required('Email is required'),
  
  password: yup.string()
    .required('Password is required')
});

// Password reset validation schema
export const passwordResetSchema = yup.object().shape({
  token: yup.string()
    .required('Reset token is required'),
  
  newPassword: yup.string()
    .required('New password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(50, 'Password must be less than 50 characters')
});

// Email validation schema
export const emailSchema = yup.object().shape({
  email: yup.string()
    .email('Invalid email format')
    .required('Email is required')
});
