# Recipes API - Test Collection for Postman/curl

## Prerequisites
1. Start Supabase: `npx supabase start`
2. Reset database: `npx supabase db reset`
3. Start dev server: `npm run dev`
4. Get auth token from Supabase Dashboard or create test user

## Environment Variables
```bash
# Set these in Postman Environment or use in terminal
BASE_URL=http://localhost:4321
AUTH_TOKEN=your_supabase_jwt_token_here
```

---

## 1. GET /api/recipes - List Recipes

### 1.1 Basic List (no filters)
```bash
curl -X GET "http://localhost:4321/api/recipes" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### 1.2 List with Pagination
```bash
curl -X GET "http://localhost:4321/api/recipes?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### 1.3 Search by Text
```bash
curl -X GET "http://localhost:4321/api/recipes?search=tomato" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### 1.4 Filter by Source
```bash
curl -X GET "http://localhost:4321/api/recipes?source=user" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### 1.5 Filter by Difficulty
```bash
curl -X GET "http://localhost:4321/api/recipes?difficulty=easy" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### 1.6 Filter by Max Cooking Time
```bash
curl -X GET "http://localhost:4321/api/recipes?max_cooking_time=30" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### 1.7 Filter by Tags (comma-separated)
```bash
curl -X GET "http://localhost:4321/api/recipes?tags=1,2" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### 1.8 Sort by Title (ascending)
```bash
curl -X GET "http://localhost:4321/api/recipes?sort=title&order=asc" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### 1.9 Sort by Cooking Time (descending)
```bash
curl -X GET "http://localhost:4321/api/recipes?sort=cooking_time&order=desc" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### 1.10 Complex Query (multiple filters)
```bash
curl -X GET "http://localhost:4321/api/recipes?search=soup&difficulty=easy&max_cooking_time=45&sort=created_at&order=desc&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

---

## 2. POST /api/recipes - Create Recipe

### 2.1 Create Simple Recipe
```bash
curl -X POST "http://localhost:4321/api/recipes" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tomato Soup",
    "instructions": "1. Chop tomatoes\n2. Cook in pot for 20 minutes\n3. Blend and serve",
    "ingredients": [
      {
        "product_id": 1,
        "quantity": 5,
        "unit_id": 1
      }
    ]
  }'
```

### 2.2 Create Recipe with All Fields
```bash
curl -X POST "http://localhost:4321/api/recipes" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Classic Spaghetti Carbonara",
    "description": "Traditional Italian pasta dish with eggs, cheese, and bacon",
    "instructions": "1. Cook pasta al dente\n2. Fry bacon until crispy\n3. Mix eggs with cheese\n4. Combine all ingredients quickly\n5. Serve immediately with black pepper",
    "cooking_time": 25,
    "difficulty": "medium",
    "ingredients": [
      {
        "product_id": 1,
        "quantity": 400,
        "unit_id": 2
      },
      {
        "product_id": 2,
        "quantity": 200,
        "unit_id": 2
      },
      {
        "product_id": 3,
        "quantity": 4,
        "unit_id": 1
      }
    ],
    "tag_ids": [1, 2]
  }'
```

### 2.3 Create Easy Recipe
```bash
curl -X POST "http://localhost:4321/api/recipes" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Quick Scrambled Eggs",
    "description": "Simple breakfast in 5 minutes",
    "instructions": "1. Beat eggs\n2. Heat pan with butter\n3. Cook while stirring\n4. Season and serve",
    "cooking_time": 5,
    "difficulty": "easy",
    "ingredients": [
      {
        "product_id": 3,
        "quantity": 3,
        "unit_id": 1
      },
      {
        "product_id": 4,
        "quantity": 10,
        "unit_id": 2
      }
    ],
    "tag_ids": [1]
  }'
```

### 2.4 Create Recipe with Multiple Ingredients
```bash
curl -X POST "http://localhost:4321/api/recipes" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Vegetable Stir Fry",
    "description": "Healthy and colorful vegetable mix",
    "instructions": "1. Prepare all vegetables\n2. Heat wok with oil\n3. Stir-fry in order of cooking time\n4. Add soy sauce\n5. Serve hot with rice",
    "cooking_time": 15,
    "difficulty": "easy",
    "ingredients": [
      {
        "product_id": 5,
        "quantity": 200,
        "unit_id": 2
      },
      {
        "product_id": 6,
        "quantity": 150,
        "unit_id": 2
      },
      {
        "product_id": 7,
        "quantity": 100,
        "unit_id": 2
      },
      {
        "product_id": 8,
        "quantity": 1,
        "unit_id": 1
      },
      {
        "product_id": 9,
        "quantity": 30,
        "unit_id": 3
      }
    ],
    "tag_ids": [3, 4]
  }'
```

