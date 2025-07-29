import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import {
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Schedule as PendingIcon,
  Assignment as ReviewIcon,
  Edit as RevisionIcon,
} from '@mui/icons-material';

const ProjectStatusBadge = ({ status, size = 'small', showIcon = true, variant = 'filled' }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'approved':
        return {
          label: 'Approved',
          color: 'success',
          icon: <ApprovedIcon />,
          description: 'Project has been approved and can proceed'
        };
      case 'rejected':
        return {
          label: 'Rejected',
          color: 'error',
          icon: <RejectedIcon />,
          description: 'Project has been rejected and needs major changes'
        };
      case 'under-review':
        return {
          label: 'Under Review',
          color: 'info',
          icon: <ReviewIcon />,
          description: 'Project is currently being reviewed by faculty'
        };
      case 'revision-required':
        return {
          label: 'Needs Revision',
          color: 'warning',
          icon: <RevisionIcon />,
          description: 'Project needs minor revisions before approval'
        };
      case 'pending':
      default:
        return {
          label: 'Pending',
          color: 'default',
          icon: <PendingIcon />,
          description: 'Project is waiting for initial review'
        };
    }
  };

  const config = getStatusConfig(status || 'pending');

  const chipProps = {
    label: config.label,
    color: config.color,
    size,
    variant,
    ...(showIcon && { icon: config.icon })
  };

  return (
    <Tooltip title={config.description} arrow>
      <Chip {...chipProps} />
    </Tooltip>
  );
};

export default ProjectStatusBadge;
