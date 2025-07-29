import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, CircularProgress } from '@mui/material';

const Users = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to Teachers page since teachers and admins are the same
    navigate('/admin/teachers', { replace: true });
  }, [navigate]);

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Redirecting to Teachers & Admins Management...
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default Users;
