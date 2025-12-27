# Frontend API Requirements

> **Generated:** December 25, 2025  
> **Last Updated:** December 25, 2025  
> **Purpose:** Document all backend API endpoints required by the EasyISP Frontend

---

## ⚠️ Maintenance Notice

**This document must be updated whenever:**
- A new API service is added to `src/services/`
- An existing API call is modified
- New features are implemented that require backend endpoints

---

## Changelog

| Date | Change |
|------|--------|
| 2025-12-25 | Initial document created |
| 2025-12-25 | Added dashboard stats, revenue, and network usage endpoints |
| 2025-12-25 | Added customer CRUD endpoints for PPPoE users |
| 2025-12-25 | Added tenant/settings endpoints for multi-tenancy |
| 2025-12-25 | Added RBAC fields (role, addedPermissions, removedPermissions) to User |
| 2025-12-25 | Added operator audit logs endpoint |
| 2025-12-25 | Added password reset endpoint |
| 2025-12-25 | Added customer details endpoint with extended fields |
| 2025-12-26 | Added NAS/Router CRUD endpoints with test connection, config generation |
| 2025-12-27 | Added Finance module endpoints (Income, Expenses, Stats) |
| 2025-12-27 | Added Vouchers, SMS, Payments, and Customer Actions endpoints (100% coverage) |

---

## Overview

This document lists all API endpoints that the frontend expects from the backend. The frontend uses Axios with a base URL configured via `VITE_API_URL` (default: `http://localhost:3000/api`).

---

## 1. Authentication Endpoints

> **Service File:** `src/services/authService.ts`

### `POST /api/auth/login`
Authenticate user and return JWT token.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "SUPER_ADMIN | ADMIN | CUSTOMER_CARE | FIELD_TECH",
    "tenantId": "string",
    "addedPermissions": ["string"],
    "removedPermissions": ["string"]
  },
  "token": "string"
}
```

---

### `PUT /api/auth/password`
Change user password.

**Request Body:**
```json
{
  "oldPassword": "string",
  "newPassword": "string"
}
```

---

## 5. Tenant Endpoints

> **Service File:** `src/services/tenantService.ts`

### `GET /api/tenant/me`
Get current user's tenant information.

**Response:**
```json
{
  "id": "uuid",
  "name": "tenant-slug",
  "businessName": "Sunshine ISP",
  "email": "admin@sunshineisp.com",
  "phone": "+254712345678",
  "location": "Mombasa, Kenya",
  "logo": "https://storage.example.com/logos/tenant.png",
  "status": "ACTIVE | SUSPENDED | TRIAL | EXPIRED",
  "walletBalance": 5000,
  "activeUsers": 366,
  "createdAt": "2025-01-01T00:00:00Z"
}
```

---

### `PUT /api/tenant/settings`
Update tenant settings (admin only).

**Request Body:**
```json
{
  "businessName": "string",
  "email": "string",
  "phone": "string",
  "location": "string"
}
```

---

### `GET /api/tenant/invoices`
Get tenant subscription invoices.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number |
| `pageSize` | number | Items per page |
| `search` | string | Search invoices |

**Response:**
```json
{
  "invoices": [
    {
      "id": "uuid",
      "ref": "ref_0001463",
      "reason": "Subscription December 2025",
      "amount": 4000,
      "currency": "KES",
      "createdAt": "2025-12-15T10:00:00Z",
      "dueAt": "2025-12-15T10:00:00Z",
      "status": "PENDING | PAID | OVERDUE"
    }
  ],
  "total": 12,
  "page": 1,
  "pageSize": 20
}
```

---

### `POST /api/tenant/wallet/topup`
Initiate wallet top-up payment.

**Request Body:**
```json
{
  "amount": 5000
}
```

**Response:**
```json
{
  "paymentUrl": "https://payment.gateway.com/pay/xyz"
}
```

---

### `GET /api/tenant/operators`
Get team members/operators.

**Response:**
```json
{
  "operators": [
    {
      "id": "uuid",
      "name": "John Staff",
      "email": "john@isp.com",
      "role": "STAFF",
      "status": "ACTIVE"
    }
  ],
  "total": 3
}
```

---

### `POST /api/tenant/operators`
Add new operator/team member.

---

### `PUT /api/tenant/operators/:id`
Update operator.

---

### `DELETE /api/tenant/operators/:id`
Delete operator.

---

### `GET /api/tenant/operators/:id`
Get single operator details.

**Response:**
```json
{
  "id": "uuid",
  "name": "John Staff",
  "email": "john@isp.com",
  "role": "CUSTOMER_CARE",
  "status": "ACTIVE",
  "addedPermissions": [],
  "removedPermissions": [],
  "createdAt": "2025-01-01T00:00:00Z"
}
```

---

### `GET /api/tenant/operators/:id/logs`
Get audit logs for a specific operator.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `pageSize` | number | Items per page (default: 10) |

**Response:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "action": "MAC_RESET | CUSTOMER_CREATE | PAYMENT_PROCESS | etc",
      "targetType": "PPPOE USER | CUSTOMER | INVOICE | ROUTER",
      "targetName": "user_123",
      "details": "Mac reset for user_123",
      "timestamp": "2025-12-25T10:30:00Z"
    }
  ],
  "total": 45
}
```

