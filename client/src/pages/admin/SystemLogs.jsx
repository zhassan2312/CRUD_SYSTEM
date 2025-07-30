import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TablePagination,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Info,
  Warning,
  Error,
  CheckCircle,
  Refresh,
} from '@mui/icons-material';
import { format } from 'date-fns';
import ModernPageContainer from '../../components/ui/ModernPageContainer';
import useAdminStore from '../../store/adminStore';

const SystemLogs = () => {
  const { systemLogs, fetchSystemLogs } = useAdminStore();
  const [logType, setLogType] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  useEffect(() => {
    fetchSystemLogs(page + 1, rowsPerPage, logType === 'all' ? '' : logType);
  }, [fetchSystemLogs, page, rowsPerPage, logType]);

  const getLogIcon = (type) => {
    switch (type) {
      case 'error':
        return <Error color="error" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'success':
        return <CheckCircle color="success" />;
      default:
        return <Info color="info" />;
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      default:
        return 'info';
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRefresh = () => {
    fetchSystemLogs(page + 1, rowsPerPage, logType === 'all' ? '' : logType);
  };

  return (
    <ModernPageContainer
      title="System Logs"
      subtitle="Monitor system activities and events"
      showRefresh
      onRefresh={handleRefresh}
    >
      <Card>
        <CardContent>
          {/* Filter Controls */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Activity Logs
            </Typography>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Log Type</InputLabel>
              <Select
                value={logType}
                onChange={(e) => setLogType(e.target.value)}
                label="Log Type"
                size="small"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="user_action">User Actions</MenuItem>
                <MenuItem value="system">System Events</MenuItem>
                <MenuItem value="error">Errors</MenuItem>
                <MenuItem value="warning">Warnings</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Logs Table */}
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>User/Source</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Timestamp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {systemLogs.data?.length > 0 ? (
                  systemLogs.data.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getLogIcon(log.type)}
                          <Chip
                            label={log.type.replace('_', ' ').toUpperCase()}
                            color={getLogColor(log.type)}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {log.message}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {log.userId || log.source || 'System'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {log.ip || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {log.timestamp ? format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss') : 'N/A'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="text.secondary">
                        {systemLogs.loading ? 'Loading logs...' : 'No logs found'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={systemLogs.pagination?.total || 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>
    </ModernPageContainer>
  );
};

export default SystemLogs;
