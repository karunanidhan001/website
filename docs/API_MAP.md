# Enterprise API Map

Source: `GuaranteeHai2/backend/lambda/index.js` (routes ~L149-224, handlers throughout the file),
cross-checked against `API_DOCUMENTATION.md` and `DATABASE_SCHEMA.md`.

All protected routes require `Authorization: Bearer <access-token>` (Cognito JWT). Enterprise
routes additionally require the caller to resolve to an `ENTERPRISE_USER` link
(`getEnterpriseContext`); admin routes require `requireEnterpriseAdmin` (company-scoped) or
`requirePlatformAdmin` (platform-wide, under `/admin/enterprises/*`).

Every response is wrapped by the Lambda's `json()` helper (`{ statusCode, body }`) — types below
describe the parsed JSON `body`.

## Shared types

```typescript
type ApprovalStatus = "EMAIL_PENDING" | "PENDING_APPROVAL" | "ACTIVE" | "REJECTED" | "SUSPENDED";

interface EnterpriseProfile {
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
  // derived
  accessAllowed: boolean;
  message: string;
}

// Returned by /admin/enterprises/* only
interface AdminEnterpriseProfile extends EnterpriseProfile {
  ownerUserId: string;
  accountStatus: string; // mirrors approvalStatus
  documents: { label: string; url: string }[];
}

type WarrantyStatus = "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "UNKNOWN";

interface Product {
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
  status?: string; // on enterprise responses: computed WarrantyStatus if not explicitly stored
  claimStatus?: string;
  enterpriseId?: string;
  enterpriseName?: string;
  consumerUserId?: string;
  consumerProductId?: string;
  createdAt: string;
  updatedAt: string;
}

type ClaimStatus =
  | "SUBMITTED" | "UNDER_REVIEW" | "WAITING_DOCUMENTS"
  | "APPROVED" | "REJECTED" | "ENGINEER_ASSIGNED" | "COMPLETED";

interface ClaimTimelineEntry {
  status: string;
  by: string;
  byUserId?: string;
  note?: string;
  at: string;
}

interface Claim {
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

interface Customer {
  customerName: string;
  email: string;
  phone: string;
  registeredProducts: number;
  claims: number;
  warrantyCount: number;
  latestActivityAt: string;
}

interface EnterpriseNotification {
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

interface AuditEntry {
  action: string;
  actorEmail: string;
  details: Record<string, unknown>;
  ip: string;
  companyId: string;
  createdAt: string;
}

interface EnterpriseStats {
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
  // additional fields follow in enterpriseStats()
}

interface Paged<T> {
  items: T[];
  nextCursor: string; // "" when no more pages; opaque base64url offset cursor otherwise
  pageSize: number;
  total?: number; // present on pagedArray() results, absent on queryUserPrefixPage() results
}
```

## Auth (public — no JWT required)

### POST /enterprise/signup (alias: /enterprise/auth/signup)

```typescript
interface EnterpriseSignupRequest {
  companyName: string;
  companyEmail: string;
  email: string; // Cognito username; same as companyEmail in practice
  password: string; // min 8 chars
  businessAddress: string;
  gstNumber: string;
  phoneNumber: string;
  companyWebsite: string;
  authorizedRepresentative: string;
}

interface EnterpriseSignupResponse {
  ok: true;
  userId: string;
  userConfirmed: boolean;
  approvalStatus: ApprovalStatus;
  accessAllowed: boolean;
  message: string;
  enterpriseProfile: EnterpriseProfile;
}
```

### POST /enterprise/auth/confirm

```typescript
interface EnterpriseConfirmRequest {
  email: string;
  code: string; // also accepts `confirmationCode`
}

interface EnterpriseConfirmResponse {
  ok: true;
  approvalStatus: ApprovalStatus;
  accessAllowed: boolean;
  message: string;
  enterpriseProfile: EnterpriseProfile;
}
```

### POST /enterprise/login (alias: /enterprise/auth/login)

