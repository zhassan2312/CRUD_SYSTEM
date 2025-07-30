import { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  FormGroup,
  Button,
  Divider,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Email as EmailIcon,
  Notifications as NotificationIcon,
  PhoneIphone as PushIcon,
  Save as SaveIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useNotificationStore } from '../../store/notificationStore';

const NotificationPreferences = () => {
  const [localPreferences, setLocalPreferences] = useState({
    email: {
      projectStatusChange: true,
      newProjectAssignment: true,
      systemAnnouncements: true,
      weeklyDigest: false
    },
    inApp: {
      projectStatusChange: true,
      newProjectAssignment: true,
      systemAnnouncements: true,
      comments: true
    },
    push: {
      enabled: false,
      projectStatusChange: false,
      urgentOnly: true
    }
  });

  const {
    preferences,
    isLoadingPreferences,
    getPreferences,
    updatePreferences
  } = useNotificationStore();

  useEffect(() => {
    getPreferences();
  }, [getPreferences]);

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  const handlePreferenceChange = (category, key, value) => {
    setLocalPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    await updatePreferences(localPreferences);
  };

  const hasChanges = JSON.stringify(localPreferences) !== JSON.stringify(preferences);

  if (isLoadingPreferences) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <SettingsIcon color="primary" />
        <Typography variant="h5">
          Notification Preferences
        </Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" paragraph>
        Customize how and when you receive notifications from the Project Management System.
      </Typography>

      <Grid container spacing={3}>
        {/* Email Notifications */}
        <Grid xs={12} md={4}>
          <Card elevation={1}>
            <CardHeader
              avatar={<EmailIcon color="primary" />}
              title="Email Notifications"
              subheader="Receive notifications via email"
            />
            <CardContent>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localPreferences.email.projectStatusChange}
                      onChange={(e) => handlePreferenceChange('email', 'projectStatusChange', e.target.checked)}
                    />
                  }
                  label="Project Status Changes"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={localPreferences.email.newProjectAssignment}
                      onChange={(e) => handlePreferenceChange('email', 'newProjectAssignment', e.target.checked)}
                    />
                  }
                  label="New Project Assignments"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={localPreferences.email.systemAnnouncements}
                      onChange={(e) => handlePreferenceChange('email', 'systemAnnouncements', e.target.checked)}
                    />
                  }
                  label="System Announcements"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={localPreferences.email.weeklyDigest}
                      onChange={(e) => handlePreferenceChange('email', 'weeklyDigest', e.target.checked)}
                    />
                  }
                  label="Weekly Digest"
                />
              </FormGroup>
            </CardContent>
          </Card>
        </Grid>

        {/* In-App Notifications */}
        <Grid xs={12} md={4}>
          <Card elevation={1}>
            <CardHeader
              avatar={<NotificationIcon color="primary" />}
              title="In-App Notifications"
              subheader="Show notifications in the app"
            />
            <CardContent>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localPreferences.inApp.projectStatusChange}
                      onChange={(e) => handlePreferenceChange('inApp', 'projectStatusChange', e.target.checked)}
                    />
                  }
                  label="Project Status Changes"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={localPreferences.inApp.newProjectAssignment}
                      onChange={(e) => handlePreferenceChange('inApp', 'newProjectAssignment', e.target.checked)}
                    />
                  }
                  label="New Project Assignments"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={localPreferences.inApp.systemAnnouncements}
                      onChange={(e) => handlePreferenceChange('inApp', 'systemAnnouncements', e.target.checked)}
                    />
                  }
                  label="System Announcements"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={localPreferences.inApp.comments}
                      onChange={(e) => handlePreferenceChange('inApp', 'comments', e.target.checked)}
                    />
                  }
                  label="Comments & Replies"
                />
              </FormGroup>
            </CardContent>
          </Card>
        </Grid>

        {/* Push Notifications */}
        <Grid xs={12} md={4}>
          <Card elevation={1}>
            <CardHeader
              avatar={<PushIcon color="primary" />}
              title="Push Notifications"
              subheader="Browser push notifications"
            />
            <CardContent>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localPreferences.push.enabled}
                      onChange={(e) => handlePreferenceChange('push', 'enabled', e.target.checked)}
                    />
                  }
                  label="Enable Push Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={localPreferences.push.projectStatusChange}
                      onChange={(e) => handlePreferenceChange('push', 'projectStatusChange', e.target.checked)}
                      disabled={!localPreferences.push.enabled}
                    />
                  }
                  label="Project Status Changes"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={localPreferences.push.urgentOnly}
                      onChange={(e) => handlePreferenceChange('push', 'urgentOnly', e.target.checked)}
                      disabled={!localPreferences.push.enabled}
                    />
                  }
                  label="Urgent Notifications Only"
                />
              </FormGroup>

              {!localPreferences.push.enabled && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Enable push notifications to receive real-time alerts in your browser.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Save Button */}
      <Divider sx={{ my: 3 }} />
      
      <Box display="flex" justifyContent="flex-end" gap={2}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={!hasChanges || isLoadingPreferences}
        >
          {isLoadingPreferences ? 'Saving...' : 'Save Preferences'}
        </Button>
      </Box>

      {hasChanges && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          You have unsaved changes. Click "Save Preferences" to apply your changes.
        </Alert>
      )}
    </Paper>
  );
};

export default NotificationPreferences;
