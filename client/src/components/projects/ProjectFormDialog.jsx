import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
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
} from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import useProjectStore from '../../store/useProjectStore';
import useTeacherStore from '../../store/useTeacherStore';

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

const ProjectFormDialog = ({ open, onClose, project = null, onSubmit }) => {
  const { teachers } = useTeacherStore();
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
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
    if (project) {
      reset({
        title: project.title || '',
        description: project.description || '',
        sustainability: project.sustainability || '',
        supervisor: project.supervisor || '',
        coSupervisor: project.coSupervisor || '',
        students: project.students || [{ name: '', email: '' }],
        image: null,
      });
      if (project.imageUrl) {
        setImagePreview(project.imageUrl);
      }
    } else {
      reset({
        title: '',
        description: '',
        sustainability: '',
        supervisor: '',
        coSupervisor: '',
        students: [{ name: '', email: '' }],
        image: null,
      });
      setImagePreview(null);
    }
  }, [project, reset]);

  useEffect(() => {
    if (watchedImage && watchedImage[0]) {
      const file = watchedImage[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else if (!project) {
      setImagePreview(null);
    }
  }, [watchedImage, project]);

  const handleFormSubmit = async (data) => {
    setLoading(true);
    try {
      const projectData = {
        ...data,
        image: data.image?.[0] || null,
      };
      await onSubmit(projectData);
      onClose();
    } catch (error) {
      toast.error('An error occurred while saving the project');
    } finally {
      setLoading(false);
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {project ? 'Edit Project' : 'Create New Project'}
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Project Title */}
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Project Title"
                  fullWidth
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
            <Paper sx={{ p: 2, backgroundColor: 'background.default' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Students (1-4 students)</Typography>
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
                <Box key={field.id} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="subtitle2">Student {index + 1}</Typography>
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
                          error={!!errors.students?.[index]?.email}
                          helperText={errors.students?.[index]?.email?.message}
                        />
                      )}
                    />
                  </Box>
                  {index < fields.length - 1 && <Divider sx={{ mt: 2 }} />}
                </Box>
              ))}
              
              {errors.students?.message && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {errors.students.message}
                </Alert>
              )}
            </Paper>

            {/* Image Upload */}
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Project Image (Optional)
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
                      >
                        Upload Project Image
                      </Button>
                    </label>
                    
                    {imagePreview && (
                      <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <img
                          src={imagePreview}
                          alt="Project preview"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '200px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                )}
              />
            </Box>
          </Stack>
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            {loading ? 'Saving...' : (project ? 'Update Project' : 'Create Project')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ProjectFormDialog;