```typescript
interface EnterpriseLoginRequest {
  email: string;
  password: string;
}

interface EnterpriseLoginResponse {
  userId: string;
  email: string;
  displayName: string;
  accessToken: string;
  refreshToken: string;
  emailVerified: boolean;
  accountMode: "ENTERPRISE";
  role: string; // "ENTERPRISE_OWNER"
  enterpriseCompanyId: string;
  enterpriseApprovalStatus: ApprovalStatus;
  accessAllowed: boolean;
  message: string;
  enterpriseProfile: EnterpriseProfile;
}
```

## Profile

### GET /enterprise/me

No request body.

```typescript
interface EnterpriseMeResponse {
  ok: true;
  role: string;
  approvalStatus: ApprovalStatus;
  emailVerified: boolean;
  accessAllowed: boolean;
  message: string;
  enterpriseProfile: EnterpriseProfile;
}
```

### GET /enterprise/profile

Alias of `/enterprise/me` (kept for older app builds). Same response shape.

### POST /enterprise/me / PATCH or POST /enterprise/profile

```typescript
interface UpdateEnterpriseProfileRequest {
  companyName?: string;
  businessAddress?: string;
  gstNumber?: string;
  phoneNumber?: string;
  companyWebsite?: string;
  authorizedRepresentative?: string;
  logoUrl?: string;
  profilePictureUrl?: string;
  // companyEmail cannot be changed via this endpoint
}

interface UpdateEnterpriseProfileResponse {
  ok: true;
  approvalStatus: ApprovalStatus; // REJECTED profiles are reset to PENDING_APPROVAL on update
  accessAllowed: boolean;
  message: string;
  enterpriseProfile: EnterpriseProfile;
}
```

## Dashboard / Stats

### GET /enterprise/dashboard

No request body.

```typescript
interface EnterpriseDashboardResponse {
  ok: true;
  enterpriseProfile: EnterpriseProfile;
  stats: EnterpriseStats;
  recentRegistrations: Product[]; // top 5, most recent
  recentClaims: Claim[]; // top 5, most recent
  recentWarrantyActivity: {
    id: string;
    title: string;
    subtitle: string;
    status: WarrantyStatus;
    date: string;
  }[]; // top 5
}
```

### GET /enterprise/stats

No request body.

```typescript
interface EnterpriseStatsResponse {
  ok: true;
  stats: EnterpriseStats;
}
```

## Products

### GET /enterprise/products

Query params: `status` (`all` default, or a `WarrantyStatus`/custom status), `sort`
(`expiry` default | `name` | `purchase` | `value`), `q`/`query`, plus pagination
(`limit`/`pageSize`, `cursor`/`nextCursor`, or `offset`).

```typescript
// When q or status filters are active: Paged<Product> (has `total`)
// Otherwise: { items: Product[], nextCursor: string, pageSize: number } (no `total`)
type ListEnterpriseProductsResponse = Paged<Product> | {
  items: Product[];
  nextCursor: string;
  pageSize: number;
};
```

### GET /enterprise/products/search

Query params: `q`/`query`, `status`, `sort`, pagination params (see above).

```typescript
type SearchEnterpriseProductsResponse = Paged<Product>;
```

### GET /enterprise/products/{id}

No request body.

```typescript
interface EnterpriseProductDetailResponse {
  product: Product & { status: WarrantyStatus };
  warrantyStatus: WarrantyStatus;
  warrantyStatusLabel: string;
  claimHistory: Claim[];
  documents: { invoiceUrl: string; warrantyUrl: string };
}
```

### POST /enterprise/products (create or update)

```typescript
interface UpsertEnterpriseProductRequest extends Partial<Product> {
  id?: string; // omit to create; include to update (merges onto existing record)
}

// Response: Product & { status: WarrantyStatus }
type UpsertEnterpriseProductResponse = Product;
```

### PUT /enterprise/products/{id}

Same as POST but `id` is taken from the path, not the body.

```typescript
type UpdateEnterpriseProductRequest = Partial<Product>; // id is injected from the URL
type UpdateEnterpriseProductResponse = Product;
```

### POST /enterprise/products/{id}/delete

No request body.

```typescript
interface DeleteEnterpriseProductResponse {
  ok: true;
}
```

## Customers

### GET /enterprise/customers

Query params: `q`/`query` (matches any field).

```typescript
interface ListEnterpriseCustomersResponse {
  items: Customer[]; // sorted by customerName/email
}
```

## Search

### GET /enterprise/search