**Possible Action Types:**
- `MAC_RESET` - PPPoE user MAC address reset
- `CUSTOMER_CREATE` - New customer account created
- `PAYMENT_PROCESS` - Payment processed
- `ROUTER_REBOOT` - Router reboot initiated
- `PACKAGE_CHANGE` - Customer package changed
- `MANUAL_RECHARGE` - Manual account recharge
- `EXPIRY_UPDATE` - Expiry date manually changed
- `TRANSACTION_RESOLVE` - Pending transaction resolved
- `ACCOUNT_DELETE` - Customer account deleted
- `INFO_UPDATE` - Customer info updated

---

### `POST /api/tenant/operators/:id/reset-password`
Reset operator password (admin only).

**Response:**
```json
{
  "temporaryPassword": "xyz123abc",
  "message": "Password reset. User must change on next login."
}
```

OR (if using email):
```json
{
  "message": "Password reset link sent to operator's email."
}
```

---

### `PUT /api/tenant/payment-gateway`
Configure payment gateway (M-Pesa, etc).

**Request Body:**
```json
{
  "type": "MPESA",
  "config": {
    "shortcode": "123456",
    "passkey": "xxx"
  }
}
```

---

## 6. Implementation Priority

| Priority | Endpoint | Status |
|----------|----------|--------|
| ✅ Done | `GET /api/customers` | Customer listing |
| ✅ Done | `POST /api/customers` | Create customer |
| ✅ Done | `GET /api/tenant/me` | Tenant branding |
| ✅ Done | `PUT /api/tenant/settings` | Tenant settings |
| ✅ Done | `GET /api/tenant/invoices` | Subscription invoices |
| ✅ Done | `GET /api/tenant/operators` | Team members |
| 🔴 High | `GET /api/dashboard/stats` | Required for dashboard |
| 🔴 High | `GET /api/sessions/stats` | Required for active sessions |
| 🟡 Medium | `GET /api/dashboard/revenue` | Has frontend fallback |
| 🟡 Medium | `GET /api/dashboard/network-usage` | Has frontend fallback |
| ✅ Done | `POST /api/auth/login` | Already implemented |
| ✅ Done | `POST /api/auth/register` | Already implemented |
| ✅ Done | `GET /api/auth/me` | Already implemented |
```

---

### `POST /api/auth/register`
Create new user account.

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string"
  },
  "token": "string"
}
```

---

### `POST /api/auth/logout`
Invalidate user session.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true
}
```

---

### `GET /api/auth/me`
Get current authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "role": "string"
}
```

---

## 2. Dashboard Endpoints

> **Service File:** `src/services/dashboardService.ts`

