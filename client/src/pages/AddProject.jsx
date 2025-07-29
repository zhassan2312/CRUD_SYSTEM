import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider,
  Stack,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Upload as UploadIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import useProjectStore from '../store/useProjectStore';
import useTeacherStore from '../store/useTeacherStore';

// Validation schema
const projectSchema = yup.object({
  title: yup.string().required('Project title is required').min(3, 'Title must be at least 3 characters'),
  description: yup.string().required('Description is required').min(10, 'Description must be at least 10 characters'),
  sustainability: yup.string().required('Sustainability impact is required').min(20, 'Sustainability section must be at least 20 characters'),
  supervisor: yup.string().required('Supervisor is required'),
  coSupervisor: yup.string(),
  students: yup.array().of(
    yup.object({
      name: yup.string().required('Student name is required'),
      email: yup.string().email('Invalid email format').required('Student email is required'),
    })
  ).min(1, 'At least one student is required').max(4, 'Maximum 4 students allowed'),
  image: yup.mixed(),
});

const AddProject = () => {
  const { createProject, loading } = useProjectStore();
  const { teachers, fetchTeachers } = useTeacherStore();
  const [imagePreview, setImagePreview] = useState(null);
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(projectSchema),
    defaultValues: {
      title: '',
      description: '',
      sustainability: '',
      supervisor: '',
      coSupervisor: '',
      students: [{ name: '', email: '' }],
      image: null,
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'students'
  });

  const watchedImage = watch('image');

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (watchedImage && watchedImage[0]) {
      const file = watchedImage[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  }, [watchedImage]);

  const onSubmit = async (data) => {
    try {
      const projectData = {
        ...data,
        image: data.image?.[0] || null,
      };

      const result = await createProject(projectData);

      if (result.success) {
        toast.success(result.message);
        navigate('/projects');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('An error occurred while creating the project');
    }
  };

  const addStudent = () => {
    if (fields.length < 4) {
      append({ name: '', email: '' });
    }
  };

  const removeStudent = (index) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <Container maxWidth="md">
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton onClick={() => navigate('/projects')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Create New Project
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Fill in the details to submit your project proposal
          </Typography>
        </Box>
      </Box>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={4}>
              {/* Project Title */}
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Project Title"
                    fullWidth
                    placeholder="Enter a descriptive title for your project"
                    error={!!errors.title}
                    helperText={errors.title?.message}
                  />
                )}
              />

              {/* Project Description */}
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Project Description"
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Provide a detailed description of your project, including objectives, methodology, and expected outcomes..."
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />

              {/* Sustainability Impact */}
              <Controller
                name="sustainability"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Sustainability Impact"
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Describe how this project contributes to sustainability and environmental impact..."
                    error={!!errors.sustainability}
                    helperText={errors.sustainability?.message}
                  />
                )}
              />

              {/* Supervisors */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="supervisor"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.supervisor}>
                      <InputLabel>Supervisor *</InputLabel>
                      <Select {...field} label="Supervisor *">
                        {teachers.map((teacher) => (
                          <MenuItem key={teacher.id} value={teacher.fullName}>
                            {teacher.fullName} - {teacher.department}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.supervisor && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                          {errors.supervisor.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />

                <Controller
                  name="coSupervisor"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Co-Supervisor (Optional)</InputLabel>
                      <Select {...field} label="Co-Supervisor (Optional)">
                        <MenuItem value="">None</MenuItem>
                        {teachers.map((teacher) => (
                          <MenuItem key={teacher.id} value={teacher.fullName}>
                            {teacher.fullName} - {teacher.department}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Box>

              {/* Students Section */}
              <Paper sx={{ p: 3, backgroundColor: 'background.default' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">Project Team (1-4 students)</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={addStudent}
                    disabled={fields.length >= 4}
                    size="small"
                  >
                    Add Student
                  </Button>
                </Box>

                {fields.map((field, index) => (
                  <Box key={field.id} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Typography variant="subtitle1" color="primary">
                        Student {index + 1}
                      </Typography>
                      {fields.length > 1 && (
                        <IconButton
                          size="small"
                          onClick={() => removeStudent(index)}
                          color="error"
                        >
                          <CloseIcon />
                        </IconButton>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Controller
                        name={`students.${index}.name`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Student Name"
                            fullWidth
                            placeholder="Full name"
                            error={!!errors.students?.[index]?.name}
                            helperText={errors.students?.[index]?.name?.message}
                          />
                        )}
                      />
                      <Controller
                        name={`students.${index}.email`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Student Email"
                            type="email"
                            fullWidth
                            placeholder="student@university.edu"
                            error={!!errors.students?.[index]?.email}
                            helperText={errors.students?.[index]?.email?.message}
                          />
                        )}
                      />
                    </Box>
                    {index < fields.length - 1 && <Divider sx={{ mt: 3 }} />}
                  </Box>
                ))}
                
                {errors.students?.message && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {errors.students.message}
                  </Alert>
                )}
              </Paper>

              {/* Image Upload */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  Project Image (Optional)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Upload an image that represents your project (max 5MB)
                </Typography>
                <Controller
                  name="image"
                  control={control}
                  render={({ field: { onChange, value, ...field } }) => (
                    <Box>
                      <input
                        {...field}
                        type="file"
                        accept="image/*"
                        onChange={(e) => onChange(e.target.files)}
                        style={{ display: 'none' }}
                        id="image-upload"
                      />
                      <label htmlFor="image-upload">
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<UploadIcon />}
                          fullWidth
                          sx={{ py: 2 }}
                        >
                          {imagePreview ? 'Change Project Image' : 'Upload Project Image'}
                        </Button>
                      </label>
                      
                      {imagePreview && (
                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                          <img
                            src={imagePreview}
                            alt="Project preview"
                            style={{
                              maxWidth: '100%',
                              maxHeight: '300px',
                              borderRadius: '8px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                  )}
                />
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'flex-end' }}>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/projects')}
            disabled={loading}
            size="large"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <AddIcon />}
            size="large"
          >
            {loading ? 'Creating Project...' : 'Create Project'}
          </Button>
        </Box>
      </form>
    </Container>
  );
};

export default AddProject;
