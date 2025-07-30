import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip
} from '@mui/material';
import {
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useState, useEffect } from 'react';
import { useUserStore } from '../../store/useUserStore';
import { useAuthStore } from '../../store/authStore';

// Validation schemas
const profileSchema = yup.object({
  fullName: yup.string().required('Full name is required').min(2, 'Name must be at least 2 characters'),
  email: yup.string().email('Invalid email').required('Email is required'),
  gender: yup.string().required('Gender is required'),
  age: yup.number().required('Age is required').min(16, 'Age must be at least 16').max(100, 'Age must be less than 100'),
  bio: yup.string().max(500, 'Bio must be less than 500 characters'),
  phoneNumber: yup.string().matches(/^[+]?[1-9][\d\s\-\(\)]{7,15}$/, 'Invalid phone number'),
  dateOfBirth: yup.date().max(new Date(), 'Date of birth cannot be in the future')
});

const passwordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup.string().required('New password is required').min(6, 'Password must be at least 6 characters'),
  confirmPassword: yup.string()
    .required('Please confirm your new password')
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
});

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const { 
    userProfile, 
    userStats, 
    userPreferences, 
    isLoading, 
    getUserProfile, 
    updateUserProfile, 
    changePassword, 
    updateUserPreferences, 
    deleteUserAccount, 
    getUserStats 
  } = useUserStore();
  
  const { user: currentUser } = useAuthStore();

  // Profile form
  const profileForm = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      fullName: '',
      email: '',
      gender: '',
      age: '',
      bio: '',
      phoneNumber: '',
      dateOfBirth: ''
    }
  });

  // Password form
  const passwordForm = useForm({
    resolver: yupResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  // Load user data on component mount
  useEffect(() => {
    getUserProfile();
    getUserStats();
  }, []);

  // Update form when userProfile changes
  useEffect(() => {
    if (userProfile) {
      profileForm.reset({
        fullName: userProfile.fullName || '',
        email: userProfile.email || '',
        gender: userProfile.gender || '',
        age: userProfile.age || '',
        bio: userProfile.bio || '',
        phoneNumber: userProfile.phoneNumber || '',
        dateOfBirth: userProfile.dateOfBirth ? userProfile.dateOfBirth.split('T')[0] : ''
      });
    }
  }, [userProfile]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleProfileSubmit = async (data) => {
    const profileData = {
      ...data,
      age: parseInt(data.age)
    };
    
    if (selectedFile) {
      profileData.profilePicture = selectedFile;
    }

    const result = await updateUserProfile(profileData);
    if (result.success) {
      setIsEditing(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const handlePasswordSubmit = async (data) => {
    const result = await changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword
    });
    if (result.success) {
      passwordForm.reset();
    }
  };

  const handleDeleteAccount = async () => {
    // This would require additional confirmation and password verification
    setDeleteDialogOpen(false);
    // Implementation would go here
  };

  const renderProfileTab = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Profile Information</Typography>
          <Button
            startIcon={isEditing ? <CancelIcon /> : <EditIcon />}
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? "outlined" : "contained"}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </Box>

        {/* Profile Picture Section */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
          <Avatar
            src={previewUrl || userProfile?.profilePicture}
            sx={{ width: 120, height: 120, mb: 2 }}
          />
          {isEditing && (
            <Button
              component="label"
              variant="outlined"
              startIcon={<PhotoCameraIcon />}
              size="small"
            >
              Change Picture
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileChange}
              />
            </Button>
          )}
        </Box>

        <Box component="form" onSubmit={profileForm.handleSubmit(handleProfileSubmit)}>
          <Grid container spacing={2}>
            <Grid xs={12} sm={6}>
              <Controller
                name="fullName"
                control={profileForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Full Name"
                    disabled={!isEditing}
                    error={!!profileForm.formState.errors.fullName}
                    helperText={profileForm.formState.errors.fullName?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid xs={12} sm={6}>
              <Controller
                name="email"
                control={profileForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Email"
                    type="email"
                    disabled={!isEditing}
                    error={!!profileForm.formState.errors.email}
                    helperText={profileForm.formState.errors.email?.message}
                  />
                )}
              />
            </Grid>

            <Grid xs={12} sm={6}>
              <Controller
                name="gender"
                control={profileForm.control}
                render={({ field }) => (
                  <FormControl fullWidth disabled={!isEditing}>
                    <InputLabel>Gender</InputLabel>
                    <Select {...field} label="Gender">
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid xs={12} sm={6}>
              <Controller
                name="age"
                control={profileForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Age"
                    type="number"
                    disabled={!isEditing}
                    error={!!profileForm.formState.errors.age}
                    helperText={profileForm.formState.errors.age?.message}
                  />
                )}
              />
            </Grid>

            <Grid xs={12}>
              <Controller
                name="phoneNumber"
                control={profileForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Phone Number"
                    disabled={!isEditing}
                    error={!!profileForm.formState.errors.phoneNumber}
                    helperText={profileForm.formState.errors.phoneNumber?.message}
                  />
                )}
              />
            </Grid>

            <Grid xs={12}>
              <Controller
                name="dateOfBirth"
                control={profileForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Date of Birth"
                    type="date"
                    disabled={!isEditing}
                    InputLabelProps={{ shrink: true }}
                    error={!!profileForm.formState.errors.dateOfBirth}
                    helperText={profileForm.formState.errors.dateOfBirth?.message}
                  />
                )}
              />
            </Grid>

            <Grid xs={12}>
              <Controller
                name="bio"
                control={profileForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Bio"
                    multiline
                    rows={3}
                    disabled={!isEditing}
                    error={!!profileForm.formState.errors.bio}
                    helperText={profileForm.formState.errors.bio?.message}
                  />
                )}
              />
            </Grid>
          </Grid>

          {isEditing && (
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={20} /> : 'Save Changes'}
              </Button>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  const renderSecurityTab = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3 }}>Security Settings</Typography>
        
        <Box component="form" onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}>
          <Grid container spacing={2}>
            <Grid xs={12}>
              <Controller
                name="currentPassword"
                control={passwordForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Current Password"
                    type="password"
                    error={!!passwordForm.formState.errors.currentPassword}
                    helperText={passwordForm.formState.errors.currentPassword?.message}
                  />
                )}
              />
            </Grid>

            <Grid xs={12}>
              <Controller
                name="newPassword"
                control={passwordForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="New Password"
                    type="password"
                    error={!!passwordForm.formState.errors.newPassword}
                    helperText={passwordForm.formState.errors.newPassword?.message}
                  />
                )}
              />
            </Grid>

            <Grid xs={12}>
              <Controller
                name="confirmPassword"
                control={passwordForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Confirm New Password"
                    type="password"
                    error={!!passwordForm.formState.errors.confirmPassword}
                    helperText={passwordForm.formState.errors.confirmPassword?.message}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SecurityIcon />}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={20} /> : 'Change Password'}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const renderStatsTab = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3 }}>Account Statistics</Typography>
        
        {userStats ? (
          <Grid container spacing={2}>
            <Grid xs={12} sm={6}>
              <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Account Created
                </Typography>
                <Typography variant="h6">
                  {new Date(userStats.accountCreated).toLocaleDateString()}
                </Typography>
              </Box>
            </Grid>

            <Grid xs={12} sm={6}>
              <Box sx={{ p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Profile Completeness
                </Typography>
                <Typography variant="h6">
                  {userStats.profileCompleteness}%
                </Typography>
              </Box>
            </Grid>

            <Grid xs={12} sm={6}>
              <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Account Age
                </Typography>
                <Typography variant="h6">
                  {userStats.accountAge}
                </Typography>
              </Box>
            </Grid>

            <Grid xs={12} sm={6}>
              <Box sx={{ p: 2, bgcolor: 'warning.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Projects
                </Typography>
                <Typography variant="h6">
                  {userStats.totalProjects}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        ) : (
          <CircularProgress />
        )}
      </CardContent>
    </Card>
  );

  const renderDangerZone = () => (
    <Card sx={{ border: '1px solid', borderColor: 'error.main' }}>
      <CardContent>
        <Typography variant="h6" color="error" sx={{ mb: 2 }}>
          Danger Zone
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Once you delete your account, there is no going back. Please be certain.
        </Typography>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => setDeleteDialogOpen(true)}
        >
          Delete Account
        </Button>
      </CardContent>
    </Card>
  );

  if (!userProfile) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        User Profile
      </Typography>

      {/* Tab Navigation */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant={activeTab === 'profile' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('profile')}
          sx={{ mr: 1 }}
        >
          Profile
        </Button>
        <Button
          variant={activeTab === 'security' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('security')}
          sx={{ mr: 1 }}
        >
          Security
        </Button>
        <Button
          variant={activeTab === 'stats' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('stats')}
        >
          Statistics
        </Button>
      </Box>

      {/* Tab Content */}
      {activeTab === 'profile' && renderProfileTab()}
      {activeTab === 'security' && renderSecurityTab()}
      {activeTab === 'stats' && renderStatsTab()}

      {/* Danger Zone - Always visible at bottom */}
      <Box sx={{ mt: 4 }}>
        {renderDangerZone()}
      </Box>

      {/* Delete Account Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle color="error">Delete Account</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            This action cannot be undone. All your data will be permanently deleted.
          </Alert>
          <Typography>
            Are you sure you want to delete your account? This will remove all your projects, 
            personal information, and cannot be reversed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={handleDeleteAccount}>
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserProfile;
