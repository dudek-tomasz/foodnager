# Cooking History API - Test Guide

## Overview

This guide provides test scenarios and examples for the Cooking History API endpoints.

## Prerequisites

- Authenticated user with valid JWT token
- At least one recipe in the database
- Products in the virtual fridge matching recipe ingredients

## Endpoints

### 1. POST /api/cooking-history - Create Cooking History Entry

Creates a new cooking history entry and automatically updates fridge quantities.

#### Success Case

**Request:**

```http
POST /api/cooking-history HTTP/1.1
Host: localhost:4321
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "recipe_id": 1
}
```

**Expected Response (201 Created):**

```json
{
  "id": 1,
  "recipe": {
    "id": 1,
    "title": "Tomato Soup"
  },
  "cooked_at": "2025-10-19T12:30:00Z",
  "fridge_state_before": {
    "items": [
      {
        "product_id": 10,
        "product_name": "Tomato",
        "quantity": 8,
        "unit": "pc"
      },
      {
        "product_id": 15,
        "product_name": "Onion",
        "quantity": 3,
        "unit": "pc"
      }
    ]
  },
  "fridge_state_after": {
    "items": [
      {
        "product_id": 10,
        "product_name": "Tomato",
        "quantity": 3,
        "unit": "pc"
      },
      {
        "product_id": 15,
        "product_name": "Onion",
        "quantity": 1,
        "unit": "pc"
      }
    ]
  },
  "updated_fridge_items": [
    {
      "product_id": 10,
      "old_quantity": 8,
      "new_quantity": 3,
      "unit": "pc"
    },
    {
      "product_id": 15,
      "old_quantity": 3,
      "new_quantity": 1,
      "unit": "pc"
    }
  ]
}
```

#### Error Cases

**401 Unauthorized - No Token:**

```http
POST /api/cooking-history HTTP/1.1
Host: localhost:4321
Content-Type: application/json

{
  "recipe_id": 1
}
```

**Response:**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**400 Bad Request - Invalid Body:**

```http
POST /api/cooking-history HTTP/1.1
Host: localhost:4321
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "recipe_id": "invalid"
}
```

**Response:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": {
      "recipe_id": ["Expected number, received string"]
    }
  }
}
```

**404 Not Found - Recipe Doesn't Exist:**

```http
POST /api/cooking-history HTTP/1.1
Host: localhost:4321
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "recipe_id": 99999
}
```

**Response:**

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Recipe not found or does not belong to you"
  }
}
```

**400 Bad Request - Insufficient Ingredients:**

```http
POST /api/cooking-history HTTP/1.1
Host: localhost:4321
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "recipe_id": 1
}
```

**Response:**

```json
{
  "error": {
    "code": "INSUFFICIENT_INGREDIENTS",
    "message": "Not enough ingredients in fridge to cook this recipe",
    "details": {
      "missing": [
        {
          "product_id": 10,
          "product_name": "Tomato",
          "required": 5,
          "available": 2
        }
      ]
    }
  }
}
```

---

### 2. GET /api/cooking-history - List Cooking History

Retrieves cooking history with optional filtering and pagination.

#### Basic Request

**Request:**

