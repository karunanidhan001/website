// Types mirrored from docs/API_MAP.md. Keep in sync with the backend Lambda
// (GuaranteeHai2/backend/lambda/index.js) when the enterprise API surface changes.

export type ApprovalStatus =
  | "EMAIL_PENDING"
  | "PENDING_APPROVAL"
  | "ACTIVE"
  | "REJECTED"
  | "SUSPENDED";

export interface EnterpriseProfile {
  companyId: string;
  companyName: string;
  companyEmail: string;
  businessAddress: string;
  gstNumber: string;
  phoneNumber: string;
  companyWebsite: string;
  authorizedRepresentative: string;
  logoUrl?: string;
  profilePictureUrl?: string;
  role: "ENTERPRISE";
  ownerRole: "ENTERPRISE_OWNER";
  approvalStatus: ApprovalStatus;
  emailVerified?: boolean;
  verifiedAt?: string;
  rejectionReason?: string;
  approvedByEmail?: string;
  approvedAt?: string;
  rejectedByEmail?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
  accessAllowed: boolean;
  message: string;
}

// ---- Auth (POST /enterprise/auth/login, GET /enterprise/me, POST /auth/refresh) ----------------

export interface EnterpriseLoginRequest {
  email: string;
  password: string;
}

export interface EnterpriseLoginResponse {
  userId: string;
  email: string;
  displayName: string;
  accessToken: string;
  refreshToken: string;
  emailVerified: boolean;
  accountMode: "ENTERPRISE";
  role: string;
  enterpriseCompanyId: string;
  enterpriseApprovalStatus: ApprovalStatus;
  accessAllowed: boolean;
  message: string;
  enterpriseProfile: EnterpriseProfile;
}

export interface EnterpriseMeResponse {
  ok: true;
  role: string;
  approvalStatus: ApprovalStatus;
  emailVerified: boolean;
  accessAllowed: boolean;
  message: string;
  enterpriseProfile: EnterpriseProfile;
}

export interface RefreshAuthResponse {
  accessToken: string;
  idToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface AdminEnterpriseProfile extends EnterpriseProfile {
  ownerUserId: string;
  accountStatus: string;
  documents: { label: string; url: string }[];
}

export type WarrantyStatus = "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "UNKNOWN";

export interface Product {
  id: string;
  name?: string;
  type?: string;
  brand?: string;
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
  imei?: string;
  sku?: string;
  warrantyId?: string;
  category?: string;
  date?: string;
  purchaseDate?: string;
  warranty?: string;
  warrantyExpiry?: string;
  seller?: string;
  invoiceNumber?: string;
  cost?: string;
  price?: string;
  amount?: string;
  gst?: string;
  invoiceUrl?: string;
  warrantyUrl?: string;
  warrantyPdfUrl?: string;
  productImages?: string[];
  coverage?: string;
  warrantyDuration?: string;
  exclusions?: string;
  repairHistory?: unknown[];
  serviceHistory?: unknown[];
  confidenceScore?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  status?: string;
  claimStatus?: string;
  enterpriseId?: string;
  enterpriseName?: string;
  consumerUserId?: string;
  consumerProductId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ClaimStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "WAITING_DOCUMENTS"
  | "APPROVED"
  | "REJECTED"
  | "ENGINEER_ASSIGNED"
  | "COMPLETED";

export interface ClaimTimelineEntry {
  status: string;
  by: string;
  byUserId?: string;
  note?: string;
  at: string;
}

export interface Claim {
  id: string;
  claimId?: string;
  productId?: string;
  productName?: string;
  brand?: string;
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
  invoiceNumber?: string;
  warrantyId?: string;
  category?: string;
  confidenceScore?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerUserId?: string;
  consumerId?: string;
  consumerProductId?: string;
  enterpriseProductId?: string;
  enterpriseId?: string;
  enterpriseName?: string;
  status: ClaimStatus | string;
  priority?: string;
  issueCategory?: string;
  description?: string;
  message?: string;
  issueDescription?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  attachments?: string[];
  evidenceUrls?: string[];
  photos?: string[];
  videos?: string[];
  documents?: string[];
  invoiceUrl?: string;
  warrantyUrl?: string;
  diagnosticUrl?: string;
  requestedDocuments?: string[];
  requestedDocumentsNote?: string;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedByUserId?: string;
  reviewedAt?: string;
  assignedEngineer?: string;
  assignedEngineerNote?: string;
  resolution?: string;
  notes?: string;
  timeline?: ClaimTimelineEntry[];
  statusHistory?: unknown[];
  repairCost?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  customerName: string;
  email: string;
  phone: string;
  registeredProducts: number;
  claims: number;
  warrantyCount: number;
  latestActivityAt: string;
}

export interface EnterpriseNotification {
  id: string;
  productId?: string;
  channel: string;
  type: string;
  status: "UNREAD" | "READ";
  message: string;
  scheduledFor?: string;
  sentAt?: string;
  readAt?: string;
  createdAt: string;
}

export interface AuditEntry {
  action: string;
  actorEmail: string;
  details: Record<string, unknown>;
  ip: string;
  companyId: string;
  createdAt: string;
}

export interface EnterpriseStats {
  registeredProducts: number;
  pendingClaims: number;
  approvedClaims: number;
  rejectedClaims: number;
  waitingDocumentsClaims: number;
  inProgressClaims: number;
  completedClaims: number;
  totalClaims: number;
  totalCustomers: number;
  totalRevenueProtected: number;
  activeWarranties: number;
}

export interface EnterpriseAnalytics {
  claimsThisMonth: number;
  claimsTrend: { month: string; count: number }[];
  approvalRate: number;
  averageResolutionMs: number;
  averageResolutionDays: number;
  averageRepairCost: number;
  topSellingProducts: { label: string; count: number }[];
  topFailureModels: { label: string; count: number }[];
  topIssueCategories: { label: string; count: number }[];
  mostClaimedProducts: { label: string; count: number }[];
  productsNearExpiry: number;
  protectedAssetValue: number;
  totalProducts: number;
  totalClaims: number;
}

export interface EnterpriseSearchResultItem {
  type: "PRODUCT" | "CLAIM" | "DOCUMENT" | "CUSTOMER";
  id: string;
  title: string;
  subtitle: string;
  status: string;
  updatedAt: string;
  payload: Product | Claim | Record<string, unknown> | Customer;
}

// Two raw shapes the backend returns for paginated lists. Normalized by
// normalizeListResponse() in api.ts into NormalizedList<T>.
export interface PagedWithTotal<T> {
  items: T[];
  nextCursor: string;
  pageSize: number;
  total: number;
}

export interface PagedWithoutTotal<T> {
  items: T[];
  nextCursor: string;
  pageSize: number;
}

export type RawListResponse<T> = PagedWithTotal<T> | PagedWithoutTotal<T>;

export interface NormalizedList<T> {
  items: T[];
  nextCursor: string;
  pageSize: number;
  total?: number;
}