Query params: `q`/`query` (required — empty query returns an empty page), pagination params.

```typescript
interface EnterpriseSearchResultItem {
  type: "PRODUCT" | "CLAIM" | "DOCUMENT" | "CUSTOMER";
  id: string;
  title: string;
  subtitle: string;
  status: string;
  updatedAt: string;
  payload: Product | Claim | Record<string, unknown> | Customer;
}

type SearchEnterpriseResponse = Paged<EnterpriseSearchResultItem>;
```

## Analytics

### GET /enterprise/analytics

No meaningful query params read beyond context.

```typescript
interface EnterpriseAnalyticsResponse {
  claimsThisMonth: number;
  claimsTrend: { month: string; count: number }[]; // last 6 months, "YYYY-MM"
  approvalRate: number; // percentage, 1 decimal
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
```

## Audit

### GET /enterprise/audit

Query params: pagination params.

```typescript
type ListEnterpriseAuditResponse = Paged<AuditEntry>;
```

### POST /enterprise/audit/log

```typescript
interface LogEnterpriseAuditRequest {
  action: string; // required
  details?: Record<string, unknown>;
}

interface LogEnterpriseAuditResponse {
  ok: true;
  audit: AuditEntry | null;
}
```

## Notifications

### GET /enterprise/notifications

Query params: `status` (`all` default | `UNREAD`).

```typescript
interface ListEnterpriseNotificationsResponse {
  items: EnterpriseNotification[];
  unreadCount: number;
}
```

### POST /enterprise/notifications/read

```typescript
interface MarkEnterpriseNotificationsReadRequest {
  ids?: string[]; // specific notification ids
  all?: boolean; // mark everything read; also true implicitly if ids is empty
}

interface MarkEnterpriseNotificationsReadResponse {
  ok: true;
  updated: number;
}
```

## Export

### GET /enterprise/export

Query params: `type`/`dataset` (`products` default | `claims`, possibly others), `format`
(`csv` default).

```typescript
// Shape depends on dataset/format; `columns` and `rows` drive CSV generation server-side.
// Treat as an opaque download (binary/text) response rather than typed JSON on the client.
```

## Claims

### GET /enterprise/claims

Query params: `status` (`all` default, or a group key: `pending` | `approved` | `rejected` |
`needinfo` | `inprogress` | `completed`), `q`/`query`, pagination params.

```typescript
type ListEnterpriseClaimsResponse = Paged<Claim>;
```

### GET /enterprise/claims/{id}

No request body.

```typescript
interface GetEnterpriseClaimResponse {
  claim: Claim;
  product: Product | null;
  timeline: ClaimTimelineEntry[];
}
```

### POST /enterprise/claims/{id}/approve

```typescript
interface ApproveClaimRequest {
  note?: string;
}

interface DecideClaimResponse {
  claim: Claim;
}
```

Throws `409` if the claim is already in a decided status (`APPROVED`, `RESOLVED`, `ACCEPTED`,
`REJECTED`, `DENIED`, `COMPLETED`, `CLOSED`).

### POST /enterprise/claims/{id}/reject

```typescript
interface RejectClaimRequest {
  reason: string; // required (also accepts `rejectionReason`)
  note?: string;
}

type RejectClaimResponse = DecideClaimResponse;
```

### POST /enterprise/claims/{id}/request-documents

```typescript
interface RequestClaimDocumentsRequest {
  documents?: string[]; // also accepts `requestedDocuments` or `items`
  note?: string; // also accepts `message`; at least one of documents/note is required
}

interface RequestClaimDocumentsResponse {
  ok: true;
  claim: Claim;
}
```

Throws `409` if the claim is already in a final status (`REJECTED`, `DENIED`, `COMPLETED`,
`CLOSED`).

### POST /enterprise/claims/{id}/assign

```typescript
interface AssignClaimEngineerRequest {
  engineer: string; // required (also accepts `assignedEngineer` or `name`)
  note?: string;
}

interface AssignClaimEngineerResponse {
  ok: true;
  claim: Claim;
}
```

Throws `409` if the claim is already in a final status.

### POST /enterprise/claims/{id}/close

```typescript
interface CloseClaimRequest {
  resolution?: string; // also accepts `note` or `message`
}

interface CloseClaimResponse {
  ok: true;
  claim: Claim;
}
```

