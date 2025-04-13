// src/components/beta/TestScenarios.tsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { registry } from '../../services/registry';
import { MonitoringServiceInterface } from '../../services/monitoringService';

interface TestStep {
  label: string;
  instructions: string;
  completionCriteria: string;
}

interface TestScenario {
  id: string;
  title: string;
  description: string;
  component: string;
  steps: TestStep[];
  completed: boolean;
}

const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'user-registration',
    title: 'User Registration Flow',
    description: 'Test the complete user registration and book verification process',
    component: 'Authentication',
    completed: false,
    steps: [
      {
        label: 'Navigate to Registration',
        instructions: 'Open the application and click on "Register" button',
        completionCriteria: 'Registration form appears with fields for email, password, etc.'
      },
      {
        label: 'Complete Registration Form',
        instructions: 'Fill out the form with valid data and submit',
        completionCriteria: 'Form submits successfully and redirects to verification page'
      },
      {
        label: 'Book Verification',
        instructions: 'Enter verification code BETA001 and click "Verify"',
        completionCriteria: 'Verification succeeds and redirects to reader dashboard'
      }
    ]
  },
  {
    id: 'reader-interface',
    title: 'Reader Interface',
    description: 'Test the core reading interface functionality',
    component: 'Reader',
    completed: false,
    steps: [
      {
        label: 'Navigate to Reader',
        instructions: 'From the dashboard, click "Continue Reading" button',
        completionCriteria: 'Reader interface loads with proper chapter/page content'
      },
      {
        label: 'Text Highlighting (Tier 1)',
        instructions: 'Highlight a word or phrase in the text',
        completionCriteria: 'Definition popup appears with the correct information'
      },
      {
        label: 'AI Assistant (Tier 2)',
        instructions: 'Click the AI assistant icon and ask a question',
        completionCriteria: 'AI responds with relevant information based on the context'
      },
      {
        label: 'Help Request (Tier 3)',
        instructions: 'Click "Request Help" in the AI assistant drawer',
        completionCriteria: 'Help request form appears and can be submitted'
      }
    ]
  },
  {
    id: 'consultant-dashboard',
    title: 'Consultant Dashboard',
    description: 'Test the consultant dashboard and reader management',
    component: 'Consultant',
    completed: false,
    steps: [
      {
        label: 'Login as Consultant',
        instructions: 'Logout if needed, then login with consultant credentials',
        completionCriteria: 'Consultant dashboard loads with reader list'
      },
      {
        label: 'View Reader Progress',
        instructions: 'Select a reader from the list to view their progress',
        completionCriteria: 'Reader profile loads with accurate progress information'
      },
      {
        label: 'Send Subtle Prompt',
        instructions: 'Use the prompt tool to send a subtle prompt to the reader',
        completionCriteria: 'Prompt is successfully sent and appears in the outbox'
      },
      {
        label: 'Handle Help Request',
        instructions: 'Navigate to help requests and respond to a request',
        completionCriteria: 'Response is sent and request status is updated'
      }
    ]
  }
];