### `GET /api/dashboard/stats`
Get dashboard statistics including active sessions from MikroTik routers.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "activeSessions": 1284,
  "totalCustomers": 3427,
  "monthlyRevenue": 847200,
  "todayRevenue": 28400,
  "pppoeCustomers": 2150,
  "hotspotCustomers": 1277,
  "activeVouchers": 450,
  "usedVouchers": 1200
}
```

**Notes:**
- `activeSessions` should be the real-time count from RADIUS/MikroTik
- Revenue values in KES (or local currency as number)

---

### `GET /api/dashboard/revenue`
Get payment/revenue trend data for charts.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `period` | string | Optional: `this_year`, `this_month`, `last_year` |

**Response:**
```json
{
  "revenueTrend": [
    { "month": "Jan", "amount": 45000 },
    { "month": "Feb", "amount": 52000 },
    { "month": "Mar", "amount": 48000 },
    { "month": "Apr", "amount": 61000 },
    { "month": "May", "amount": 55000 },
    { "month": "Jun", "amount": 67000 },
    { "month": "Jul", "amount": 72000 },
    { "month": "Aug", "amount": 69000 },
    { "month": "Sep", "amount: 84000 },
    { "month": "Oct", "amount": 91000 },
    { "month": "Nov", "amount": 847200 },
    { "month": "Dec", "amount": 78000 }
  ],
  "totalByPeriod": {
    "today": 28400,
    "thisWeek": 156800,
    "thisMonth": 847200,
    "thisYear": 9456000
  }
}
```

---

### `GET /api/dashboard/network-usage`
Get network bandwidth usage data for charts.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `period` | string | Optional: `this_year`, `this_month`, `last_year` |

**Response:**
```json
{
  "usageTrend": [
    { "month": "Jan", "usage": 1250 },
    { "month": "Feb", "usage": 1480 },
    { "month": "Mar", "usage": 1320 },
    { "month": "Apr", "usage": 1650 },
    { "month": "May", "usage": 1890 },
    { "month": "Jun", "usage": 2100 },
    { "month": "Jul", "usage": 2340 },
    { "month": "Aug", "usage": 2180 },
    { "month": "Sep", "usage": 2560 },
    { "month": "Oct", "usage": 2890 },
    { "month": "Nov", "usage": 3120 },
    { "month": "Dec", "usage": 2950 }
  ],
  "totalByPeriod": {
    "today": 85,
    "thisWeek": 580,
    "thisMonth": 3120,
    "thisYear": 28340
  }
}
```

**Notes:**
- `usage` values in GB
- Data aggregated from MikroTik router SNMP metrics or RADIUS accounting

---

### `GET /api/sessions/stats`
Get active session statistics breakdown.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "total": 1284,
  "pppoe": 856,
  "hotspot": 428,
  "byNas": [
    { "nasId": "nas-001", "nasName": "Main Router", "count": 542 },
    { "nasId": "nas-002", "nasName": "Branch Router", "count": 314 },
    { "nasId": "nas-003", "nasName": "Hotspot AP", "count": 428 }
  ]
}
```

---

## 3. Customer Endpoints

> **Service File:** `src/services/customerService.ts`

### `GET /api/customers`
Get paginated list of customers with filtering.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `pageSize` | number | Items per page (default: 20) |
| `connectionType` | string | `PPPOE` or `HOTSPOT` |
| `status` | string | `ACTIVE`, `SUSPENDED`, `EXPIRED`, `DISABLED` |
| `search` | string | Search by username, name, or phone |
| `nasId` | string | Filter by router/NAS ID |

**Response:**
```json
{
  "customers": [
    {
      "id": "uuid",
      "username": "john_doe",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "0712345678",
      "connectionType": "PPPOE",
      "status": "ACTIVE",
      "expiresAt": "2026-01-20T18:37:00Z",
      "isOnline": true,
      "package": { "id": "uuid", "name": "Monthly 7 Mbps" }
    }
  ],
  "total": 519,
  "page": 1,
  "pageSize": 20,
  "totalPages": 26
}
```

---

### `GET /api/customers/:id`
Get single customer details with extended fields for details page.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "username": "0713038483",
  "name": "Rehma Omar",
  "email": "rehma.omar@gmail.com",
  "phone": "0713038483",
  "connectionType": "PPPOE",
  "status": "ACTIVE",
  "expiresAt": "2026-01-20T18:37:00Z",
  "isOnline": true,
  "package": { "id": "uuid", "name": "Monthly 7 Mbps", "price": 2500 },
  "nas": { "id": "uuid", "name": "CCR 2004" },
  "location": "Mazeras, Kwa Wanubi",
  "createdAt": "2025-12-20T18:37:54Z",
  "updatedAt": "2025-12-25T10:00:00Z",
  "password": "0713038483",
  "walletBalance": 0,
  "totalSpent": 0,
  "monthlyUsage": { "download": 5, "upload": 49 },
  "lastIp": "192.25.245.150",
  "lastMac": "18DED7D48236",
  "vendor": "HUAWEI TECHNOLOGIES CO.,LTD",
  "site": "CCR 2004 (100.105.2.112)",
  "uptime": "1d9h19min54s"
}
```

**Notes:**
- Extended fields for details page: password, walletBalance, totalSpent, monthlyUsage, lastIp, lastMac, vendor, site, uptime
- `uptime` is only present when user is online

---

### `POST /api/customers`
Create a new customer.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "username": "new_user",
  "password": "password123",
  "name": "New User",
  "email": "user@example.com",
  "phone": "0712345678",
  "connectionType": "PPPOE",
  "packageId": "uuid",
  "expiresAt": "2026-01-20T18:37:00Z",
  "location": "Kiembeni",
  "latitude": -3.5000,
  "longitude": 35.4000,
  "apartmentNumber": "Block C",
  "houseNumber": "C8",
  "installationFee": 1500
}
```

