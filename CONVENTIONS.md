# SkaleFlow Development Conventions

This document outlines the development conventions and patterns used throughout the SkaleFlow codebase.

## Table of Contents

- [URL Parameter Conventions](#url-parameter-conventions)

## URL Parameter Conventions

### Overview

All pages with tabs, filters, or view modes **must** reflect the current state in the URL using query parameters. This provides several benefits:

- **Shareable URLs**: Users can copy and share links to specific views
- **Browser History**: Users can navigate back/forward through different views
- **Bookmarkable**: Users can bookmark specific filtered/tabbed views
- **Better UX**: Refreshing the page maintains the user's current view

### Implementation Pattern

Use **query parameters** (e.g., `/team?tab=credits`) rather than hash fragments. Query parameters are the industry standard for this use case.

#### Standard Implementation Steps

1. **Import Next.js hooks**:
   ```typescript
   import { useRouter, useSearchParams } from 'next/navigation';
   ```

2. **Initialize router and params**:
   ```typescript
   const router = useRouter();
   const searchParams = useSearchParams();
   const tabParam = searchParams.get('tab') as TabType | null;
   ```

3. **Initialize state from URL**:
   ```typescript
   const [activeTab, setActiveTab] = useState<TabType>(tabParam || 'defaultTab');
   ```

4. **Sync state with URL changes**:
   ```typescript
   useEffect(() => {
     if (tabParam && ['tab1', 'tab2', 'tab3'].includes(tabParam)) {
       setActiveTab(tabParam);
     }
   }, [tabParam]);
   ```

5. **Create handler to update both state and URL**:
   ```typescript
   const handleTabChange = (tab: TabType) => {
     setActiveTab(tab);
     const params = new URLSearchParams(searchParams.toString());

     // Remove parameter if it's the default value (keeps URLs clean)
     if (tab === 'defaultTab') {
       params.delete('tab');
     } else {
       params.set('tab', tab);
     }

     const queryString = params.toString();
     router.push(
       queryString ? `/page-path?${queryString}` : '/page-path',
       { scroll: false } // Prevents page jump when changing tabs
     );
   };
   ```

6. **Use the handler in your UI**:
   ```typescript
   <button onClick={() => handleTabChange('credits')}>
     Credits
   </button>
   ```

### Parameter Naming Conventions

- **Tabs**: Use `?tab=<value>` for primary navigation tabs
  - Example: `/team?tab=permissions`

- **Filters**: Use `?filter=<value>` for filter states
  - Example: `/admin/meetings?filter=past`

- **View Modes**: Use `?view=<value>` for display mode toggles
  - Example: `/admin/meetings?view=list`

- **Status Filters**: Use `?status=<value>` for status-based filters
  - Example: `/content/publish-log?status=failed`

- **Platform Filters**: Use `?platform=<value>` for platform-specific filters
  - Example: `/content/publish-log?platform=linkedin`

### Multiple Parameters

Pages can use multiple URL parameters simultaneously:

```
/content/publish-log?status=failed&platform=linkedin
```

When updating one parameter, preserve the others:

```typescript
const handleStatusChange = (status: StatusType) => {
  setStatusFilter(status);
  const params = new URLSearchParams(searchParams.toString()); // Preserves all existing params

  if (status === 'all') {
    params.delete('status');
  } else {
    params.set('status', status);
  }

  const queryString = params.toString();
  router.push(queryString ? `/content/publish-log?${queryString}` : '/content/publish-log', { scroll: false });
};
```

### Examples

#### Pages Using Tab Parameters

- `/team?tab=permissions`
- `/team?tab=credits`
- `/billing?tab=transactions`
- `/billing?tab=invoices`
- `/content/reviews?tab=approvals`
- `/marketing/audiences?tab=pipeline_audiences`
- `/marketing/campaigns/[id]?tab=creatives`
- `/admin/users/[id]?tab=billing`

#### Pages Using Filter Parameters

- `/content/publish-log?status=failed`
- `/content/publish-log?status=published&platform=linkedin`
- `/admin/meetings?filter=past&view=list`

### Best Practices

1. **Keep URLs Clean**: Remove parameters when they match the default value
2. **Preserve Scroll Position**: Use `{ scroll: false }` option in `router.push()`
3. **Validate Parameters**: Check that URL parameters match expected values before applying
4. **Type Safety**: Cast URL parameters to the appropriate type with validation
5. **Consistency**: Use the same parameter names for the same concepts across all pages

### Implementation Checklist

When adding tabs/filters to a new page:

- [ ] Import `useRouter` and `useSearchParams`
- [ ] Read URL parameter on mount
- [ ] Initialize state from URL parameter
- [ ] Create sync useEffect for URL changes
- [ ] Create handler function to update both state and URL
- [ ] Update all UI interactions to use the handler
- [ ] Test URL sharing and browser back/forward
- [ ] Ensure default values don't add parameters to URL

---

*Last Updated: February 2026*
