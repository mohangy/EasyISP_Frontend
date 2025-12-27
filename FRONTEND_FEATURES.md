# EasyISP Frontend - Comprehensive Feature List

> **Generated:** December 23, 2025  
> **Version:** 1.0.0

---

## 🏗️ Core Architecture

| Component | Technology |
|-----------|------------|
| **Framework** | React 19 with TypeScript |
| **Build Tool** | Vite 7 |
| **Styling** | Tailwind CSS 4 |
| **State Management** | Zustand (with localStorage persistence) |
| **Routing** | React Router DOM 7 |
| **HTTP Client** | Axios with interceptors |
| **Form Handling** | React Hook Form + Zod validation |
| **Notifications** | React Hot Toast |
| **Charts** | Recharts |
| **Maps** | React Leaflet |
| **Icons** | Lucide React |

---

## 🔐 1. Authentication System

### Features
- Login page with email/password authentication
- Registration with automatic tenant creation
- JWT token management with auto-refresh
- Protected route guards
- Automatic logout on 401 responses
- Persistent authentication state (localStorage)

### Roles Supported
- `SUPER_ADMIN`
- `ADMIN`
- `STAFF`
- `VIEWER`

---

## 📊 2. Dashboard

### Statistics Display
- **Active Sessions** - Total, PPPoE, and Hotspot breakdown
- **Total Customers** - Count by connection type
- **Monthly Revenue** - Current month aggregate
- **Today's Revenue** - Daily income tracking

### Visualizations
- Revenue trend bar chart (last 6 months)
- Color-coded stat cards with trend indicators
- Quick links to customer segments

---

## 👥 3. Customer Management (Users Module)

### Tabbed Interface
- **PPPoE Tab** - Fixed broadband customers
- **Hotspot Tab** - WiFi voucher customers

### Customer Features
- Full CRUD operations (Create, Read, Update, Delete)
- Search and filter functionality
- Pagination support
- Real-time online/offline status indicators
- Status badges: `ACTIVE`, `SUSPENDED`, `EXPIRED`, `DISABLED`

### Customer Actions
| Action | Description |
|--------|-------------|
| **Suspend** | Temporarily disable account |
| **Activate** | Re-enable suspended account |
| **Delete** | Remove customer permanently |
| **Extend Expiry** | Add days to subscription |
| **Set Expiry** | Set specific expiry date |
| **Reset MAC** | Clear MAC address binding |
| **Purge Session** | Disconnect active session |
| **Change Package** | Assign different service plan |
| **Override Plan** | Custom speed settings |
| **Add Payment** | Record manual payment |
| **Send SMS** | Send text message |
| **Resolve Transaction** | Link payment reference |
| **Add Child Account** | Create sub-account |

### Bulk Operations
- **CSV Export** - Download customer list
- **CSV Import** - Bulk customer creation

### Customer Detail View
- Complete customer profile
- Session history
- Payment history
- Package information
- Data usage statistics
- Location data (if available)

---

## 🎫 4. Voucher Management

### Voucher List
- Paginated voucher listing
- Search by code
- Filter by status: `AVAILABLE`, `USED`, `EXPIRED`, `REVOKED`
- Online/offline status indicators

### Voucher Actions
| Action | Description |
|--------|-------------|
| **Delete** | Remove voucher |
| **Reset MAC** | Clear MAC binding |
| **Disconnect** | End active session |
| **Reset Counters** | Clear usage data |
| **Change Package** | Assign different plan |

### Bulk Operations
- **Delete Expired** - Remove all expired vouchers
- **Delete Unused** - Remove all unused vouchers

### Voucher Generation
- Single voucher creation
- Bulk generation (up to 1000)
- Customizable code prefix
- Package assignment
- Username/phone binding (optional)

### Voucher Detail View
- Full voucher information
- Session status
- IP address
- Connected site
- Usage statistics

---

## 📦 5. Package Management

### Package List
- Table view of all service packages
- Columns: Name, Service Type, Amount, Queue, Session Time, Bytes Quota, Router, Status
- Status badges with color coding

### Package Features
- Full CRUD operations
- Connection type: `PPPOE`, `HOTSPOT`, `DHCP`, `STATIC`
- Speed configuration (download/upload)
- Burst settings for MikroTik
- Data limits
- Session time limits
- Pricing in local currency
- Router-specific assignment

### Package Analytics
- Customer count using package
- Revenue generated
- Date range filtering

---

## 🌐 6. NAS/Router Management

### Router List
- All registered routers/NAS devices
- Search functionality
- VPN status indicators
- Connection status

### Router Onboarding
- Add new router dialog
- Auto-generate RADIUS secret
- Certificate generation (RouterOS v7+)
- Configuration script download

### Router Detail View
- Router information
- VPN configuration
- RADIUS credentials
- API credentials
- Certificate details

### Configuration Download
- MikroTik configuration script (.rsc)
- Rollback script
- CA certificate
- P12 certificate bundle

---

## 📡 7. Router Live Dashboard

### Real-Time Monitoring
- **System Stats**
  - CPU load with visual indicator
  - Memory usage percentage
  - Disk usage
  - Uptime
  - RouterOS version
  - Board name
  - Architecture

