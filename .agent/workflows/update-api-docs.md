---
description: How to update the API requirements document when frontend changes are made
---

# Update API Requirements Workflow

Whenever you add or modify API calls in the frontend, update the API requirements document:

## Steps

1. **Open the document**
   - File: `Frontend/FRONTEND_API_REQUIREMENTS.md`

2. **Add/Update the endpoint documentation**
   - Method (GET/POST/PUT/DELETE)
   - Path (e.g., `/api/dashboard/stats`)
   - Request body (if any)
   - Response structure
   - Headers required
   - Query parameters (if any)

3. **Update the changelog**
   - Add a new row with today's date and what changed

4. **Update the "Last Updated" date** in the header

5. **Update the priority table** if adding new endpoints

## Template for new endpoints

```markdown
### `METHOD /api/path`
Description of what this endpoint does.

**Headers:**
\`\`\`
Authorization: Bearer <token>
\`\`\`

**Request Body:** (if applicable)
\`\`\`json
{
  "field": "type"
}
\`\`\`

**Response:**
\`\`\`json
{
  "field": "value"
}
\`\`\`

**Notes:**
- Any important implementation details
```

## Service files to check

When updating this document, scan these service files for API calls:
- `src/services/api.ts` - Base axios instance
- `src/services/authService.ts` - Authentication endpoints
- `src/services/dashboardService.ts` - Dashboard data endpoints
- Any new service files in `src/services/`
