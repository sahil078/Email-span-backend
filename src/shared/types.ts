export interface SpamTest {
  _id?: string;
  testCode: string;
  userId: string;
  status: 'pending' | 'completed' | 'failed';
  results: TestResult[];
  createdAt: Date;
  completedAt?: Date;
  overallScore?: number;
}

export interface TestResult {
  provider: string;
  email: string;
  status: 'delivered' | 'spam' | 'promotions' | 'not_received' | 'pending';
  folder: string;
  receivedAt?: Date;
}

export interface User {
  _id?: string;
  email: string;
  createdAt: Date;
}

export interface EmailCheckRequest {
  testCode: string;
  email: string;
  provider: string;
}