```http
GET /api/cooking-history HTTP/1.1
Host: localhost:4321
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected Response (200 OK):**

```json
{
  "data": [
    {
      "id": 2,
      "recipe": {
        "id": 1,
        "title": "Tomato Soup"
      },
      "cooked_at": "2025-10-19T14:00:00Z",
      "fridge_state_before": {
        "items": [
          {
            "product_id": 10,
            "product_name": "Tomato",
            "quantity": 8,
            "unit": "pc"
          }
        ]
      },
      "fridge_state_after": {
        "items": [
          {
            "product_id": 10,
            "product_name": "Tomato",
            "quantity": 3,
            "unit": "pc"
          }
        ]
      }
    },
    {
      "id": 1,
      "recipe": {
        "id": 2,
        "title": "Pasta Carbonara"
      },
      "cooked_at": "2025-10-18T19:00:00Z",
      "fridge_state_before": {
        "items": [
          {
            "product_id": 20,
            "product_name": "Pasta",
            "quantity": 500,
            "unit": "g"
          }
        ]
      },
      "fridge_state_after": {
        "items": [
          {
            "product_id": 20,
            "product_name": "Pasta",
            "quantity": 300,
            "unit": "g"
          }
        ]
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "total_pages": 1
  }
}
```

#### Filtered Requests

**Filter by Recipe:**

```http
GET /api/cooking-history?recipe_id=1 HTTP/1.1
Host: localhost:4321
Authorization: Bearer YOUR_JWT_TOKEN
```

**Filter by Date Range:**

```http
GET /api/cooking-history?from_date=2025-10-01&to_date=2025-10-31 HTTP/1.1
Host: localhost:4321
Authorization: Bearer YOUR_JWT_TOKEN
```

**Pagination:**

```http
GET /api/cooking-history?page=2&limit=10 HTTP/1.1
Host: localhost:4321
Authorization: Bearer YOUR_JWT_TOKEN
```

**Combined Filters:**

```http
GET /api/cooking-history?recipe_id=1&from_date=2025-10-15&page=1&limit=20 HTTP/1.1
Host: localhost:4321
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Error Cases

**401 Unauthorized:**

```http
GET /api/cooking-history HTTP/1.1
Host: localhost:4321
```

**Response:**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**422 Unprocessable Entity - Invalid Date Format:**

```http
GET /api/cooking-history?from_date=2025/10/01 HTTP/1.1
Host: localhost:4321
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": {
      "from_date": ["Invalid date format, use YYYY-MM-DD"]
    }
  }
}
```

**422 Unprocessable Entity - from_date After to_date:**

```http
GET /api/cooking-history?from_date=2025-10-20&to_date=2025-10-10 HTTP/1.1
Host: localhost:4321
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": {
      "from_date": ["from_date must be before or equal to to_date"]
    }
  }
}
```

**422 Unprocessable Entity - Invalid Limit:**

```http
GET /api/cooking-history?limit=150 HTTP/1.1
Host: localhost:4321
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": {
      "limit": ["Limit cannot exceed 100"]
    }
  }
}
```

---

## Test Sequence

### Complete Flow Test

1. **Setup: Add products to fridge**

   ```http
   POST /api/fridge
   {
     "product_id": 10,
     "quantity": 10,
     "unit_id": 1
   }
   ```

2. **Setup: Create a recipe**

   ```http
   POST /api/recipes
   {
     "title": "Test Recipe",
     "instructions": "Test instructions",
     "ingredients": [
       {
         "product_id": 10,
         "quantity": 5,
         "unit_id": 1
       }
     ]
   }
   ```

3. **Test: Cook the recipe**

   ```http
   POST /api/cooking-history
   {
     "recipe_id": 1
   }
   ```

4. **Verify: Check fridge updated**

   ```http
   GET /api/fridge
   ```

   Expected: Product quantity should be 5 (10 - 5)

5. **Verify: Check history recorded**

   ```http
   GET /api/cooking-history
   ```

   Expected: Entry with before=10, after=5

6. **Test: Try to cook again with insufficient ingredients**
   ```http
   POST /api/cooking-history
   {
     "recipe_id": 1
   }
   ```
   Expected: 400 INSUFFICIENT_INGREDIENTS (have 5, need 5, but another cook would require 10 total)

---

## Database Verification Queries

After creating cooking history, verify in database:

```sql
-- Check cooking history created
SELECT * FROM cooking_history WHERE user_id = 'YOUR_USER_ID' ORDER BY cooked_at DESC;

-- Check fridge updated
SELECT up.*, p.name, u.abbreviation
FROM user_products up
JOIN products p ON up.product_id = p.id
JOIN units u ON up.unit_id = u.id
WHERE up.user_id = 'YOUR_USER_ID';

-- Verify JSONB structure
SELECT
  id,
  recipe_id,
  fridge_state_before->'items' as before_items,
  fridge_state_after->'items' as after_items
FROM cooking_history
WHERE user_id = 'YOUR_USER_ID'
ORDER BY cooked_at DESC
LIMIT 1;
```

---

## Notes

- All operations are atomic - if any step fails, the entire transaction is rolled back
- FIFO (First In, First Out) strategy is used for deducting ingredients
- Fridge states are immutable snapshots stored as JSONB
- Items with quantity = 0 are automatically removed from fridge
- Timestamps are in UTC format (ISO 8601)