---

## 3. GET /api/recipes/:id - Get Recipe by ID

### 3.1 Get Specific Recipe
```bash
curl -X GET "http://localhost:4321/api/recipes/1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### 3.2 Get Non-existent Recipe (should return 404)
```bash
curl -X GET "http://localhost:4321/api/recipes/99999" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### 3.3 Get Recipe with Invalid ID (should return 400)
```bash
curl -X GET "http://localhost:4321/api/recipes/invalid" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

---

## 4. PATCH /api/recipes/:id - Update Recipe

### 4.1 Update Title Only
```bash
curl -X PATCH "http://localhost:4321/api/recipes/1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Tomato Soup Recipe"
  }'
```

### 4.2 Update Cooking Time and Difficulty
```bash
curl -X PATCH "http://localhost:4321/api/recipes/1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "cooking_time": 30,
    "difficulty": "hard"
  }'
```

### 4.3 Update Description and Instructions
```bash
curl -X PATCH "http://localhost:4321/api/recipes/1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "An even better tomato soup with more flavor",
    "instructions": "1. Chop tomatoes finely\n2. Sauté onions and garlic\n3. Add tomatoes and cook for 25 minutes\n4. Blend until smooth\n5. Add cream and season\n6. Serve hot with basil"
  }'
```

### 4.4 Replace All Ingredients
```bash
curl -X PATCH "http://localhost:4321/api/recipes/1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "ingredients": [
      {
        "product_id": 1,
        "quantity": 8,
        "unit_id": 1
      },
      {
        "product_id": 10,
        "quantity": 1,
        "unit_id": 1
      },
      {
        "product_id": 11,
        "quantity": 2,
        "unit_id": 1
      }
    ]
  }'
```

### 4.5 Replace All Tags
```bash
curl -X PATCH "http://localhost:4321/api/recipes/1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "tag_ids": [3, 4, 5]
  }'
```

### 4.6 Remove All Tags (empty array)
```bash
curl -X PATCH "http://localhost:4321/api/recipes/1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "tag_ids": []
  }'
```

### 4.7 Update Multiple Fields
```bash
curl -X PATCH "http://localhost:4321/api/recipes/1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Perfect Tomato Soup",
    "description": "The ultimate tomato soup recipe",
    "cooking_time": 35,
    "difficulty": "medium",
    "ingredients": [
      {
        "product_id": 1,
        "quantity": 10,
        "unit_id": 1
      }
    ],
    "tag_ids": [1, 2, 3]
  }'
```

### 4.8 Invalid Update - Empty Body (should return 400)
```bash
curl -X PATCH "http://localhost:4321/api/recipes/1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 5. DELETE /api/recipes/:id - Delete Recipe

### 5.1 Delete Existing Recipe
```bash
curl -X DELETE "http://localhost:4321/api/recipes/1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### 5.2 Delete Non-existent Recipe (should return 404)
```bash
curl -X DELETE "http://localhost:4321/api/recipes/99999" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

---

## 6. Error Cases to Test

### 6.1 Missing Authorization (should return 401)
```bash
curl -X GET "http://localhost:4321/api/recipes" \
  -H "Content-Type: application/json"
```

### 6.2 Invalid Authorization Token (should return 401)
```bash
curl -X GET "http://localhost:4321/api/recipes" \
  -H "Authorization: Bearer invalid_token_here" \
  -H "Content-Type: application/json"
```

### 6.3 Create Recipe without Required Fields (should return 400)
```bash
curl -X POST "http://localhost:4321/api/recipes" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Incomplete Recipe"
  }'
```

### 6.4 Create Recipe with Duplicate Ingredients (should return 400)
```bash
curl -X POST "http://localhost:4321/api/recipes" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Invalid Recipe",
    "instructions": "Test",
    "ingredients": [
      {
        "product_id": 1,
        "quantity": 5,
        "unit_id": 1
      },
      {
        "product_id": 1,
        "quantity": 3,
        "unit_id": 1
      }
    ]
  }'
```