**Response:** Returns created customer object

---

### `GET /api/customers/:id`
Get single customer details.

---

### `PUT /api/customers/:id`
Update customer details.

---

### `DELETE /api/customers/:id`
Delete a customer.

---

## 4. Implementation Priority

| Priority | Endpoint | Status |
|----------|----------|--------|
| ✅ Done | `GET /api/customers` | Customer listing |
| ✅ Done | `POST /api/customers` | Create customer |
| 🔴 High | `GET /api/dashboard/stats` | Required for dashboard |
| 🔴 High | `GET /api/sessions/stats` | Required for active sessions |
| 🟡 Medium | `GET /api/dashboard/revenue` | Has frontend fallback |
| 🟡 Medium | `GET /api/dashboard/network-usage` | Has frontend fallback |
| ✅ Done | `POST /api/auth/login` | Already implemented |
| ✅ Done | `POST /api/auth/register` | Already implemented |
| ✅ Done | `GET /api/auth/me` | Already implemented |

---

## 4. Error Response Format

All endpoints should return errors in this format:

```json
{
  "error": "Error message here",
  "statusCode": 401
}
```

**Common status codes:**
- `401` - Unauthorized (invalid/expired token)
- `403` - Forbidden (insufficient permissions)
- `404` - Resource not found
- `500` - Internal server error

---

## 7. NAS / Routers Endpoints

> **Service File:** `src/services/nasService.ts`

### `GET /api/nas`
Get paginated list of NAS routers.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `pageSize` | number | Items per page (default: 10) |
| `status` | string | Filter by `ONLINE`, `OFFLINE` |
| `search` | string | Search by name or IP |

**Response:**
```json
{
  "routers": [
    {
      "id": "uuid",
      "name": "MikroTik1",
      "boardName": "CCR2004-1G-12S+2XS",
      "ipAddress": "192.168.1.1",
      "status": "ONLINE | OFFLINE | PENDING | ERROR",
      "provisioningStatus": "Provisioned | Command Pending | Failed | Pending",
      "cpuLoad": 15,
      "memoryUsage": 256,
      "memoryTotal": 1024,
      "uptime": "5d 12h 30m",
      "routerOsVersion": "7.10",
      "remoteWinboxEnabled": true,
      "remoteWinboxPort": 8291,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 25,
  "page": 1,
  "pageSize": 10,
  "totalPages": 3
}
```

