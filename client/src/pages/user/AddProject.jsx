import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Card,
  CardContent,
  CircularProgress,
  Autocomplete,
  Avatar
} from '@mui/material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store/projectStore';
import { useTeacherStore } from '../../store/teacherStore';
import { useEffect, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const schema = yup.object({
  title: yup.string().required('Title is required').min(3, 'Title must be at least 3 characters'),
  description: yup.string().required('Description is required').min(10, 'Description must be at least 10 characters'),
  students: yup.array().of(
    yup.object().shape({
      name: yup.string().required('Student name is required'),
      email: yup.string().email('Invalid email').required('Student email is required'),
    })
  ).max(4, 'Maximum 4 students allowed'),
  supervisorId: yup.string().required('Supervisor is required'),
  coSupervisorId: yup.string().nullable(),
  sustainability: yup.string().required('Sustainability information is required').min(10, 'Must be at least 10 characters'),
});

const AddProject = () => {
  const navigate = useNavigate();
  const { createProject, isLoading: projectLoading } = useProjectStore();
  const { teachers, getTeachers, isLoading: teachersLoading } = useTeacherStore();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      students: [{ name: '', email: '' }],
      supervisorId: '',
      coSupervisorId: '',
      sustainability: ''
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'students'
  });

  useEffect(() => {
    getTeachers();
  }, [getTeachers]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const onSubmit = async (data) => {
    const formData = {
      ...data,
      students: data.students.filter(student => student.name && student.email)
    };
    
    if (selectedFile) {
      formData.projectImage = selectedFile;
    }

    const result = await createProject(formData);
    if (result.success) {
      navigate('/');
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Add New Project
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create a new project with all the required details
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ padding: 4 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          {/* Project Image Upload */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Project Image
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                {previewUrl && (
                  <Avatar
                    src={previewUrl}
                    variant="rounded"
                    sx={{ width: 200, height: 150 }}
                  />
                )}
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                >
                  {previewUrl ? 'Change Image' : 'Upload Project Image'}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Project Title"
                    error={!!errors.title}
                    helperText={errors.title?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={4}
                    label="Project Description"
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="sustainability"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={3}
                    label="Sustainability Details"
                    error={!!errors.sustainability}
                    helperText={errors.sustainability?.message}
                  />
                )}
              />
            </Grid>
          </Grid>

          {/* Supervisors */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Supervisors
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="supervisorId"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      options={teachers}
                      getOptionLabel={(option) => option.name || ''}
                      loading={teachersLoading}
                      onChange={(_, value) => field.onChange(value?.id || '')}
                      value={teachers.find(teacher => teacher.id === field.value) || null}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Supervisor *"
                          error={!!errors.supervisorId}
                          helperText={errors.supervisorId?.message}
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {teachersLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="coSupervisorId"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      options={teachers}
                      getOptionLabel={(option) => option.name || ''}
                      loading={teachersLoading}
                      onChange={(_, value) => field.onChange(value?.id || '')}
                      value={teachers.find(teacher => teacher.id === field.value) || null}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Co-Supervisor (Optional)"
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {teachersLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Students */}
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Students (Max 4)
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addStudent}
                disabled={fields.length >= 4}
              >
                Add Student
              </Button>
            </Box>

            {fields.map((field, index) => (
              <Card key={field.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={5}>
                      <Controller
                        name={`students.${index}.name`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Student Name"
                            error={!!errors.students?.[index]?.name}
                            helperText={errors.students?.[index]?.name?.message}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} md={5}>
                      <Controller
                        name={`students.${index}.email`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Student Email"
                            type="email"
                            error={!!errors.students?.[index]?.email}
                            helperText={errors.students?.[index]?.email?.message}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <IconButton
                        color="error"
                        onClick={() => removeStudent(index)}
                        disabled={fields.length === 1}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Submit Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/')}
              disabled={projectLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={projectLoading}
            >
              {projectLoading ? <CircularProgress size={24} /> : 'Create Project'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default AddProject;
