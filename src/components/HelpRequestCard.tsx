import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { HelpRequest } from '../types/helpRequest';
import { HelpRequestStatus } from './HelpRequestStatus';
import { LoadingButton } from './common/LoadingButton';

interface HelpRequestCardProps {
  request: HelpRequest;
  onStatusChange: (requestId: string, newStatus: string) => Promise<void>;
  onViewProfile: (userId: string) => void;
  loading?: boolean;
}

interface StatusChangeDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  loading: boolean;
}

const StatusChangeDialog: React.FC<StatusChangeDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  loading
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    aria-labelledby="status-change-dialog-title"
    aria-describedby="status-change-dialog-description"
  >
    <DialogTitle id="status-change-dialog-title">{title}</DialogTitle>
    <DialogContent>
      <DialogContentText id="status-change-dialog-description">
        {message}
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={loading}>
        Cancel
      </Button>
      <LoadingButton
        onClick={onConfirm}
        loading={loading}
        variant="contained"
        color="primary"
        loadingText="Updating..."
      >
        {confirmText}
      </LoadingButton>
    </DialogActions>
  </Dialog>
);

export const HelpRequestCard: React.FC<HelpRequestCardProps> = ({
  request,
  onStatusChange,
  onViewProfile,
  loading = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmText: string;
    newStatus: string;
  } | null>(null);

  const handleStatusChangeClick = (newStatus: string) => {
    let dialogContent = {
      title: '',
      message: '',
      confirmText: '',
    };

    switch (newStatus) {
      case 'IN_PROGRESS':
        dialogContent = {
          title: 'Take Help Request',
          message: 'Are you sure you want to take this help request? You will be assigned as the consultant responsible for helping this reader.',
          confirmText: 'Take Request',
        };
        break;
      case 'RESOLVED':
        dialogContent = {
          title: 'Mark as Resolved',
          message: 'Are you sure you want to mark this help request as resolved? This will indicate that the reader has received the help they needed.',
          confirmText: 'Mark Resolved',
        };
        break;
      case 'CANCELLED':
        dialogContent = {
          title: 'Cancel Request',
          message: 'Are you sure you want to cancel this help request? This action cannot be undone.',
          confirmText: 'Cancel Request',
        };
        break;
    }

    setStatusDialog({
      open: true,
      ...dialogContent,
      newStatus,
    });
  };

  const handleStatusChangeConfirm = async () => {
    if (!statusDialog) return;
    try {
      await onStatusChange(request.id, statusDialog.newStatus);
      setStatusDialog(null);
    } catch (error) {
      // Error handling is managed by the parent component
      setStatusDialog(null);
    }
  };

  return (
    <>
      <Card>
        <CardContent sx={{ p: isMobile ? 2 : 3 }}>
          <Box display="flex" flexDirection="column" gap={isMobile ? 1.5 : 2}>
            <Box 
              display="flex" 
              flexDirection={isMobile ? 'column' : 'row'}
              gap={isMobile ? 1 : 0}
              justifyContent="space-between" 
              alignItems={isMobile ? 'flex-start' : 'center'}
            >
              <Typography 
                variant={isMobile ? 'subtitle1' : 'h6'}
                sx={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%'
                }}
              >
                {request.user?.first_name} {request.user?.last_name}
              </Typography>
              <HelpRequestStatus status={request.status} />
            </Box>

            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: 1.3
              }}
            >
              {request.section?.chapter?.title} - {request.section?.title}
            </Typography>

            <Typography 
              variant="body1"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                lineHeight: 1.5,
                mb: 1
              }}
            >
              {request.content}
            </Typography>

            <Box 
              display="flex" 
              flexDirection={isMobile ? 'column' : 'row'}
              gap={isMobile ? 1 : 0}
              justifyContent="space-between" 
              alignItems={isMobile ? 'flex-start' : 'center'}
            >
              <Typography variant="caption" color="text.secondary">
                {formatDistanceToNow(new Date(request.created_at))} ago
              </Typography>
              {request.assigned_to && (
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%'
                  }}
                >
                  Assigned to: {request.consultant?.first_name} {request.consultant?.last_name}
                </Typography>
              )}
            </Box>

            <Box 
              display="flex" 
              gap={1} 
              justifyContent="flex-end"
              flexDirection={isMobile ? 'column' : 'row'}
              sx={{ mt: isMobile ? 1 : 0 }}
            >
              <LoadingButton
                size="small"
                variant="outlined"
                onClick={() => onViewProfile(request.user_id)}
                loading={loading}
                fullWidth={isMobile}
              >
                View Profile
              </LoadingButton>
              {request.status === 'PENDING' && (
                <LoadingButton
                  size="small"
                  variant="contained"
                  onClick={() => handleStatusChangeClick('IN_PROGRESS')}
                  loading={loading}
                  loadingText="Taking Request..."
                  fullWidth={isMobile}
                >
                  Take Request
                </LoadingButton>
              )}
              {request.status === 'IN_PROGRESS' && (
                <LoadingButton
                  size="small"
                  variant="contained"
                  color="success"
                  onClick={() => handleStatusChangeClick('RESOLVED')}
                  loading={loading}
                  loadingText="Resolving..."
                  fullWidth={isMobile}
                >
                  Mark as Resolved
                </LoadingButton>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {statusDialog && (
        <StatusChangeDialog
          open={statusDialog.open}
          onClose={() => setStatusDialog(null)}
          onConfirm={handleStatusChangeConfirm}
          title={statusDialog.title}
          message={statusDialog.message}
          confirmText={statusDialog.confirmText}
          loading={loading}
        />
      )}
    </>
  );
}; 