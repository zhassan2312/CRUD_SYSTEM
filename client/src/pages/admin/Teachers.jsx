import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  Stack,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  Upload as UploadIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import useTeacherStore from '../../store/useTeacherStore';

// Validation schema
const teacherSchema = yup.object({
  fullName: yup.string().required('Full name is required').min(2, 'Name must be at least 2 characters'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  department: yup.string().required('Department is required'),
  specialization: yup.string().required('Specialization is required'),
  phoneNumber: yup.string(),
  profilePic: yup.mixed(),
  isAdmin: yup.boolean(),
});

const Teachers = () => {
  const { 
    teachers, 
    loading, 
    error, 
    fetchTeachers, 
    addTeacher, 
    updateTeacher, 
    deleteTeacher,
    clearError 
  } = useTeacherStore();
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(teacherSchema),
    defaultValues: {
      fullName: '',
      email: '',
      department: '',
      specialization: '',
      phoneNumber: '',
      profilePic: null,
      isAdmin: false,
    }
  });

  const watchedImage = watch('profilePic');

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

  const handleOpenDialog = (teacher = null) => {
    if (teacher) {
      setEditingTeacher(teacher);
      reset({
        fullName: teacher.fullName,
        email: teacher.email,
        department: teacher.department,
        specialization: teacher.specialization,
        phoneNumber: teacher.phoneNumber || '',
        profilePic: null,
        isAdmin: teacher.isAdmin || false,
      });
      if (teacher.profilePicUrl) {
        setImagePreview(teacher.profilePicUrl);
      }
    } else {
      setEditingTeacher(null);
      reset({
        fullName: '',
        email: '',
        department: '',
        specialization: '',
        phoneNumber: '',
        profilePic: null,
        isAdmin: false,
      });
      setImagePreview(null);
    }
    setOpenDialog(true);
    clearError();
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTeacher(null);
    setImagePreview(null);
    reset();
    clearError();
  };

  const onSubmit = async (data) => {
    try {
      const teacherData = {
        ...data,
        profilePic: data.profilePic?.[0] || null,
      };

      let result;
      if (editingTeacher) {
        result = await updateTeacher(editingTeacher.id, teacherData);
      } else {
        result = await addTeacher(teacherData);
      }

      if (result.success) {
        toast.success(result.message);
        handleCloseDialog();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('An error occurred while saving the teacher');
    }
  };

  const handleDelete = async (teacherId) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      const result = await deleteTeacher(teacherId);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    }
  };

  const departments = [
    'Computer Science',
    'Engineering',
    'Business',
    'Mathematics',
    'Science',
    'Arts',
    'Medicine',
    'Law',
    'Education',
    'Other',
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Teachers & Admins Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage teachers and grant admin privileges
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={loading}
        >
          Add Teacher
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Teacher</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Specialization</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Admin Role</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar 
                        src={teacher.profilePicUrl} 
                        alt={teacher.fullName}
                        sx={{ width: 40, height: 40 }}
                      >
                        {teacher.fullName?.charAt(0)}
                      </Avatar>
                      <Typography variant="body1">
                        {teacher.fullName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{teacher.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={teacher.department} 
                      size="small" 
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{teacher.specialization}</TableCell>
                  <TableCell>{teacher.phoneNumber || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={teacher.isAdmin ? 'Admin' : 'Teacher'} 
                      size="small" 
                      color={teacher.isAdmin ? 'error' : 'default'}
                      variant={teacher.isAdmin ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(teacher)}
                      color="primary"
                      disabled={loading}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(teacher.id)}
                      color="error"
                      disabled={loading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {teachers.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No teachers yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Add your first teacher to get started
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Add Teacher
              </Button>
            </Box>
          )}
        </TableContainer>
      )}

      {/* Teacher Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
              <IconButton onClick={handleCloseDialog}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {/* Full Name */}
              <Controller
                name="fullName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Full Name"
                    fullWidth
                    error={!!errors.fullName}
                    helperText={errors.fullName?.message}
                  />
                )}
              />

              {/* Email */}
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email"
                    type="email"
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />

              {/* Department */}
              <Controller
                name="department"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.department}>
                    <InputLabel>Department</InputLabel>
                    <Select {...field} label="Department">
                      {departments.map((dept) => (
                        <MenuItem key={dept} value={dept}>
                          {dept}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.department && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                        {errors.department.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />

              {/* Specialization */}
              <Controller
                name="specialization"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Specialization"
                    fullWidth
                    error={!!errors.specialization}
                    helperText={errors.specialization?.message}
                  />
                )}
              />

              {/* Phone Number */}
              <Controller
                name="phoneNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Phone Number (Optional)"
                    fullWidth
                    error={!!errors.phoneNumber}
                    helperText={errors.phoneNumber?.message}
                  />
                )}
              />

              {/* Admin Role Toggle */}
              <Controller
                name="isAdmin"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value || false}
                        onChange={(e) => field.onChange(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Grant Admin Privileges"
                    sx={{
                      '& .MuiFormControlLabel-label': {
                        fontSize: '0.875rem',
                        color: 'text.secondary'
                      }
                    }}
                  />
                )}
              />

              {/* Profile Picture */}
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Profile Picture (Optional)
                </Typography>
                <Controller
                  name="profilePic"
                  control={control}
                  render={({ field: { onChange, value, ...field } }) => (
                    <Box>
                      <input
                        {...field}
                        type="file"
                        accept="image/*"
                        onChange={(e) => onChange(e.target.files)}
                        style={{ display: 'none' }}
                        id="profile-upload"
                      />
                      <label htmlFor="profile-upload">
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<UploadIcon />}
                          fullWidth
                        >
                          Upload Profile Picture
                        </Button>
                      </label>
                      
                      {imagePreview && (
                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                          <Avatar
                            src={imagePreview}
                            alt="Profile preview"
                            sx={{ 
                              width: 80, 
                              height: 80, 
                              mx: 'auto',
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
              {loading ? 'Saving...' : (editingTeacher ? 'Update Teacher' : 'Add Teacher')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Teachers;
