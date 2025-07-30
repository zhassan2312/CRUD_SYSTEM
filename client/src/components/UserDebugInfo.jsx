import React from 'react';
import { Box, Paper, Typography, Button, Alert } from '@mui/material';
import useUserStore from '../store/useUserStore';

const UserDebugInfo = () => {
    const { user, refreshUserData, forceLogout, loading } = useUserStore();

    const handleRefresh = async () => {
        const result = await refreshUserData();
        console.log('Refresh result:', result);
    };

    const handleForceLogout = () => {
        forceLogout();
    };

    return (
        <Paper sx={{ p: 3, m: 2 }}>
            <Typography variant="h6" gutterBottom>
                Debug: Current User State
            </Typography>
            
            {user ? (
                <Box>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        <strong>Logged in as:</strong> {user.fullName} ({user.email})
                        <br />
                        <strong>Role:</strong> {user.role}
                        <br />
                        <strong>Email Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}
                        <br />
                        <strong>User ID:</strong> {user.id}
                    </Alert>
                    
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button 
                            variant="outlined" 
                            onClick={handleRefresh}
                            disabled={loading}
                        >
                            Refresh User Data
                        </Button>
                        <Button 
                            variant="contained" 
                            color="warning"
                            onClick={handleForceLogout}
                        >
                            Force Logout
                        </Button>
                    </Box>
                </Box>
            ) : (
                <Alert severity="warning">
                    No user logged in
                </Alert>
            )}
        </Paper>
    );
};

export default UserDebugInfo;