---

### `POST /api/nas`
Onboard a new router.

**Request Body:**
```json
{
  "name": "Main Router",
  "ipAddress": "192.168.1.1",
  "secret": "radius_secret",
  "coaPort": 3799,
  "apiUsername": "admin",
  "apiPassword": "password",
  "apiPort": 8728
}
```

---

### `GET /api/nas/:id`
Get single router details.

---

### `PUT /api/nas/:id`
Update router configuration.

---

### `DELETE /api/nas/:id`
Delete a router.

---

### `POST /api/nas/:id/test`
Test connection to a router.

**Response:**
```json
{
  "success": true,
  "message": "Connection successful",
  "latency": 45
}
```

---

### `GET /api/nas/:id/live-status`
Get real-time status and active session counts from a specific router.

**Response:**
```json
{
  "id": "string",
  "status": "ONLINE | OFFLINE",
  "uptime": "5d 12h 30m",
  "lastSeen": "2024-12-25T10:00:00Z",
  "cpuLoad": 15,
  "memoryUsage": 256,
  "memoryTotal": 1024,
  "activeSessions": {
    "pppoe": 45,
    "hotspot": 12,
    "total": 57
  }
}
```

---

## 8. Customer Live Status

> **Service File:** `src/services/customerService.ts`

### `GET /api/customers/:id/live-status`
Get real-time online status and session duration for a customer.

**Response:**
```json
{
  "id": "string",
  "isOnline": true,
  "sessionUptime": "2h 30m 15s", // If online
  "lastSeenAgo": "15m ago"        // If offline
}
```

---

## 9. Packages Endpoints

> **Service File:** `src/services/packageService.ts`