export const TestScenarios: React.FC = () => {
  const monitoringService = registry.get<MonitoringServiceInterface>('monitoringService');
  const [scenarios, setScenarios] = useState<TestScenario[]>(TEST_SCENARIOS);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [stepResults, setStepResults] = useState<Record<string, Record<number, 'success' | 'failure' | ''>>>({});
  
  const handleStartScenario = (scenarioId: string) => {
    setActiveScenario(scenarioId);
    setActiveStep(0);
    
    // Log event
    if (monitoringService) {
      monitoringService.logEvent('beta_test', 'scenario_start', scenarioId);
    }
  };
  
  const handleStepComplete = (success: boolean) => {
    // Update step results
    const scenarioId = activeScenario as string;
    setStepResults({
      ...stepResults,
      [scenarioId]: {
        ...(stepResults[scenarioId] || {}),
        [activeStep]: success ? 'success' : 'failure'
      }
    });
    
    // Log step result
    if (monitoringService) {
      monitoringService.logEvent(
        'beta_test', 
        success ? 'step_success' : 'step_failure', 
        `${scenarioId}_step${activeStep}`
      );
    }
    
    // Move to next step if available
    const currentScenario = scenarios.find(s => s.id === activeScenario);
    if (currentScenario && activeStep < currentScenario.steps.length - 1) {
      setActiveStep(activeStep + 1);
    } else if (currentScenario) {
      // Scenario completed
      const allStepsSuccessful = Object.values(stepResults[scenarioId] || {}).every(
        result => result === 'success'
      );
      
      // Update scenario completion status
      const updatedScenarios = scenarios.map(s => 
        s.id === scenarioId ? { ...s, completed: allStepsSuccessful } : s
      );
      setScenarios(updatedScenarios);
      
      // Log scenario completion
      if (monitoringService) {
        monitoringService.logEvent(
          'beta_test', 
          'scenario_complete', 
          scenarioId,
          allStepsSuccessful ? 1 : 0
        );
      }
      
      // Reset active scenario
      setActiveScenario(null);
    }
  };
  
  const getScenarioStepResults = (scenarioId: string) => {
    return stepResults[scenarioId] || {};
  };
  
  const getScenarioCompletion = (scenarioId: string) => {
    const results = getScenarioStepResults(scenarioId);
    const successCount = Object.values(results).filter(r => r === 'success').length;
    const scenario = scenarios.find(s => s.id === scenarioId);
    
    return scenario ? successCount / scenario.steps.length : 0;
  };
  
  const renderActiveScenario = () => {
    if (!activeScenario) return null;
    
    const scenario = scenarios.find(s => s.id === activeScenario);
    if (!scenario) return null;
    
    const results = getScenarioStepResults(scenario.id);
    
    return (
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          {scenario.title}
        </Typography>
        <Typography variant="body1" paragraph>
          {scenario.description}
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {scenario.steps.map((step, index) => (
            <Step key={index}>
              <StepLabel>
                {step.label}
                {results[index] === 'success' && <CheckCircleIcon color="success" fontSize="small" sx={{ ml: 1 }} />}
                {results[index] === 'failure' && <ErrorIcon color="error" fontSize="small" sx={{ ml: 1 }} />}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Step {activeStep + 1}: {scenario.steps[activeStep].label}
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Instructions:</strong> {scenario.steps[activeStep].instructions}
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Completion Criteria:</strong> {scenario.steps[activeStep].completionCriteria}
          </Typography>
          
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              color="success" 
              onClick={() => handleStepComplete(true)}
            >
              Step Completed Successfully
            </Button>
            <Button 
              variant="contained" 
              color="error" 
              onClick={() => handleStepComplete(false)}
            >
              Step Failed
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => setActiveScenario(null)}
            >
              Cancel Scenario
            </Button>
          </Box>
        </Box>
      </Paper>
    );
  };
  
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Beta Test Scenarios
      </Typography>
      <Typography variant="body1" paragraph>
        Work through these test scenarios to validate key application functionality.
        Each scenario consists of multiple steps. For each step, follow the instructions
        and mark whether it completed successfully or failed.
      </Typography>
      
      {activeScenario ? (
        renderActiveScenario()
      ) : (
        <Box sx={{ mt: 3 }}>
          {scenarios.map((scenario) => (
            <Accordion key={scenario.id} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle1">{scenario.title}</Typography>
                  <Box>
                    <Chip 
                      label={scenario.component} 
                      size="small" 
                      sx={{ mr: 1 }} 
                    />
                    <Chip 
                      label={scenario.completed ? 'Completed' : 'Pending'} 
                      color={scenario.completed ? 'success' : 'default'} 
                      size="small" 
                    />
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" paragraph>
                  {scenario.description}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Steps:
                </Typography>
                <List dense>
                  {scenario.steps.map((step, index) => (
                    <ListItem key={index}>
                      <ListItemText 
                        primary={step.label}
                        secondary={`${index + 1}/${scenario.steps.length}`}
                      />
                      {stepResults[scenario.id]?.[index] === 'success' && (
                        <Chip 
                          label="Success" 
                          color="success" 
                          size="small" 
                          icon={<CheckCircleIcon />} 
                        />
                      )}
                      {stepResults[scenario.id]?.[index] === 'failure' && (
                        <Chip 
                          label="Failed" 
                          color="error" 
                          size="small"
                          icon={<ErrorIcon />} 
                        />
                      )}
                    </ListItem>
                  ))}
                </List>
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">
                    Completion: {Math.round(getScenarioCompletion(scenario.id) * 100)}%
                  </Typography>
                  <Button 
                    variant="contained"
                    onClick={() => handleStartScenario(scenario.id)}
                    disabled={activeScenario !== null}
                  >
                    {Object.keys(stepResults[scenario.id] || {}).length > 0 ? 'Continue Scenario' : 'Start Scenario'}
                  </Button>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default TestScenarios;
