import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  checkIsConsultant,
  getConsultantAssignments,
  getPendingHelpRequests,
  getAssignedHelpRequests,
  updateHelpRequestStatus,
  logConsultantAction,
  getAllFeedback,
  getPublicFeedback,
  createConsultantTrigger,
  getUserReadingDetails
} from '../services/consultantService';
import { useAuth } from './AuthContext';
import { HelpRequest, HelpRequestStatus, UserFeedback, TriggerType } from '../types/supabase';
import { appLog } from '../components/LogViewer';

type ConsultantContextType = {
  isConsultant: boolean;
  isLoading: boolean;
  error: string | null;
  assignments: any[];
  pendingRequests: HelpRequest[];
  assignedRequests: HelpRequest[];
  feedback: UserFeedback[];
  selectedReader: any | null;
  readerDetails: any | null;
  refreshAssignments: () => Promise<void>;
  refreshRequests: () => Promise<void>;
  refreshFeedback: () => Promise<void>;
  acceptHelpRequest: (requestId: string) => Promise<boolean>;
  resolveHelpRequest: (requestId: string) => Promise<boolean>;
  getUserDetails: (userId: string) => Promise<any>;
  createTrigger: (userId: string, triggerType: TriggerType, message?: string) => Promise<string | null>;
  selectReader: (readerId: string) => void;
  clearSelectedReader: () => void;
  loadReaderDetails: (readerId: string) => Promise<void>;
};

const ConsultantContext = createContext<ConsultantContextType | undefined>(undefined);

