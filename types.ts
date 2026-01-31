export enum UserRole {
  /** Site administrator (you as the admin) */
  SUPER_ADMIN = 'SUPER_ADMIN',
  /** Approved parent/family admin */
  PARENT = 'PARENT',
  /** Approved child */
  CHILD = 'CHILD',
  /** Parent awaiting admin approval */
  PENDING_PARENT = 'PENDING_PARENT',
  /** Child awaiting parent approval */
  PENDING_CHILD = 'PENDING_CHILD'
}

export enum ApprovalStatus {
  /** Awaiting approval */
  PENDING = 'PENDING',
  /** Approved by admin/parent */
  APPROVED = 'APPROVED',
  /** Rejected with reason */
  REJECTED = 'REJECTED',
  /** Account suspended */
  SUSPENDED = 'SUSPENDED'
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
  /** @deprecated Use parentUid instead */
  parentEmail?: string;

  /** Current approval state */
  approvalStatus: ApprovalStatus;
  /** For children: their parent's UID */
  parentUid?: string;
  /** Groups parent + children together */
  familyId?: string;
  /** For parents: array of child UIDs */
  childrenUids?: string[];
  /** UID of approver (admin or parent) */
  approvedBy?: string;
  /** Timestamp of approval */
  approvedAt?: number;
  /** If rejected, why */
  rejectedReason?: string;
  
  createdAt: number;
  updatedAt?: number;
}

export interface ApprovalRequest {
  id: string;
  requesterId: string;
  requesterEmail: string;
  requestType: 'PARENT_REQUEST' | 'CHILD_REQUEST';
  targetFamilyId?: string;
  status: ApprovalStatus;
  reviewerId?: string;
  reviewedAt?: number;
  createdAt: number;
  notes?: string;
}

export interface Family {
  id: string;
  parentUid: string;
  childrenUids: string[];
  createdAt: number;
  settings?: {
    filterLevel: FilterLevel;
  };
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
