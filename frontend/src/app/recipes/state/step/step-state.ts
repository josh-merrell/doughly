export interface StepState {
  steps: Step[];
  loading: boolean;
  adding: boolean;
  updating: boolean;
  deleting: boolean;
  error: StepError | null;
}

export interface Step {
  stepID: number;
  title: string;
  description: string;
}

export interface StepError {
  errorType: string;
  message: string;
  statusCode?: number;
  rawError?: any;
}