export const ConsultantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isConsultantUser, setIsConsultantUser] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<HelpRequest[]>([]);
  const [assignedRequests, setAssignedRequests] = useState<HelpRequest[]>([]);
  const [feedback, setFeedback] = useState<UserFeedback[]>([]);
  const [selectedReader, setSelectedReader] = useState<any | null>(null);
  const [readerDetails, setReaderDetails] = useState<any | null>(null);

  // Check if user is a consultant
  useEffect(() => {
    const checkConsultantStatus = async () => {
      if (!user) {
        setIsConsultantUser(false);
        setIsLoading(false);
        return;
      }

      try {
        appLog('ConsultantContext', 'Checking consultant status', 'info');
        const isConsultantUser = await checkIsConsultant();

        appLog('ConsultantContext', `User is ${isConsultantUser ? '' : 'not '}a consultant`, 'info');
        setIsConsultantUser(isConsultantUser);

        // If user is a consultant, load assignments and requests
        if (isConsultantUser) {
          await Promise.all([
            loadAssignments(),
            loadPendingRequests(),
            loadAssignedRequests(),
            loadFeedback()
          ]);
        }
      } catch (err) {
        appLog('ConsultantContext', 'Error in consultant check', 'error', err);
        setIsConsultantUser(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkConsultantStatus();
  }, [user]);

  // Load consultant assignments
  const loadAssignments = async () => {
    if (!user || !isConsultantUser) return;

    try {
      appLog('ConsultantContext', 'Loading consultant assignments', 'info');
      const data = await getConsultantAssignments();

      appLog('ConsultantContext', `Loaded ${data?.length || 0} assignments`, 'info');
      setAssignments(data || []);
    } catch (err) {
      appLog('ConsultantContext', 'Error in loadAssignments', 'error', err);
    }
  };

  // Load pending help requests
  const loadPendingRequests = async () => {
    if (!user || !isConsultantUser) return;

    try {
      appLog('ConsultantContext', 'Loading pending help requests', 'info');
      const data = await getPendingHelpRequests();

      appLog('ConsultantContext', `Loaded ${data?.length || 0} pending requests`, 'info');
      setPendingRequests(data || []);
    } catch (err) {
      appLog('ConsultantContext', 'Error in loadPendingRequests', 'error', err);
    }
  };

  // Load assigned help requests
  const loadAssignedRequests = async () => {
    if (!user || !isConsultantUser) return;

    try {
      appLog('ConsultantContext', 'Loading assigned help requests', 'info');
      const data = await getAssignedHelpRequests();

      appLog('ConsultantContext', `Loaded ${data?.length || 0} assigned requests`, 'info');
      setAssignedRequests(data || []);
    } catch (err) {
      appLog('ConsultantContext', 'Error in loadAssignedRequests', 'error', err);
    }
  };

  // Load feedback
  const loadFeedback = async () => {
    if (!user || !isConsultantUser) return;

    try {
      appLog('ConsultantContext', 'Loading feedback', 'info');
      const data = await getAllFeedback();

      appLog('ConsultantContext', `Loaded ${data?.length || 0} feedback items`, 'info');
      setFeedback(data || []);
    } catch (err) {
      appLog('ConsultantContext', 'Error in loadFeedback', 'error', err);
    }
  };

  // Refresh assignments
  const refreshAssignments = async () => {
    await loadAssignments();
  };

  // Refresh requests
  const refreshRequests = async () => {
    await Promise.all([
      loadPendingRequests(),
      loadAssignedRequests()
    ]);
  };

  // Refresh feedback
  const refreshFeedback = async () => {
    await loadFeedback();
  };

  // Accept a help request
  const acceptHelpRequest = async (requestId: string) => {
    if (!user || !isConsultantUser) return false;

    try {
      appLog('ConsultantContext', `Accepting help request ${requestId}`, 'info');
      const success = await updateHelpRequestStatus(
        requestId,
        HelpRequestStatus.IN_PROGRESS,
        true // assign to self
      );

      if (!success) {
        appLog('ConsultantContext', 'Error accepting help request', 'error');
        return false;
      }

      // The action is logged automatically by the RPC function

      // Refresh requests
      await refreshRequests();
      return true;
    } catch (err) {
      appLog('ConsultantContext', 'Error in acceptHelpRequest', 'error', err);
      return false;
    }
  };

  // Resolve a help request
  const resolveHelpRequest = async (requestId: string) => {
    if (!user || !isConsultantUser) return false;

    try {
      appLog('ConsultantContext', `Resolving help request ${requestId}`, 'info');
      const success = await updateHelpRequestStatus(
        requestId,
        HelpRequestStatus.RESOLVED
      );

      if (!success) {
        appLog('ConsultantContext', 'Error resolving help request', 'error');
        return false;
      }

      // The action is logged automatically by the RPC function

      // Refresh requests
      await refreshRequests();
      return true;
    } catch (err) {
      appLog('ConsultantContext', 'Error in resolveHelpRequest', 'error', err);
      return false;
    }
  };

  // Get user details
  const getUserDetails = async (userId: string) => {
    if (!user || !isConsultantUser) return null;

    try {
      appLog('ConsultantContext', 'Getting user details', 'info', { userId });
      const data = await getUserReadingDetails(userId);
      return data;
    } catch (err) {
      appLog('ConsultantContext', 'Error in getUserDetails', 'error', err);
      return null;
    }
  };

  // Create a trigger
  const createTrigger = async (userId: string, triggerType: TriggerType, message?: string) => {
    if (!user || !isConsultantUser) return null;

    try {
      appLog('ConsultantContext', 'Creating trigger', 'info', { userId, triggerType });
      const triggerId = await createConsultantTrigger(userId, undefined, triggerType, message);
      return triggerId;
    } catch (err) {
      appLog('ConsultantContext', 'Error in createTrigger', 'error', err);
      return null;
    }
  };

  // Select a reader
  const selectReader = (readerId: string) => {
    const reader = assignments.find(a => a.user_id === readerId);
    if (reader) {
      setSelectedReader(reader);
      appLog('ConsultantContext', 'Reader selected', 'info', { readerId });
    } else {
      appLog('ConsultantContext', 'Reader not found in assignments', 'warning', { readerId });
    }
  };

  // Clear selected reader
  const clearSelectedReader = () => {
    setSelectedReader(null);
    setReaderDetails(null);
    appLog('ConsultantContext', 'Selected reader cleared', 'info');
  };

  // Load reader details
  const loadReaderDetails = async (readerId: string) => {
    try {
      appLog('ConsultantContext', 'Loading reader details', 'info', { readerId });
      const details = await getUserReadingDetails(readerId);
      setReaderDetails(details);
      appLog('ConsultantContext', 'Reader details loaded', 'success');
    } catch (err) {
      appLog('ConsultantContext', 'Error loading reader details', 'error', err);
      console.error('Failed to load reader details', err);
    }
  };

  const value = {
    isConsultant: isConsultantUser,
    isLoading,

    assignments,
    pendingRequests,
    assignedRequests,
    feedback,
    selectedReader,
    readerDetails,
    refreshAssignments,
    refreshRequests,
    refreshFeedback,
    acceptHelpRequest,
    resolveHelpRequest,
    getUserDetails,
    createTrigger,
    selectReader,
    clearSelectedReader,
    loadReaderDetails
  };

  return (
    <ConsultantContext.Provider value={value}>
      {children}
    </ConsultantContext.Provider>
  );
};

export const useConsultant = () => {
  const context = useContext(ConsultantContext);
  if (context === undefined) {
    throw new Error('useConsultant must be used within a ConsultantProvider');
  }
  return context;
};