### Active Sessions
- **PPPoE Sessions** - List with disconnect action
- **Hotspot Sessions** - List with disconnect action
- Session details: username, IP address, uptime, caller ID

### Router Logs
- Topic-based log filtering
- Recent log entries display
- Color-coded log levels

### Actions
- Refresh data
- Auto-refresh toggle
- Disconnect individual users

---

## ⚙️ 8. Settings

### Coming Soon Features
- Tenant profile management
- RADIUS configuration
- SNMP settings
- VPN settings
- Notification preferences

---

## 🎨 9. UI Components

### Layout Components
- **MainLayout** - App shell with sidebar
- **Sidebar** - Navigation menu with icons
- **Header** - User info and actions
- **ThemeToggle** - Light/dark mode switch

### Shared Components
- **ComingSoon** - Placeholder for unimplemented features

### UI Primitives
- **Button** - Multiple variants (primary, secondary, danger, ghost)
- **Card** - Content container with header/body
- **Input** - Form input with label and error states
- **Modal** - Dialog with customizable header, body, footer

---

## 🛣️ 10. Application Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/login` | Login | Authentication |
| `/register` | Register | New account signup |
| `/dashboard` | Dashboard | Overview stats |
| `/users` | UserList | Customer management |
| `/users/:id` | UserDetail | Customer profile |
| `/vouchers/:id` | VoucherDetail | Voucher profile |
| `/packages` | PackageList | Service packages |
| `/packages/:id` | PackageDetails | Package analytics |
| `/nas` | NasList | Router management |
| `/nas/:id` | NasDetail | Router configuration |
| `/nas/:nasId/live` | RouterLiveDashboard | Live monitoring |
| `/settings` | Settings | App settings |
| `/payments` | ComingSoon | Payment tracking |
| `/sms` | ComingSoon | SMS gateway |
| `/map` | ComingSoon | Network map |
| `/support` | ComingSoon | Support tickets |
| `/portal` | PortalRedirect | Hotspot portal |

---

## 🔌 11. API Service Layer

### API Clients

| Namespace | Endpoints |
|-----------|-----------|
| **authApi** | login, register, logout, me, refresh |
| **customersApi** | CRUD, suspend, activate, extend, resetMac, purge, exportCsv, importCsv, addPayment, changePackage, overridePlan, sendSms, resolveTransaction, addChildAccount, getRealtimeStatus |
| **packagesApi** | CRUD, getAnalytics |
| **nasApi** | CRUD, getMetrics, getConfig |
| **sessionsApi** | getAll, disconnect |
| **dashboardApi** | getStats |
| **vouchersApi** | CRUD, resetMac, disconnect, resetCounters, changePackage, generate, deleteExpired, deleteUnused |
| **mikrotikApi** | getActiveSessions, getSystemStats, getInterfaces, getQueues, getDhcpLeases, getLogs, getFirewallFilter, getFirewallNat, disconnectUser, getPppSecrets, addPppSecret, removePppSecret, getHotspotUsers, addHotspotUser, removeHotspotUser |

### Features
- Automatic JWT token injection
- 401 response handling with auto-logout
- Environment-based API URL configuration

---

## 🎯 12. State Management

### Auth Store (Zustand)
```typescript
{
  user: User | null,
  token: string | null,
  isAuthenticated: boolean,
  login: (user, token) => void,
  logout: () => void
}
```

### Features
- Persistent state (localStorage)
- Type-safe with TypeScript
- Automatic rehydration on page load

---

## 🌙 13. Theme Support

- Light mode
- Dark mode
- Toggle button in header
- CSS variables for consistent theming

---

## 📱 14. Responsive Design

- Mobile-friendly layouts
- Collapsible sidebar
- Responsive tables
- Touch-friendly modals

---

## 🚧 15. Planned Features (Coming Soon)

| Feature | Description |
|---------|-------------|
| **Payment Management** | Track payments, invoices, subscriptions |
| **SMS Gateway** | Bulk SMS, templates, notifications |
| **Network Map** | Customer/router location visualization |
| **Support Tickets** | Customer inquiry management |

---

## 📁 Project Structure

```
src/
├── App.tsx                 # Main app with routes
├── main.tsx               # Entry point
├── index.css              # Global styles
├── components/
│   ├── layout/            # MainLayout, Sidebar, Header
│   ├── providers/         # ThemeProvider
│   ├── shared/            # ComingSoon
│   └── ui/                # Button, Card, Input, Modal
├── features/
│   ├── auth/              # Login, Register
│   ├── dashboard/         # Dashboard
│   ├── nas/               # NasList, NasDetail, RouterLiveDashboard
│   ├── packages/          # PackageList, PackageDetails
│   ├── settings/          # Settings
│   └── users/             # UserList, UserDetail, VoucherDetail, Modals
├── services/
│   └── api.ts             # Axios API client
├── store/
│   └── authStore.ts       # Zustand auth state
├── types/
│   └── index.ts           # TypeScript interfaces
└── lib/
    └── utils.ts           # Utility functions
```

---

> **Note:** This is a production-ready ISP management dashboard with comprehensive MikroTik integration, suitable for managing both PPPoE (fixed broadband) and Hotspot (WiFi/voucher) customers.
