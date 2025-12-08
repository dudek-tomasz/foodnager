# API Endpoints Auth Migration - Quick Fix Guide

## Problem

Po implementacji auth middleware, `context.locals.supabase` nie jest już ustawiany.
Wszystkie API endpoints muszą używać:

1. `context.locals.user.id` zamiast `DEFAULT_USER_ID`
2. `createSupabaseServerInstance()` zamiast `context.locals.supabase`

## Fixed Files

- ✅ `/api/fridge/index.ts` (GET, POST)
- ✅ `/api/fridge/[id].ts` (GET, PATCH, DELETE)

## Files To Fix

- ⏳ `/api/products.ts`
- ⏳ `/api/products/[id].ts`
- ⏳ `/api/units/index.ts`
- ⏳ `/api/tags/index.ts`
- ⏳ `/api/recipes/search-by-fridge.ts`

## Standard Fix Pattern

### Before:

```typescript
import { DEFAULT_USER_ID } from "../../../db/supabase.client";

function getAuthenticatedUser(_context: APIContext): string {
  return DEFAULT_USER_ID;
}

export async function GET(context: APIContext) {
  const userId = getAuthenticatedUser(context);
  const service = new Service(context.locals.supabase);
  // ...
}
```

### After:

```typescript
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { UnauthorizedError } from "../../../lib/errors";

function getAuthenticatedUser(context: APIContext): string {
  const user = context.locals.user;
  if (!user) {
    throw new UnauthorizedError("Authentication required");
  }
  return user.id;
}

export async function GET(context: APIContext) {
  const userId = getAuthenticatedUser(context);

  const supabase = createSupabaseServerInstance({
    cookies: context.cookies,
    headers: context.request.headers,
  });

  const service = new Service(supabase);
  // ...
}
```
