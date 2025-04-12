// src/components/Reader/PromptManager.tsx
import React, { useState, useEffect } from 'react';
import { ConsultantTrigger } from '../../types/supabase';
import { getUnprocessedTriggers, subscribeToTriggers } from '../../services/triggerService';
import SubtlePrompt from './SubtlePrompt';
import { appLog } from '../LogViewer';
import { BookId, UserId } from '../../types/idTypes';

interface PromptManagerProps {
  userId: string | UserId;
  bookId: string | BookId;
  onResponse?: (response: string, trigger: ConsultantTrigger) => void;
  onAllProcessed?: () => void;
}

/**
 * Component to manage and display consultant-triggered prompts
 */
const PromptManager: React.FC<PromptManagerProps> = ({
  userId,
  bookId,
  onResponse,
  onAllProcessed
}) => {
  const [triggers, setTriggers] = useState<ConsultantTrigger[]>([]);
  const [activeTrigger, setActiveTrigger] = useState<ConsultantTrigger | null>(null);
  const [triggerQueue, setTriggerQueue] = useState<ConsultantTrigger[]>([]);

  // Load initial unprocessed triggers
  useEffect(() => {
    const loadTriggers = async () => {
      try {
        appLog('PromptManager', 'Loading unprocessed triggers', 'info');
        const unprocessedTriggers = await getUnprocessedTriggers(userId);

        if (unprocessedTriggers.length > 0) {
          appLog('PromptManager', `Found ${unprocessedTriggers.length} unprocessed triggers`, 'success');
          setTriggers(unprocessedTriggers);

          // Set the first trigger as active
          setActiveTrigger(unprocessedTriggers[0]);

          // Queue the rest
          if (unprocessedTriggers.length > 1) {
            setTriggerQueue(unprocessedTriggers.slice(1));
          }
        }
      } catch (error) {
        appLog('PromptManager', 'Error loading unprocessed triggers', 'error', error);
      }
    };

    loadTriggers();
  }, [userId]);

  // Subscribe to new triggers
  useEffect(() => {
    appLog('PromptManager', 'Setting up trigger subscription', 'info');

    const subscription = subscribeToTriggers(userId, (newTrigger) => {
      appLog('PromptManager', 'New trigger received', 'info', { triggerId: newTrigger.id });

      // Add the new trigger to the list
      setTriggers(prevTriggers => [...prevTriggers, newTrigger]);

      // If no active trigger, set this one as active
      if (!activeTrigger) {
        setActiveTrigger(newTrigger);
      } else {
        // Otherwise, add to queue
        setTriggerQueue(prevQueue => [...prevQueue, newTrigger]);
      }
    });

    return () => {
      appLog('PromptManager', 'Cleaning up trigger subscription', 'info');
      subscription.unsubscribe();
    };
  }, [userId, activeTrigger]);

  // Handle trigger close
  const handleTriggerClose = () => {
    appLog('PromptManager', 'Trigger closed', 'info');

    // Remove the active trigger
    setActiveTrigger(null);

    // Process the next trigger in the queue
    if (triggerQueue.length > 0) {
      const nextTrigger = triggerQueue[0];
      const remainingQueue = triggerQueue.slice(1);

      // Set a small delay before showing the next trigger
      setTimeout(() => {
        setActiveTrigger(nextTrigger);
        setTriggerQueue(remainingQueue);
      }, 500);
    } else {
      // If there are no more triggers in the queue, call onAllProcessed
      appLog('PromptManager', 'All triggers processed', 'info');

      if (onAllProcessed) {
        // Add a small delay to ensure smooth transition
        setTimeout(() => {
          onAllProcessed();
        }, 500);
      }
    }
  };

  // Handle trigger response
  const handleTriggerResponse = (response: string) => {
    if (!activeTrigger) return;

    appLog('PromptManager', 'Trigger response received', 'info', {
      triggerId: activeTrigger.id,
      responseLength: response.length
    });

    // Call the onResponse callback if provided
    if (onResponse) {
      onResponse(response, activeTrigger);
    }

    // Close the trigger
    handleTriggerClose();
  };

  // If no active trigger, don't render anything
  if (!activeTrigger) {
    return null;
  }

  return (
    <SubtlePrompt
      trigger={activeTrigger}
      userId={userId}
      bookId={bookId}
      onClose={handleTriggerClose}
      onRespond={handleTriggerResponse}
      variant="slide"
      position="bottom"
    />
  );
};

export default PromptManager;