Throws `409` if the claim is already in a final status.

## Company admin (requires `EnterpriseAdmin` group or `ENTERPRISE_ADMIN_EMAILS`)

### GET /enterprise/admin/companies/pending

No request body.

```typescript
interface ListPendingCompaniesResponse {
  items: EnterpriseProfile[];
}
```

### POST /enterprise/admin/companies/{id}/approve

No request body documented beyond the id in the path.

```typescript
interface ApproveCompanyResponse {
  ok: true;
  enterpriseProfile: EnterpriseProfile;
}
```

Throws `409` if the company is not currently `PENDING_APPROVAL` (e.g. still `EMAIL_PENDING`).

### POST /enterprise/admin/companies/{id}/reject

```typescript
interface RejectCompanyRequest {
  reason: string; // required
}

interface RejectCompanyResponse {
  ok: true;
  enterpriseProfile: EnterpriseProfile;
}
```

## Platform admin (requires `requirePlatformAdmin`, under `/admin/enterprises`)

### GET /admin/enterprises

Query params: `status` (`all` default or an `ApprovalStatus`), `q`/`query`, pagination params.

```typescript
type AdminListEnterprisesResponse = Paged<AdminEnterpriseProfile>;
```

### GET /admin/enterprises/{id}

`{id}` is the `companyId`, URL-decoded.

```typescript
interface AdminGetEnterpriseResponse {
  ok: true;
  enterprise: AdminEnterpriseProfile;
  stats: EnterpriseStats;
  products: Product[]; // up to 100, newest first
  claims: Claim[]; // up to 100, newest first
  customers: Customer[];
}
```

### POST /admin/enterprises/{id}/approve

No request body required.

```typescript
interface AdminApproveEnterpriseResponse {
  ok: true;
  enterpriseProfile: AdminEnterpriseProfile;
}
```

### POST /admin/enterprises/{id}/reject

```typescript
interface AdminRejectEnterpriseRequest {
  reason: string; // required (also accepts `rejectionReason`)
}

interface AdminRejectEnterpriseResponse {
  ok: true;
  enterpriseProfile: AdminEnterpriseProfile;
}
```

### POST /admin/enterprises/{id}/suspend

```typescript
interface AdminSuspendEnterpriseRequest {
  reason?: string;
}

interface AdminSuspendEnterpriseResponse {
  ok: true;
  enterpriseProfile: AdminEnterpriseProfile;
}
```

### POST /admin/enterprises/{id}/reinstate

No request body. Restores the company to its pre-suspension status (defaults to `ACTIVE`).

```typescript
interface AdminReinstateEnterpriseResponse {
  ok: true;
  enterpriseProfile: AdminEnterpriseProfile;
}
```

### POST /admin/enterprises/{id}/delete and DELETE /admin/enterprises/{id}

Both routes call the same handler. No request body required. Deletes the Enterprise profile +
owner link only; consumer data under the owner's `USER#` partition is left untouched.

```typescript
interface AdminDeleteEnterpriseResponse {
  ok: true;
  deleted: true;
  companyId: string;
}
```

## Notes for frontend implementation

- Pagination is inconsistent across endpoints: some return `total` (via `pagedArray`), some don't
  (via `queryUserPrefixPage`, e.g. the default `/enterprise/products` listing). Treat `total` as
  optional everywhere and drive "load more" off `nextCursor` being non-empty.
- `nextCursor` is an opaque base64url string (`{ offset }` JSON) — pass it back verbatim as
  `cursor` or `nextCursor` on the next request; do not attempt to decode/construct it client-side.
- `/enterprise/export` is not JSON — it returns a CSV/export payload; handle as a file download.
- Claim mutation endpoints (`approve`, `reject`, `request-documents`, `assign`, `close`) can all
  fail with `409 Conflict` if the claim is already decided/final — surface that as a non-retryable
  state conflict in the UI, not a generic error.
- `approvalStatus` drives route gating end-to-end: `EMAIL_PENDING` → `PENDING_APPROVAL` → `ACTIVE`,
  with `REJECTED` and `SUSPENDED` as side states. `accessAllowed` is `true` only when `ACTIVE`.
