import { Chip } from '@mui/material';

const ProjectStatusBadge = ({ status, size = 'small' }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'under-review':
        return 'warning';
      case 'revision-required':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'under-review':
        return 'Under Review';
      case 'revision-required':
        return 'Revision Required';
      default:
        return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending';
    }
  };

  return (
    <Chip
      label={getStatusLabel(status)}
      color={getStatusColor(status)}
      size={size}
      variant="filled"
    />
  );
};

export default ProjectStatusBadge;
