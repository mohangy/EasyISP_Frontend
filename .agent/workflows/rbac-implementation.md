---
description: Ensure RBAC is applied when working on any page/section
---

# RBAC Application Workflow

When adding new features, pages, buttons, or any interactive elements, follow these steps:

## 1. Define Permission (if new)

If the feature requires a new permission:
- Add to `src/lib/permissions.ts` → `PERMISSIONS` object
- Add to appropriate `PERMISSION_GROUPS` for the UI
- Add to role defaults in `ROLE_PERMISSIONS`

Example:
```ts
// In PERMISSIONS object
REPORTS_EXPORT: 'reports:export',

// In ROLE_PERMISSIONS
ADMIN: [...includes REPORTS_EXPORT...],
```

## 2. Protect Routes

For new pages, wrap in `PermissionRoute`:
```tsx
// In App.tsx
<Route path="/new-page" element={
    <PermissionRoute permission={PERMISSIONS.FEATURE_VIEW}>
        <NewPage />
    </PermissionRoute>
} />
```

## 3. Add to Sidebar

If adding navigation item, include permission:
```tsx
// In Sidebar.tsx navigation array
{ name: "New Feature", href: "/new-page", icon: Icon, permission: PERMISSIONS.FEATURE_VIEW },
```

## 4. Protect Buttons/Actions

Use `ProtectedButton` or `PermissionGate`:
```tsx
<ProtectedButton permission={PERMISSIONS.FEATURE_DELETE} onClick={handleDelete}>
    Delete
</ProtectedButton>

// OR
<PermissionGate permission={PERMISSIONS.FEATURE_EDIT}>
    <EditButton />
</PermissionGate>
```

## 5. Protect Dashboard Cards

If adding dashboard data, gate with permission:
```tsx
<PermissionGate permission={PERMISSIONS.DATA_VIEW} fallback={<LockedCard />}>
    <DataCard />
</PermissionGate>
```

## Quick Checklist
- [ ] New permission added to `permissions.ts`?
- [ ] Permission added to role defaults?
- [ ] Route wrapped with `PermissionRoute`?
- [ ] Sidebar item has permission field?
- [ ] Buttons use `ProtectedButton`?
- [ ] Cards/sections use `PermissionGate`?
