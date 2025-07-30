import * as yup from 'yup';

// Validation middleware
export const validate = (schema) => {
  return async (req, res, next) => {
    try {
      await schema.validate(req.body, { abortEarly: false });
      next();
    } catch (error) {
      const errors = error.inner?.map(err => ({
        field: err.path,
        message: err.message
      })) || [{ message: error.message }];
      
      return res.status(400).json({ 
        message: 'Validation failed',
        errors 
      });
    }
  };
};
