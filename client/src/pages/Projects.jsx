import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CardMedia,
  Paper,
  Divider,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FolderOpen as ProjectIcon,
  Upload as UploadIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import useProjectStore from '../store/useProjectStore';
import useTeacherStore from '../store/useTeacherStore';
import ProjectStatusBadge from '../components/ProjectStatusBadge';

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

const Projects = () => {
  const { 
    userProjects, 
    fetchUserProjects, 
    createProject, 
    updateProject, 
    deleteProject, 
    loading 
  } = useProjectStore();
  const { teachers, fetchTeachers } = useTeacherStore();
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
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
    fetchUserProjects();
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

  const handleOpenDialog = (project = null) => {
    if (project) {
      setEditingProject(project);
      reset({
        title: project.title,
        description: project.description,
        sustainability: project.sustainability,
        supervisor: project.supervisor,
        coSupervisor: project.coSupervisor || '',
        students: project.students || [{ name: '', email: '' }],
        image: null,
      });
      if (project.imageUrl) {
        setImagePreview(project.imageUrl);
      }
    } else {
      setEditingProject(null);
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
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProject(null);
    setImagePreview(null);
    reset();
  };

  const onSubmit = async (data) => {
    try {
      const projectData = {
        ...data,
        image: data.image?.[0] || null,
      };

      let result;
      if (editingProject) {
        result = await updateProject(editingProject.id, projectData);
      } else {
        result = await createProject(projectData);
      }

      if (result.success) {
        toast.success(result.message);
        handleCloseDialog();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('An error occurred while saving the project');
    }
  };

  const handleDelete = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      const result = await deleteProject(projectId);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in-progress':
        return 'primary';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            My Projects
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and track your submitted projects
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={loading}
        >
          New Project
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {userProjects.map((project) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={project.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {project.imageUrl && (
                  <CardMedia
                    component="img"
                    height="200"
                    image={project.imageUrl}
                    alt={project.title}
                  />
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <ProjectIcon color="primary" />
                    <Typography variant="h6" component="h2">
                      {project.title}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {project.description?.substring(0, 100)}
                    {project.description?.length > 100 && '...'}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <ProjectStatusBadge 
                      status={project.status || 'pending'} 
                      size="small"
                    />
                  </Box>

                  {project.supervisor && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <SchoolIcon sx={{ fontSize: 16 }} />
                      <Typography variant="body2" color="text.secondary">
                        Supervisor: {project.supervisor}
                      </Typography>
                    </Box>
                  )}

                  {project.students && project.students.length > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PersonIcon sx={{ fontSize: 16 }} />
                      <Typography variant="body2" color="text.secondary">
                        Students: {project.students.length}
                      </Typography>
                    </Box>
                  )}

                  <Typography variant="caption" color="text.secondary">
                    Created: {new Date(project.createdAt?.toDate ? project.createdAt.toDate() : project.createdAt).toLocaleDateString()}
                  </Typography>
                </CardContent>

                <CardActions>
                  <IconButton 
                    size="small" 
                    onClick={() => handleOpenDialog(project)}
                    color="primary"
                    disabled={loading}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => handleDelete(project.id)}
                    color="error"
                    disabled={loading}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {!loading && userProjects.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <ProjectIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No projects yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first project to get started
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Create Project
          </Button>
        </Box>
      )}

      {/* Project Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {editingProject ? 'Edit Project' : 'Create New Project'}
              <IconButton onClick={handleCloseDialog}>
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
            <Button onClick={handleCloseDialog} disabled={loading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : null}
            >
              {loading ? 'Saving...' : (editingProject ? 'Update Project' : 'Create Project')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Projects;