### 6.5 Create Recipe with Non-existent Product (should return 404)
```bash
curl -X POST "http://localhost:4321/api/recipes" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Recipe",
    "instructions": "Test",
    "ingredients": [
      {
        "product_id": 99999,
        "quantity": 5,
        "unit_id": 1
      }
    ]
  }'
```

### 6.6 Invalid Query Parameters (should return 422)
```bash
curl -X GET "http://localhost:4321/api/recipes?page=0&limit=200" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### 6.7 Invalid Difficulty Value (should return 422)
```bash
curl -X GET "http://localhost:4321/api/recipes?difficulty=super_easy" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

---

## 7. Postman Collection JSON

You can import this collection into Postman:

```json
{
  "info": {
    "name": "Foodnager - Recipes API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:4321",
      "type": "string"
    },
    {
      "key": "authToken",
      "value": "YOUR_TOKEN_HERE",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "List Recipes",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{authToken}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/recipes",
          "host": ["{{baseUrl}}"],
          "path": ["api", "recipes"]
        }
      }
    },
    {
      "name": "Create Recipe",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{authToken}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"title\": \"Tomato Soup\",\n  \"description\": \"Simple and delicious\",\n  \"instructions\": \"1. Chop tomatoes\\n2. Cook\\n3. Blend\",\n  \"cooking_time\": 30,\n  \"difficulty\": \"easy\",\n  \"ingredients\": [\n    {\n      \"product_id\": 1,\n      \"quantity\": 5,\n      \"unit_id\": 1\n    }\n  ],\n  \"tag_ids\": [1]\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/recipes",
          "host": ["{{baseUrl}}"],
          "path": ["api", "recipes"]
        }
      }
    },
    {
      "name": "Get Recipe by ID",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{authToken}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/recipes/1",
          "host": ["{{baseUrl}}"],
          "path": ["api", "recipes", "1"]
        }
      }
    },
    {
      "name": "Update Recipe",
      "request": {
        "method": "PATCH",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{authToken}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"title\": \"Updated Recipe Title\",\n  \"cooking_time\": 25\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/recipes/1",
          "host": ["{{baseUrl}}"],
          "path": ["api", "recipes", "1"]
        }
      }
    },
    {
      "name": "Delete Recipe",
      "request": {
        "method": "DELETE",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{authToken}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/recipes/1",
          "host": ["{{baseUrl}}"],
          "path": ["api", "recipes", "1"]
        }
      }
    }
  ]
}
```

---

## 8. How to Get Auth Token

### Option 1: Using Supabase Dashboard
1. Go to http://localhost:54323 (Supabase Studio)
2. Go to Authentication → Users
3. Create a test user or select existing user
4. Copy the JWT token from user details

### Option 2: Using curl to sign up/sign in
```bash
# Sign up new user
curl -X POST "http://localhost:54321/auth/v1/signup" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Sign in existing user
curl -X POST "http://localhost:54321/auth/v1/token?grant_type=password" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

The response will contain `access_token` field - use this as your Bearer token.

---

## 9. Quick Test Sequence

Run these in order to test the complete flow:

```bash
# 1. Create a recipe
curl -X POST "http://localhost:4321/api/recipes" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Soup","instructions":"Cook it","ingredients":[{"product_id":1,"quantity":5,"unit_id":1}]}'

# 2. List all recipes (should see your new recipe)
curl -X GET "http://localhost:4321/api/recipes" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Get specific recipe (use ID from step 1 response)
curl -X GET "http://localhost:4321/api/recipes/1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Update the recipe
curl -X PATCH "http://localhost:4321/api/recipes/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Test Soup","cooking_time":20}'

# 5. Delete the recipe
curl -X DELETE "http://localhost:4321/api/recipes/1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 6. Verify deletion (should return 404)
curl -X GET "http://localhost:4321/api/recipes/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Notes

- Replace `YOUR_TOKEN_HERE` with actual Supabase JWT token
- Product IDs and Unit IDs must exist in database (check seed data)
- Tag IDs must exist in database
- All timestamps are in ISO 8601 format
- Responses include pagination metadata for list endpoints
- CASCADE DELETE removes related ingredients, tags, and cooking history

