# Test Units API Endpoint

## Endpoint Details
- **URL**: `GET /api/units`
- **Authentication**: Required (Bearer token)
- **Response**: List of all measurement units

## Test Cases

### 1. Get All Units (Success)
```bash
curl -X GET http://localhost:4321/api/units \
  -H "Content-Type: application/json"
```

**Expected Response** (200 OK):
```json
{
  "data": [
    {
      "id": 2,
      "name": "gram",
      "abbreviation": "g",
      "created_at": "2025-10-18T12:00:00Z"
    },
    {
      "id": 3,
      "name": "garść",
      "abbreviation": "garść",
      "created_at": "2025-10-18T12:00:00Z"
    },
    ...
  ]
}
```

**Expected Headers**:
- `X-Cache: MISS` (first request)
- `X-Cache: HIT` (subsequent requests within 1 hour)

### 2. Cache Test (Verify Caching Works)
```bash
# First request - should be MISS
curl -X GET http://localhost:4321/api/units \
  -H "Content-Type: application/json" \
  -i | grep "X-Cache"

# Second request immediately after - should be HIT
curl -X GET http://localhost:4321/api/units \
  -H "Content-Type: application/json" \
  -i | grep "X-Cache"
```

## Expected Behaviors

1. **Sorted Alphabetically**: Units should be returned in alphabetical order by name
2. **Cached Response**: Second request should return cached data (< 1ms)
3. **Cache TTL**: Cache should expire after 1 hour (3600 seconds)
4. **All Units**: Should return all 17 units from seed data

## Performance Expectations

- **First request (cache miss)**: < 50ms
- **Cached requests (cache hit)**: < 5ms
- **Response size**: ~1-2 KB

## Notes

- Currently uses DEFAULT_USER_ID for authentication (temporary)
- TODO: Add real authentication with Bearer token validation
- Cache is in-memory, will be cleared on server restart

