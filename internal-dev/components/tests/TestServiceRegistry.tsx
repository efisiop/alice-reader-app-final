// src/components/TestServiceRegistry.tsx
import React, { useEffect, useState } from 'react';
import { registry, SERVICE_NAMES, initManager, initializeServices } from '../../../src/services';
import { appLog } from '../../../src/components/LogViewer';
import { BookServiceInterface } from '../../../src/services/bookService';
import { FeedbackServiceInterface } from '../../../src/services/feedbackService';
import { TriggerServiceInterface } from '../../../src/services/triggerService';

const TestServiceRegistry: React.FC = () => {
  const [bookDetails, setBookDetails] = useState<any>(null);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [triggers, setTriggers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [registeredServices, setRegisteredServices] = useState<string[]>([]);
  const [initializedServices, setInitializedServices] = useState<string[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        appLog('TestComponent', 'Initializing services', 'info');
        console.log('Registered services before initialization:', initManager.getRegisteredServices());
        
        // Initialize all services
        await initializeServices();
        
        // Update initialized services
        setInitializedServices(initManager.getInitializedServices());
        
        // Update registered services
        setRegisteredServices(registry.listServices());
        
        appLog('TestComponent', 'Services initialized successfully', 'success');
      } catch (error: any) {
        appLog('TestComponent', `Error initializing services: ${error.message}`, 'error');
        setError(`Error initializing services: ${error.message}`);
      }
    };
    
    init();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        appLog('TestComponent', 'Fetching data using service registry', 'info');
        
        // Check if services are initialized
        const bookServiceInitialized = initManager.isInitialized(SERVICE_NAMES.BOOK_SERVICE);
        const feedbackServiceInitialized = initManager.isInitialized(SERVICE_NAMES.FEEDBACK_SERVICE);
        const triggerServiceInitialized = initManager.isInitialized(SERVICE_NAMES.TRIGGER_SERVICE);
        
        if (!bookServiceInitialized) {
          throw new Error(`Service "${SERVICE_NAMES.BOOK_SERVICE}" not initialized`);
        }
        
        // Get the book service from the registry
        const bookService = registry.get<BookServiceInterface>(SERVICE_NAMES.BOOK_SERVICE);
        
        // Fetch book details
        const details = await bookService.getBookDetails('alice-in-wonderland');
        
        if (details) {
          setBookDetails(details);
          appLog('TestComponent', 'Successfully fetched book details', 'success');
        } else {
          appLog('TestComponent', 'Failed to fetch book details', 'error');
        }
        
        // Fetch feedback if the service is initialized
        if (feedbackServiceInitialized) {
          const feedbackService = registry.get<FeedbackServiceInterface>(SERVICE_NAMES.FEEDBACK_SERVICE);
          const userFeedback = await feedbackService.getUserFeedback('test-user', 'alice-in-wonderland');
          setFeedback(userFeedback);
          appLog('TestComponent', 'Successfully fetched user feedback', 'success');
        }
        
        // Fetch triggers if the service is initialized
        if (triggerServiceInitialized) {
          const triggerService = registry.get<TriggerServiceInterface>(SERVICE_NAMES.TRIGGER_SERVICE);
          const userTriggers = await triggerService.getTriggers('test-user', 'alice-in-wonderland');
          setTriggers(userTriggers);
          appLog('TestComponent', 'Successfully fetched user triggers', 'success');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
        appLog('TestComponent', `Error fetching data: ${err.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    if (initializedServices.length > 0) {
      fetchData();
    }
  }, [initializedServices]);

  return (
    <div>
      <h2>Service Registry Test</h2>
      
      <div>
        <h3>Registered Services for Initialization</h3>
        <ul>
          {initManager.getRegisteredServices().map(service => (
            <li key={service}>{service}</li>
          ))}
        </ul>
      </div>
      
      <div>
        <h3>Registered Services in Registry</h3>
        {registeredServices.length > 0 ? (
          <ul>
            {registeredServices.map(service => (
              <li key={service}>{service}</li>
            ))}
          </ul>
        ) : (
          <p>No services registered in registry</p>
        )}
      </div>
      
      <div>
        <h3>Initialized Services</h3>
        {initializedServices.length > 0 ? (
          <ul>
            {initializedServices.map(service => (
              <li key={service}>{service}</li>
            ))}
          </ul>
        ) : (
          <p>No services initialized</p>
        )}
      </div>
      
      <div>
        <h3>Book Details</h3>
        {loading && <p>Loading book details...</p>}
        {error && <p>Error: {error}</p>}
        {!loading && !error && !bookDetails && <p>No book details found</p>}
        {bookDetails && (
          <div>
            <p><strong>Title:</strong> {bookDetails.title}</p>
            <p><strong>Author:</strong> {bookDetails.author}</p>
            <p><strong>Description:</strong> {bookDetails.description}</p>
            <h4>Chapters ({bookDetails.chapters?.length || 0})</h4>
            <ul>
              {bookDetails.chapters?.map((chapter: any) => (
                <li key={chapter.id}>
                  Chapter {chapter.chapter_number}: {chapter.title}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div>
        <h3>User Feedback</h3>
        {loading && <p>Loading feedback...</p>}
        {!loading && feedback.length === 0 && <p>No feedback found</p>}
        {feedback.length > 0 && (
          <ul>
            {feedback.map((item: any) => (
              <li key={item.id}>
                <p><strong>Type:</strong> {item.feedback_type}</p>
                <p><strong>Content:</strong> {item.content}</p>
                <p><strong>Date:</strong> {new Date(item.created_at).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div>
        <h3>User Triggers</h3>
        {loading && <p>Loading triggers...</p>}
        {!loading && triggers.length === 0 && <p>No triggers found</p>}
        {triggers.length > 0 && (
          <ul>
            {triggers.map((item: any) => (
              <li key={item.id}>
                <p><strong>Type:</strong> {item.trigger_type}</p>
                <p><strong>Content:</strong> {item.content}</p>
                <p><strong>Date:</strong> {new Date(item.created_at).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TestServiceRegistry;