### `GET /api/packages`
Get list of all packages (Hotspot and PPPoE).

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "1.5 Hours @ 10",
    "type": "HOTSPOT",
    "price": 10,
    "downloadSpeed": 5,
    "uploadSpeed": 5,
    "sessionTime": 90,
    "sessionTimeUnit": "MINUTES",
    "isActive": true,
    "routerIds": ["r1"]
  }
]
```

---

### `POST /api/packages`
Create a new package.

**Request Body:**
```json
{
  "name": "Home Fiber 10Mbps",
  "type": "PPPOE",
  "price": 2500,
  "downloadSpeed": 10,
  "uploadSpeed": 10,
  "routerIds": ["r1", "r2"]
}
```

---

### `PUT /api/packages/:id`
Update an existing package.

**Request Body:**
```json
{
  "name": "Home Fiber 10Mbps Updated",
  "price": 3000
}
```

---

### `DELETE /api/packages/:id`
Delete a package.

---

### `GET /api/packages/:id/stats`
Get performance metrics for a package.

**Response:**
```json
{
  "totalClients": 150,
  "activeClients": 120,
  "expiredClients": 30,
  "revenue": 450000
}
```

---

## 10. Finance Endpoints

> **Service File:** `src/services/paymentService.ts` and `src/services/expenseService.ts`

### `GET /api/finance/income`
Get income transactions and stats.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `startDate` | string | ISO date string |
| `endDate` | string | ISO date string |
| `search` | string | Search query |
| `method` | string | Filter method |

**Response:**
```json
{
  "transactions": [
    {
      "id": 1,
      "date": "2025-12-27T10:00:00Z",
      "customer": "Customer Name",
      "description": "Payment",
      "amount": 2500,
      "method": "M-Pesa",
      "reference": "REF123",
      "status": "completed"
    }
  ],
  "stats": {
    "totalIncome": 50000,
    "mpesaTotal": 30000,
    "cashTotal": 20000,
    "totalTransactions": 15
  }
}
```

---

### `POST /api/finance/income`
Record a new income transaction.

**Request Body:**
```json
{
  "customerName": "John Doe",
  "amount": 2500,
  "method": "M-Pesa",
  "reference": "REF123",
  "date": "2025-12-27",
  "description": "Notes"
}
```

---

### `GET /api/finance/expenses`
Get expenses listing and stats.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number |
| `search` | string | Search query |
| `category` | string | Category filter |

**Response:**
```json
{
  "expenses": [
    {
      "id": "EXP-001",
      "description": "Office Rent",
      "category": "rent",
      "vendor": "Landlord",
      "amount": 15000,
      "paymentMethod": "Bank Transfer",
      "date": "2025-12-01",
      "isRecurring": true
    }
  ],
  "stats": {
    "totalExpenses": 15000,
    "byCategory": { "rent": 15000 }
  }
}
```

---

### `POST /api/finance/expenses`
Add a new expense.

**Request Body:**
```json
{
  "description": "Internet Bill",
  "category": "bandwidth",
  "vendor": "ISP Provider",
  "amount": 5000,
  "date": "2025-12-27",
  "paymentMethod": "M-Pesa",
  "isRecurring": true,
  "notes": "Monthly bill"
}
```

---

## 11. Voucher Endpoints

> **Service File:** `src/services/voucherService.ts`

### `GET /api/vouchers`
Get all vouchers for the tenant.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by `AVAILABLE`, `USED`, `EXPIRED`, `REVOKED` |
| `packageId` | string | Filter by package |

**Response:**
```json
[
  {
    "id": "uuid",
    "code": "HS-ABC123",
    "status": "AVAILABLE",
    "packageId": "uuid",
    "package": { "name": "1 Hour @ 20", "price": 20 },
    "createdAt": "2025-12-27T10:00:00Z",
    "expiresAt": "2026-01-27T10:00:00Z"
  }
]
```

---

### `POST /api/vouchers`
Generate new vouchers.

**Request Body:**
```json
{
  "count": 50,
  "packageId": "uuid",
  "type": "HOTSPOT",
  "prefix": "HS-"
}
```

**Response:** Returns array of generated vouchers.

---

### `DELETE /api/vouchers/:id`
Delete/revoke a voucher.

---

## 12. SMS Endpoints

> **Feature File:** `src/features/sms/SMSOutbox.tsx`

### `GET /api/sms`
Get SMS logs/outbox.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number |
| `pageSize` | number | Items per page |
| `search` | string | Search phone or message |

**Response:**
```json
{
  "messages": [
    {
      "id": 1420120,
      "phone": "254721731746",
      "message": "Dear Customer, your subscription has expired.",
      "status": "success",
      "initiator": "subscription expiry",
      "date": "2025-12-27T10:00:00Z"
    }
  ],
  "total": 313
}
```

---

### `POST /api/sms`
Send an SMS message.

**Request Body:**
```json
{
  "phone": "254712345678",
  "message": "Your message here"
}
```

---

### `DELETE /api/sms`
Clear all SMS logs.

---

### `GET /api/sms/balance`
Get SMS credits balance.

**Response:**
```json
{
  "balance": 245,
  "currency": "KES"
}
```

---

### `PUT /api/sms/settings`
Update SMS provider settings.

**Request Body:**
```json
{
  "provider": "AFRICASTALKING | TWILIO | INFOBIP",
  "apiKey": "xxx",
  "senderId": "EASYISP"
}
```

---

## 13. Payment Endpoints

> **Feature Files:** `src/features/payments/ElectronicPayments.tsx`, `ManualPayments.tsx`

### `GET /api/payments/electronic`
Get M-Pesa/electronic payment transactions.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number |
| `pageSize` | number | Items per page |
| `search` | string | Search by code, phone, or account |
| `startDate` | string | Filter from date |
| `endDate` | string | Filter to date |

**Response:**
```json
{
  "transactions": [
    {
      "id": 1,
      "trxCode": "TLQABC123",
      "amount": 2500,
      "date": "2025-12-27T10:00:00Z",
      "phone": "0712345678",
      "account": "0712345678",
      "site": "Main Office"
    }
  ],
  "total": 50,
  "totalAmount": 125000
}
```

---

### `GET /api/payments/manual`
Get manual recharge/payment records.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number |
| `pageSize` | number | Items per page |
| `search` | string | Search by ref, account, description |

**Response:**
```json
{
  "recharges": [
    {
      "id": 1,
      "ref": "TL12345ABC",
      "account": "0712345678",
      "amount": 2500,
      "description": "Paid Cash",
      "date": "2025-12-27T10:00:00Z"
    }
  ],
  "total": 158,
  "totalAmount": 395000
}
```

---

### `POST /api/payments/manual`
Record a manual payment/recharge.

**Request Body:**
```json
{
  "account": "0712345678",
  "amount": 2500,
  "description": "Paid via bank transfer"
}
```

---

### `DELETE /api/payments/manual`
Delete all manual payment records.

---

## 14. Customer Actions Endpoints

> **Feature File:** `src/features/customers/UserActionModals.tsx`

### `POST /api/customers/:id/mac-reset`
Reset customer MAC address binding.

**Response:**
```json
{
  "success": true,
  "message": "MAC address reset successfully"
}
```

---

### `POST /api/customers/:id/disconnect`
Disconnect active customer session.

**Response:**
```json
{
  "success": true,
  "message": "Customer disconnected"
}
```

---

### `POST /api/customers/:id/recharge`
Manual account recharge.

**Request Body:**
```json
{
  "amount": 2500,
  "description": "Manual top-up"
}
```

---

### `PUT /api/customers/:id/expiry`
Update customer expiry date.

**Request Body:**
```json
{
  "expiresAt": "2026-02-01T00:00:00Z"
}
```

---

### `PUT /api/customers/:id/package`
Change customer package.

**Request Body:**
```json
{
  "packageId": "uuid"
}
```

---

### `POST /api/customers/:id/suspend`
Suspend customer account.

---

### `POST /api/customers/:id/activate`
Activate suspended customer account.

---

## 15. MikroTik API Endpoints

> **Service File:** `src/services/nasService.ts`

### `GET /api/mikrotik/:nasId/system-stats`
Get real-time system statistics directly from a MikroTik router.

**Response:**
```json
{
  "boardName": "CCR2004-1G-12S+2XS",
  "version": "7.10",
  "cpuLoad": 15,
  "memoryUsed": 256000000,
  "memoryTotal": 1073741824,
  "uptime": "5d 12h 30m",
  "architecture": "tile"
}
```

---

### `GET /api/mikrotik/:nasId/sessions`
Get active user sessions from a router.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `type` | string | Filter by `pppoe` or `hotspot` |

**Response:**
```json
[
  {
    "id": "123abc",
    "username": "0712345678",
    "ipAddress": "192.168.1.100",
    "uptime": "2h 30m",
    "macAddress": "AA:BB:CC:DD:EE:FF",
    "type": "pppoe",
    "bytesIn": 1073741824,
    "bytesOut": 536870912
  }
]
```

---

### `POST /api/mikrotik/:nasId/disconnect`
Disconnect a specific user session from a router.

**Request Body:**
```json
{
  "username": "0712345678"
}
```

---

## 16. Router Wizard Endpoints

> **Service File:** `src/services/nasService.ts` (used by `LinkRouterWizard.tsx`)

### `POST /api/wizard/start`
Start the router onboarding wizard and get bootstrap script.

**Response:**
```json
{
  "token": "abc123xyz",
  "bootstrapScript": "/tool fetch url=https://..."
}
```

---

### `GET /api/wizard/:token/status`
Poll wizard status to check if router has connected.

**Response:**
```json
{
  "status": "PENDING | CONNECTED",
  "routerId": "uuid",
  "step": "connecting",
  "progress": 25,
  "message": "Waiting for router to connect..."
}
```

---

### `GET /api/wizard/:routerId/interfaces`
Get available interfaces from connected router.

**Response:**
```json
{
  "interfaces": ["ether1", "ether2", "wlan1", "bridge1"]
}
```

---

### `POST /api/wizard/:routerId/configure`
Configure services on the router.

**Request Body:**
```json
{
  "services": ["pppoe", "hotspot"],
  "ports": ["ether2", "ether3"],
  "subnet": "192.168.88.0/24"
}
```

---

### `GET /api/wizard/:routerId/script`
Get the full configuration script for the router.

**Response:**
```json
{
  "script": "/ip address add address=..."
}
```

---

### `POST /api/wizard/:routerId/auto-configure`
Execute automatic configuration on router.

---

## 17. Additional Tenant Endpoints

### `POST /api/tenant/logo`
Upload tenant logo image.

**Request:** `multipart/form-data` with `file` field

**Response:**
```json
{
  "logoUrl": "https://storage.example.com/logos/tenant123.png"
}
```

---

### `POST /api/tenant/operators/:id/reset-password`
Reset an operator's password (admin only).

**Response:**
```json
{
  "temporaryPassword": "xyz123abc",
  "message": "Password reset successfully"
}
```

---

## 18. Package Additional Endpoints

### `GET /api/packages/:id/router-revenue`
Get revenue breakdown by router for a specific package.

**Response:**
```json
[
  { "routerName": "CCR 2004", "revenue": 65000 },
  { "routerName": "Mazeras AP", "revenue": 25000 }
]
```

---

## 19. Chart of Accounts Endpoints

> **Feature File:** `src/features/finance/ChartOfAccounts.tsx`

### `GET /api/finance/accounts`
List all general ledger accounts.

**Response:**
```json
[
  {
    "id": "1",
    "code": "1000",
    "name": "Current Assets",
    "type": "Asset",
    "balance": 450000,
    "isSystem": true,
    "description": "..."
  }
]
```

### `POST /api/finance/accounts`
Create a new chart of account ledger.

**Request Body:**
```json
{
  "code": "1005",
  "name": "Petty Cash",
  "type": "Asset",
  "description": "Office petty cash"
}
```

### `DELETE /api/finance/accounts/:id`
Delete a ledger account (system accounts cannot be deleted).

---

## 20. Customer Invoices Endpoints

> **Feature File:** `src/features/finance/Invoices.tsx`

### `GET /api/finance/invoices`
List customer invoices with filtering.

**Query Parameters:** `page`, `pageSize`, `search`, `status`

**Response:**
```json
{
  "invoices": [
    {
      "id": "INV-2024001",
      "customerId": "cust_123",
      "customerName": "John Doe",
      "amount": 3000,
      "status": "paid",
      "dueDate": "2024-02-01",
      "items": [{ "description": "Internet", "amount": 3000 }]
    }
  ],
  "stats": {
    "total": 50000,
    "paid": 20000,
    "pending": 15000,
    "overdue": 15000
  }
}
```

### `POST /api/finance/invoices`
Create a manual invoice for a customer.

### `PUT /api/finance/invoices/:id/status`
Update invoice status (e.g. mark as paid, cancel).

---

## 21. GIS / Map Endpoints

> **Feature File:** `src/features/map/CustomerMap.tsx`

### `GET /api/map/data`
Optimized endpoint for map display, returning lightweight objects with coordinates and status.

**Response:**
```json
{
  "routers": [
    { "id": "r1", "lat": -4.04, "lng": 39.66, "status": "ONLINE", "name": "Main Router" }
  ],
  "customers": [
    { "id": "c1", "lat": -4.05, "lng": 39.67, "status": "ONLINE", "name": "John Doe" }
  ]
}
```

---

## 5. CORS Configuration

The backend should allow CORS from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:5050` (Production frontend)
- Any configured production domain

---

## 6. Token Handling

The frontend automatically:
1. Attaches `Authorization: Bearer <token>` header to all requests
2. Redirects to `/login` on 401 responses
3. Stores token in localStorage under key `auth-storage`
