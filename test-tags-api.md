# Tags API - Manual Testing Guide

This document provides manual tests for the Tags API endpoints.

## Prerequisites

- Supabase instance running locally or accessible
- Authorization token (if authentication is enabled)
- API endpoint base URL (e.g., `http://localhost:4321`)

## Test 1: GET /api/tags - List All Tags

### Request
```bash
curl -X GET "http://localhost:4321/api/tags" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Expected Response (200 OK)
```json
{
  "data": [
    {
      "id": 1,
      "name": "bezglutenowe",
      "created_at": "2025-10-19T10:00:00Z"
    },
    {
      "id": 2,
      "name": "bez laktozy",
      "created_at": "2025-10-19T10:00:00Z"
    },
    ...
  ]
}
```

**Headers to check:**
- `X-Cache: MISS` (first request)
- `X-Cache: HIT` (subsequent requests within cache TTL)

---

## Test 2: GET /api/tags - Search Tags (Case-Insensitive)

### Request
```bash
curl -X GET "http://localhost:4321/api/tags?search=wegań" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Expected Response (200 OK)
```json
{
  "data": [
    {
      "id": 3,
      "name": "wegańskie",
      "created_at": "2025-10-19T10:00:00Z"
    }
  ]
}
```

---

## Test 3: GET /api/tags - Search with No Results

### Request
```bash
curl -X GET "http://localhost:4321/api/tags?search=nonexistent" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Expected Response (200 OK)
```json
{
  "data": []
}
```

---

## Test 4: GET /api/tags - Search Too Long

### Request
```bash
curl -X GET "http://localhost:4321/api/tags?search=this_is_a_very_long_search_query_that_exceeds_the_maximum_allowed_length" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Expected Response (422 Unprocessable Entity)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": {
      "errors": [
        {
          "path": ["search"],
          "message": "Search query too long (max 50 characters)"
        }
      ]
    }
  }
}
```

---

## Test 5: POST /api/tags - Create New Tag

### Request
```bash
curl -X POST "http://localhost:4321/api/tags" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-tag"
  }'
```

### Expected Response (201 Created)
```json
{
  "id": 31,
  "name": "test-tag",
  "created_at": "2025-10-19T12:00:00Z"
}
```

**Headers to check:**
- `Location: /api/tags/31`

---

## Test 6: POST /api/tags - Create Tag with Uppercase (Normalization)

### Request
```bash
curl -X POST "http://localhost:4321/api/tags" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "NEW-TAG"
  }'
```

### Expected Response (201 Created)
```json
{
  "id": 32,
  "name": "new-tag",
  "created_at": "2025-10-19T12:00:00Z"
}
```

**Note:** Name should be normalized to lowercase

---

## Test 7: POST /api/tags - Duplicate Tag (Case-Insensitive)

### Request
```bash
# First, create a tag
curl -X POST "http://localhost:4321/api/tags" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "duplicate-tag"
  }'

# Then try to create the same tag with different case
curl -X POST "http://localhost:4321/api/tags" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "DUPLICATE-TAG"
  }'
```

### Expected Response (409 Conflict)
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Tag with this name already exists",
    "details": {
      "field": "name",
      "value": "duplicate-tag"
    }
  }
}
```

---

## Test 8: POST /api/tags - Name Too Short

### Request
```bash
curl -X POST "http://localhost:4321/api/tags" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "a"
  }'
```

### Expected Response (400 Bad Request)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "errors": [
        {
          "path": ["name"],
          "message": "Tag name must be at least 2 characters"
        }
      ]
    }
  }
}
```

---

## Test 9: POST /api/tags - Name Too Long

### Request
```bash
curl -X POST "http://localhost:4321/api/tags" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "this-is-a-very-long-tag-name-that-exceeds-the-maximum-allowed-length-of-fifty-characters"
  }'
```

### Expected Response (400 Bad Request)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "errors": [
        {
          "path": ["name"],
          "message": "Tag name too long (max 50 characters)"
        }
      ]
    }
  }
}
```

---

## Test 10: POST /api/tags - Missing Name

### Request
```bash
curl -X POST "http://localhost:4321/api/tags" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Expected Response (400 Bad Request)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "errors": [
        {
          "path": ["name"],
          "message": "Tag name is required"
        }
      ]
    }
  }
}
```

---

## Test 11: Cache Invalidation After POST

### Requests
```bash
# 1. Get all tags (cache MISS)
curl -X GET "http://localhost:4321/api/tags" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
# Expected: X-Cache: MISS

# 2. Get all tags again (cache HIT)
curl -X GET "http://localhost:4321/api/tags" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
# Expected: X-Cache: HIT

# 3. Create new tag
curl -X POST "http://localhost:4321/api/tags" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name": "cache-test"}'
# Expected: 201 Created

# 4. Get all tags (cache should be MISS because of invalidation)
curl -X GET "http://localhost:4321/api/tags" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
# Expected: X-Cache: MISS (cache was invalidated)
```

---

## Test 12: Search Cache Independence

### Requests
```bash
# 1. Search for "szybkie" (cache MISS)
curl -X GET "http://localhost:4321/api/tags?search=szybkie" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
# Expected: X-Cache: MISS

# 2. Get all tags (cache MISS, different cache key)
curl -X GET "http://localhost:4321/api/tags" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
# Expected: X-Cache: MISS

# 3. Search for "szybkie" again (cache HIT)
curl -X GET "http://localhost:4321/api/tags?search=szybkie" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
# Expected: X-Cache: HIT

# 4. Get all tags again (cache HIT)
curl -X GET "http://localhost:4321/api/tags" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
# Expected: X-Cache: HIT
```

---

## Test Checklist

### GET /api/tags
- [ ] Returns all tags
- [ ] Search filtering works
- [ ] Case-insensitive search
- [ ] Empty search results return empty array (valid)
- [ ] Cache HIT/MISS headers present
- [ ] Second request returns cache HIT
- [ ] Search validation (max 50 chars)

### POST /api/tags
- [ ] Creates new tag successfully
- [ ] Lowercase normalization works
- [ ] Duplicate detection (case-insensitive)
- [ ] Name validation (min 2 chars)
- [ ] Name validation (max 50 chars)
- [ ] Missing name returns validation error
- [ ] Cache invalidation after creation
- [ ] Location header returned
- [ ] Returns 201 status code

### Cache Behavior
- [ ] GET caches independently per search query
- [ ] POST invalidates all tag caches
- [ ] Cache TTL is 10 minutes (600 seconds)
- [ ] X-Cache header correctly indicates HIT/MISS

---

## Notes

1. **Cache TTL**: Tags cache for 10 minutes. Wait 10+ minutes to test natural cache expiration.

2. **Lowercase Normalization**: All tags are stored in lowercase for consistency.

3. **Case-Insensitive Uniqueness**: "Test", "test", and "TEST" are considered duplicates.

4. **Global Tags**: Tags are visible to all authenticated users.

5. **Community-Driven**: Any authenticated user can create tags (can be changed to admin-only if needed).

