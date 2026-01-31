export enum UserRole {
  ADMIN = 'ADMIN',
  CHILD = 'CHILD',
  PENDING = 'PENDING'
}

export enum FilterLevel {
  STRICT = 'STRICT',
  MODERATE = 'MODERATE',
  NONE = 'NONE'
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  filterLevel: FilterLevel;
  parentEmail?: string;
  createdAt: number;
}

export interface ProxyRequest {
  url: string;
  timestamp: number;
}

export interface ProxyResponse {
  content: string;
  contentType: string;
  status: number;
}