import { useCallback } from 'react';
import consultantService from '../services/consultantService';
import { HelpRequest } from '../types/helpRequest';

type HelpRequestStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';

export const useConsultantService = () => {
  const getHelpRequests = useCallback(async (status: HelpRequestStatus): Promise<HelpRequest[]> => {
    return consultantService.getHelpRequests(status);
  }, []);

  const updateHelpRequestStatus = useCallback(async (requestId: string, status: HelpRequestStatus): Promise<HelpRequest> => {
    return consultantService.updateHelpRequestStatus(requestId, status);
  }, []);

  return {
    getHelpRequests,
    updateHelpRequestStatus
  };
}; 