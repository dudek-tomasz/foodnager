# REST API Plan for Foodnager

## 1. Resources

### Core Resources
- **Users** - User profiles and authentication (managed by Supabase Auth, extended with custom fields)
- **Products** - Global and user-specific products (linked to `public.products`)
- **User Products** - Virtual fridge items (linked to `public.user_products`)
- **Recipes** - User-created, API-sourced, and AI-generated recipes (linked to `public.recipes`)
- **Units** - Measurement units dictionary (linked to `public.units`)
- **Tags** - Recipe category tags (linked to `public.tags`)
- **Cooking History** - Historical record of cooked recipes (linked to `public.cooking_history`)

## 2. API Endpoints

<!-- ### 2.1 Authentication & User Management -->

<!-- #### Register User
- **Method:** `POST`
- **Path:** `/api/auth/register`
- **Description:** Register a new user account
- **Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "username": "johndoe",
  "full_name": "John Doe"
}
```
- **Success Response:** `201 Created`
```json
{
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "username": "johndoe",
    "full_name": "John Doe",
    "created_at": "2025-10-18T12:00:00Z"
  },
  "session": {
    "access_token": "jwt-token",
    "refresh_token": "refresh-token",
    "expires_at": 1729260000
  }
}
```
- **Error Responses:**
  - `400 Bad Request` - Invalid input data (e.g., username < 3 characters)
  - `409 Conflict` - Email or username already exists
  - `422 Unprocessable Entity` - Validation error

#### Login User
- **Method:** `POST`
- **Path:** `/api/auth/login`
- **Description:** Authenticate user and create session
- **Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```
- **Success Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "username": "johndoe",
    "full_name": "John Doe"
  },
  "session": {
    "access_token": "jwt-token",
    "refresh_token": "refresh-token",
    "expires_at": 1729260000
  }
}
```
- **Error Responses:**
  - `401 Unauthorized` - Invalid credentials
  - `422 Unprocessable Entity` - Validation error

#### Logout User
- **Method:** `POST`
- **Path:** `/api/auth/logout`
- **Description:** Invalidate current session
- **Headers:** `Authorization: Bearer {access_token}`
- **Success Response:** `204 No Content`
- **Error Responses:**
  - `401 Unauthorized` - Invalid or expired token

#### Get Current User
- **Method:** `GET`
- **Path:** `/api/auth/me`
- **Description:** Get current authenticated user profile
- **Headers:** `Authorization: Bearer {access_token}`
- **Success Response:** `200 OK`
```json
{
  "id": "uuid-string",
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "created_at": "2025-10-18T12:00:00Z",
  "updated_at": "2025-10-18T12:00:00Z"
}
```
- **Error Responses:**
  - `401 Unauthorized` - Invalid or expired token

#### Update User Profile
- **Method:** `PATCH`
- **Path:** `/api/auth/me`
- **Description:** Update current user profile
- **Headers:** `Authorization: Bearer {access_token}`
- **Request Body:**
```json
{
  "username": "newusername",
  "full_name": "Jane Doe"
}
```
- **Success Response:** `200 OK`
```json
{
  "id": "uuid-string",
  "email": "user@example.com",
  "username": "newusername",
  "full_name": "Jane Doe",
  "updated_at": "2025-10-18T13:00:00Z"
}
```
- **Error Responses:**
  - `400 Bad Request` - Invalid input
  - `401 Unauthorized` - Invalid token
  - `409 Conflict` - Username already taken -->

### 2.2 Products

#### List Products
- **Method:** `GET`
- **Path:** `/api/products`
- **Description:** Get list of global and user's private products
- **Headers:** `Authorization: Bearer {access_token}`
- **Query Parameters:**
  - `search` (string, optional) - Full-text search in product names
  - `scope` (enum: `global`, `private`, `all`, optional, default: `all`) - Filter by product scope
  - `page` (integer, optional, default: 1) - Page number
  - `limit` (integer, optional, default: 20, max: 100) - Items per page
- **Success Response:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "name": "Tomato",
      "user_id": null,
      "is_global": true,
      "created_at": "2025-10-18T12:00:00Z"
    },
    {
      "id": 2,
      "name": "My Special Spice",
      "user_id": "uuid-string",
      "is_global": false,
      "created_at": "2025-10-18T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```
- **Error Responses:**
  - `401 Unauthorized` - Invalid token
  - `422 Unprocessable Entity` - Invalid query parameters

#### Get Product by ID
- **Method:** `GET`
- **Path:** `/api/products/:id`
- **Description:** Get single product details
- **Headers:** `Authorization: Bearer {access_token}`
- **Success Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Tomato",
  "user_id": null,
  "is_global": true,
  "created_at": "2025-10-18T12:00:00Z"
}
```
- **Error Responses:**
  - `401 Unauthorized` - Invalid token
  - `404 Not Found` - Product not found or not accessible

#### Create Product
- **Method:** `POST`
- **Path:** `/api/products`
- **Description:** Create a new private product
- **Headers:** `Authorization: Bearer {access_token}`
- **Request Body:**
```json
{
  "name": "My Custom Product"
}
```
- **Success Response:** `201 Created`
```json
{
  "id": 123,
  "name": "My Custom Product",
  "user_id": "uuid-string",
  "is_global": false,
  "created_at": "2025-10-18T12:00:00Z"
}
```
- **Error Responses:**
  - `400 Bad Request` - Invalid input
  - `401 Unauthorized` - Invalid token
  - `409 Conflict` - Product name already exists (case-insensitive)

#### Update Product
- **Method:** `PATCH`
- **Path:** `/api/products/:id`
- **Description:** Update user's private product
- **Headers:** `Authorization: Bearer {access_token}`
- **Request Body:**
```json
{
  "name": "Updated Product Name"
}
```
- **Success Response:** `200 OK`
```json
{
  "id": 123,
  "name": "Updated Product Name",
  "user_id": "uuid-string",
  "is_global": false,
  "created_at": "2025-10-18T12:00:00Z"
}
```
- **Error Responses:**
  - `400 Bad Request` - Invalid input
  - `401 Unauthorized` - Invalid token
  - `403 Forbidden` - Cannot modify global products
  - `404 Not Found` - Product not found
  - `409 Conflict` - Product name already exists

#### Delete Product
- **Method:** `DELETE`
- **Path:** `/api/products/:id`
- **Description:** Delete user's private product
- **Headers:** `Authorization: Bearer {access_token}`
- **Success Response:** `204 No Content`
- **Error Responses:**
  - `401 Unauthorized` - Invalid token
  - `403 Forbidden` - Cannot delete global products
  - `404 Not Found` - Product not found

### 2.3 Virtual Fridge (User Products)

#### List Fridge Items
- **Method:** `GET`
- **Path:** `/api/fridge`
- **Description:** Get user's virtual fridge contents
- **Headers:** `Authorization: Bearer {access_token}`
- **Query Parameters:**
  - `expired` (enum: `yes`, `no`, `all`, optional, default: `all`) - Filter by expiration status
  - `expiring_soon` (integer, optional) - Days threshold for items expiring soon
  - `search` (string, optional) - Search in product names
  - `sort` (enum: `name`, `quantity`, `expiry_date`, `created_at`, optional, default: `created_at`)
  - `order` (enum: `asc`, `desc`, optional, default: `desc`)
  - `page` (integer, optional, default: 1)
  - `limit` (integer, optional, default: 20, max: 100)
- **Success Response:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "product": {
        "id": 10,
        "name": "Tomato"
      },
      "quantity": 5,
      "unit": {
        "id": 1,
        "name": "piece",
        "abbreviation": "pc"
      },
      "expiry_date": "2025-10-25",
      "created_at": "2025-10-18T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```
- **Error Responses:**
  - `401 Unauthorized` - Invalid token
  - `422 Unprocessable Entity` - Invalid query parameters

#### Get Fridge Item by ID
- **Method:** `GET`
- **Path:** `/api/fridge/:id`
- **Description:** Get single fridge item details
- **Headers:** `Authorization: Bearer {access_token}`
- **Success Response:** `200 OK`
```json
{
  "id": 1,
  "product": {
    "id": 10,
    "name": "Tomato"
  },
  "quantity": 5,
  "unit": {
    "id": 1,
    "name": "piece",
    "abbreviation": "pc"
  },
  "expiry_date": "2025-10-25",
  "created_at": "2025-10-18T12:00:00Z"
}
```
- **Error Responses:**
  - `401 Unauthorized` - Invalid token
  - `404 Not Found` - Fridge item not found

#### Add Item to Fridge
- **Method:** `POST`
- **Path:** `/api/fridge`
- **Description:** Add product to user's virtual fridge
- **Headers:** `Authorization: Bearer {access_token}`
- **Request Body:**
```json
{
  "product_id": 10,
  "quantity": 5,
  "unit_id": 1,
  "expiry_date": "2025-10-25"
}
```
- **Success Response:** `201 Created`
```json
{
  "id": 1,
  "product": {
    "id": 10,
    "name": "Tomato"
  },
  "quantity": 5,
  "unit": {
    "id": 1,
    "name": "piece",
    "abbreviation": "pc"
  },
  "expiry_date": "2025-10-25",
  "created_at": "2025-10-18T12:00:00Z"
}
```
- **Error Responses:**
  - `400 Bad Request` - Invalid input (e.g., quantity < 0)
  - `401 Unauthorized` - Invalid token
  - `404 Not Found` - Product or unit not found

#### Update Fridge Item
- **Method:** `PATCH`
- **Path:** `/api/fridge/:id`
- **Description:** Update quantity, unit, or expiry date of fridge item
- **Headers:** `Authorization: Bearer {access_token}`
- **Request Body:**
```json
{
  "quantity": 3,
  "unit_id": 1,
  "expiry_date": "2025-10-28"
}
```
- **Success Response:** `200 OK`
```json
{
  "id": 1,
  "product": {
    "id": 10,
    "name": "Tomato"
  },
  "quantity": 3,
  "unit": {
    "id": 1,
    "name": "piece",
    "abbreviation": "pc"
  },
  "expiry_date": "2025-10-28",
  "created_at": "2025-10-18T12:00:00Z"
}
```
- **Error Responses:**
  - `400 Bad Request` - Invalid input
  - `401 Unauthorized` - Invalid token
  - `404 Not Found` - Fridge item or unit not found

#### Delete Fridge Item
- **Method:** `DELETE`
- **Path:** `/api/fridge/:id`
- **Description:** Remove item from virtual fridge
- **Headers:** `Authorization: Bearer {access_token}`
- **Success Response:** `204 No Content`
- **Error Responses:**
  - `401 Unauthorized` - Invalid token
  - `404 Not Found` - Fridge item not found

### 2.4 Recipes

#### List Recipes
- **Method:** `GET`
- **Path:** `/api/recipes`
- **Description:** Get user's recipes with filtering and pagination
- **Headers:** `Authorization: Bearer {access_token}`
- **Query Parameters:**
  - `search` (string, optional) - Full-text search in title and instructions
  - `source` (enum: `user`, `api`, `ai`, optional) - Filter by recipe source
  - `difficulty` (enum: `easy`, `medium`, `hard`, optional) - Filter by difficulty
  - `tags` (array of integers, optional) - Filter by tag IDs (comma-separated)
  - `max_cooking_time` (integer, optional) - Maximum cooking time in minutes
  - `sort` (enum: `title`, `cooking_time`, `difficulty`, `created_at`, optional, default: `created_at`)
  - `order` (enum: `asc`, `desc`, optional, default: `desc`)
  - `page` (integer, optional, default: 1)
  - `limit` (integer, optional, default: 20, max: 100)
- **Success Response:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "title": "Tomato Soup",
      "description": "A simple and delicious tomato soup",
      "instructions": "1. Chop tomatoes...",
      "cooking_time": 30,
      "difficulty": "easy",
      "source": "user",
      "tags": [
        {
          "id": 1,
          "name": "vegetarian"
        }
      ],
      "ingredients": [
        {
          "product": {
            "id": 10,
            "name": "Tomato"
          },
          "quantity": 5,
          "unit": {
            "id": 1,
            "name": "piece",
            "abbreviation": "pc"
          }
        }
      ],
      "created_at": "2025-10-18T12:00:00Z",
      "updated_at": "2025-10-18T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 35,
    "total_pages": 2
  }
}
```
- **Error Responses:**
  - `401 Unauthorized` - Invalid token
  - `422 Unprocessable Entity` - Invalid query parameters

#### Get Recipe by ID
- **Method:** `GET`
- **Path:** `/api/recipes/:id`
- **Description:** Get detailed recipe information
- **Headers:** `Authorization: Bearer {access_token}`
- **Success Response:** `200 OK`
```json
{
  "id": 1,
  "title": "Tomato Soup",
  "description": "A simple and delicious tomato soup",
  "instructions": "1. Chop tomatoes...",
  "cooking_time": 30,
  "difficulty": "easy",
  "source": "user",
  "metadata": {},
  "tags": [
    {
      "id": 1,
      "name": "vegetarian"
    }
  ],
  "ingredients": [
    {
      "product": {
        "id": 10,
        "name": "Tomato"
      },
      "quantity": 5,
      "unit": {
        "id": 1,
        "name": "piece",
        "abbreviation": "pc"
      }
    }
  ],
  "created_at": "2025-10-18T12:00:00Z",
  "updated_at": "2025-10-18T12:00:00Z"
}
```
- **Error Responses:**
  - `401 Unauthorized` - Invalid token
  - `404 Not Found` - Recipe not found

#### Create Recipe
- **Method:** `POST`
- **Path:** `/api/recipes`
- **Description:** Create a new recipe
- **Headers:** `Authorization: Bearer {access_token}`
- **Request Body:**
```json
{
  "title": "Tomato Soup",
  "description": "A simple and delicious tomato soup",
  "instructions": "1. Chop tomatoes...",
  "cooking_time": 30,
  "difficulty": "easy",
  "ingredients": [
    {
      "product_id": 10,
      "quantity": 5,
      "unit_id": 1
    }
  ],
  "tag_ids": [1, 2]
}
```
- **Success Response:** `201 Created`
```json
{
  "id": 1,
  "title": "Tomato Soup",
  "description": "A simple and delicious tomato soup",
  "instructions": "1. Chop tomatoes...",
  "cooking_time": 30,
  "difficulty": "easy",
  "source": "user",
  "tags": [
    {
      "id": 1,
      "name": "vegetarian"
    }
  ],
  "ingredients": [
    {
      "product": {
        "id": 10,
        "name": "Tomato"
      },
      "quantity": 5,
      "unit": {
        "id": 1,
        "name": "piece",
        "abbreviation": "pc"
      }
    }
  ],
  "created_at": "2025-10-18T12:00:00Z",
  "updated_at": "2025-10-18T12:00:00Z"
}
```
- **Error Responses:**
  - `400 Bad Request` - Invalid input (missing title, ingredients, or instructions; cooking_time <= 0; quantity <= 0)
  - `401 Unauthorized` - Invalid token
  - `404 Not Found` - Product, unit, or tag not found

#### Update Recipe
- **Method:** `PATCH`
- **Path:** `/api/recipes/:id`
- **Description:** Update existing recipe
- **Headers:** `Authorization: Bearer {access_token}`
- **Request Body:**
```json
{
  "title": "Updated Tomato Soup",
  "description": "An even better tomato soup",
  "cooking_time": 25,
  "difficulty": "medium",
  "ingredients": [
    {
      "product_id": 10,
      "quantity": 6,
      "unit_id": 1
    }
  ],
  "tag_ids": [1, 3]
}
```
- **Success Response:** `200 OK`
```json
{
  "id": 1,
  "title": "Updated Tomato Soup",
  "description": "An even better tomato soup",
  "instructions": "1. Chop tomatoes...",
  "cooking_time": 25,
  "difficulty": "medium",
  "source": "user",
  "tags": [
    {
      "id": 1,
      "name": "vegetarian"
    }
  ],
  "ingredients": [
    {
      "product": {
        "id": 10,
        "name": "Tomato"
      },
      "quantity": 6,
      "unit": {
        "id": 1,
        "name": "piece",
        "abbreviation": "pc"
      }
    }
  ],
  "created_at": "2025-10-18T12:00:00Z",
  "updated_at": "2025-10-18T13:00:00Z"
}
```
- **Error Responses:**
  - `400 Bad Request` - Invalid input
  - `401 Unauthorized` - Invalid token
  - `404 Not Found` - Recipe, product, unit, or tag not found

#### Delete Recipe
- **Method:** `DELETE`
- **Path:** `/api/recipes/:id`
- **Description:** Delete a recipe
- **Headers:** `Authorization: Bearer {access_token}`
- **Success Response:** `204 No Content`
- **Error Responses:**
  - `401 Unauthorized` - Invalid token
  - `404 Not Found` - Recipe not found

### 2.5 Recipe Discovery & AI Integration

#### Search Recipes by Fridge Contents
- **Method:** `POST`
- **Path:** `/api/recipes/search-by-fridge`
- **Description:** Find recipes matching user's fridge contents using hierarchical search (user recipes → external API → AI generation)
- **Headers:** `Authorization: Bearer {access_token}`
- **Request Body:**
```json
{
  "use_all_fridge_items": true,
  "custom_product_ids": [10, 15, 20],
  "max_results": 10,
  "preferences": {
    "max_cooking_time": 60,
    "difficulty": "easy",
    "dietary_restrictions": ["vegetarian"]
  }
}
```
- **Success Response:** `200 OK`
```json
{
  "results": [
    {
      "recipe": {
        "id": 1,
        "title": "Tomato Soup",
        "description": "A simple and delicious tomato soup",
        "instructions": "1. Chop tomatoes...",
        "cooking_time": 30,
        "difficulty": "easy",
        "source": "user",
        "ingredients": [
          {
            "product": {
              "id": 10,
              "name": "Tomato"
            },
            "quantity": 5,
            "unit": {
              "id": 1,
              "name": "piece",
              "abbreviation": "pc"
            }
          }
        ]
      },
      "match_score": 0.95,
      "available_ingredients": [
        {
          "product_id": 10,
          "product_name": "Tomato",
          "required_quantity": 5,
          "available_quantity": 8,
          "unit": "pc"
        }
      ],
      "missing_ingredients": []
    }
  ],
  "search_metadata": {
    "source": "user_recipes",
    "total_results": 3,
    "search_duration_ms": 45
  }
}
```
- **Error Responses:**
  - `401 Unauthorized` - Invalid token
  - `422 Unprocessable Entity` - Invalid input
  - `500 Internal Server Error` - External API or AI service error

#### Generate Recipe with AI
- **Method:** `POST`
- **Path:** `/api/recipes/generate`
- **Description:** Generate a new recipe using AI based on available ingredients
- **Headers:** `Authorization: Bearer {access_token}`
- **Request Body:**
```json
{
  "product_ids": [10, 15, 20],
  "preferences": {
    "cuisine": "Italian",
    "max_cooking_time": 45,
    "difficulty": "easy",
    "dietary_restrictions": ["vegetarian"]
  },
  "save_to_recipes": true
}
```
- **Success Response:** `201 Created`
```json
{
  "recipe": {
    "id": 25,
    "title": "AI-Generated Tomato Pasta",
    "description": "A quick Italian-inspired pasta dish",
    "instructions": "1. Boil water for pasta...",
    "cooking_time": 25,
    "difficulty": "easy",
    "source": "ai",
    "metadata": {
      "ai_model": "gpt-4",
      "generation_timestamp": "2025-10-18T12:00:00Z",
      "prompt_hash": "abc123"
    },
    "ingredients": [
      {
        "product": {
          "id": 10,
          "name": "Tomato"
        },
        "quantity": 4,
        "unit": {
          "id": 1,
          "name": "piece",
          "abbreviation": "pc"
        }
      }
    ],
    "created_at": "2025-10-18T12:00:00Z"
  }
}
```
- **Error Responses:**
  - `400 Bad Request` - Invalid input
  - `401 Unauthorized` - Invalid token
  - `500 Internal Server Error` - AI service error
  - `503 Service Unavailable` - AI service temporarily unavailable

### 2.6 Shopping List

#### Generate Shopping List
- **Method:** `POST`
- **Path:** `/api/shopping-list/generate`
- **Description:** Generate shopping list for missing ingredients of a recipe
- **Headers:** `Authorization: Bearer {access_token}`
- **Request Body:**
```json
{
  "recipe_id": 1
}
```
- **Success Response:** `200 OK`
```json
{
  "recipe": {
    "id": 1,
    "title": "Tomato Soup"
  },
  "missing_ingredients": [
    {
      "product": {
        "id": 15,
        "name": "Onion"
      },
      "required_quantity": 2,
      "available_quantity": 0,
      "missing_quantity": 2,
      "unit": {
        "id": 1,
        "name": "piece",
        "abbreviation": "pc"
      }
    },
    {
      "product": {
        "id": 10,
        "name": "Tomato"
      },
      "required_quantity": 5,
      "available_quantity": 3,
      "missing_quantity": 2,
      "unit": {
        "id": 1,
        "name": "piece",
        "abbreviation": "pc"
      }
    }
  ],
  "total_items": 2
}
```
- **Error Responses:**
  - `400 Bad Request` - Invalid recipe ID
  - `401 Unauthorized` - Invalid token
  - `404 Not Found` - Recipe not found

### 2.7 Cooking History

#### List Cooking History
- **Method:** `GET`
- **Path:** `/api/cooking-history`
- **Description:** Get user's cooking history with pagination
- **Headers:** `Authorization: Bearer {access_token}`
- **Query Parameters:**
  - `recipe_id` (integer, optional) - Filter by specific recipe
  - `from_date` (date, optional) - Filter from date
  - `to_date` (date, optional) - Filter to date
  - `page` (integer, optional, default: 1)
  - `limit` (integer, optional, default: 20, max: 100)
- **Success Response:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "recipe": {
        "id": 1,
        "title": "Tomato Soup"
      },
      "cooked_at": "2025-10-18T18:00:00Z",
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
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "total_pages": 1
  }
}
```
- **Error Responses:**
  - `401 Unauthorized` - Invalid token
  - `422 Unprocessable Entity` - Invalid query parameters

#### Create Cooking History Entry
- **Method:** `POST`
- **Path:** `/api/cooking-history`
- **Description:** Record that a recipe was cooked and update fridge inventory
- **Headers:** `Authorization: Bearer {access_token}`
- **Request Body:**
```json
{
  "recipe_id": 1
}
```
- **Success Response:** `201 Created`
```json
{
  "id": 1,
  "recipe": {
    "id": 1,
    "title": "Tomato Soup"
  },
  "cooked_at": "2025-10-18T18:00:00Z",
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
  },
  "updated_fridge_items": [
    {
      "product_id": 10,
      "old_quantity": 8,
      "new_quantity": 3,
      "unit": "pc"
    }
  ]
}
```
- **Error Responses:**
  - `400 Bad Request` - Insufficient ingredients in fridge
  - `401 Unauthorized` - Invalid token
  - `404 Not Found` - Recipe not found

### 2.8 Units (Dictionary)

#### List Units
- **Method:** `GET`
- **Path:** `/api/units`
- **Description:** Get list of available measurement units
- **Headers:** `Authorization: Bearer {access_token}`
- **Success Response:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "name": "gram",
      "abbreviation": "g",
      "created_at": "2025-10-18T12:00:00Z"
    },
    {
      "id": 2,
      "name": "piece",
      "abbreviation": "pc",
      "created_at": "2025-10-18T12:00:00Z"
    }
  ]
}
```
- **Error Responses:**
  - `401 Unauthorized` - Invalid token

### 2.9 Tags (Dictionary)

#### List Tags
- **Method:** `GET`
- **Path:** `/api/tags`
- **Description:** Get list of available recipe tags
- **Headers:** `Authorization: Bearer {access_token}`
- **Query Parameters:**
  - `search` (string, optional) - Search in tag names
- **Success Response:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "name": "vegetarian",
      "created_at": "2025-10-18T12:00:00Z"
    },
    {
      "id": 2,
      "name": "quick meal",
      "created_at": "2025-10-18T12:00:00Z"
    }
  ]
}
```
- **Error Responses:**
  - `401 Unauthorized` - Invalid token

#### Create Tag
- **Method:** `POST`
- **Path:** `/api/tags`
- **Description:** Create a new recipe tag
- **Headers:** `Authorization: Bearer {access_token}`
- **Request Body:**
```json
{
  "name": "gluten-free"
}
```
- **Success Response:** `201 Created`
```json
{
  "id": 10,
  "name": "gluten-free",
  "created_at": "2025-10-18T12:00:00Z"
}
```
- **Error Responses:**
  - `400 Bad Request` - Invalid input
  - `401 Unauthorized` - Invalid token
  - `409 Conflict` - Tag name already exists

## 3. Authentication & Authorization

### Authentication Method
The API uses **Supabase Auth** with JWT (JSON Web Tokens) for authentication:

- **Token Type:** Bearer tokens
- **Token Location:** `Authorization` header: `Authorization: Bearer {access_token}`
- **Token Expiration:** Access tokens expire after 1 hour; refresh tokens are long-lived
- **Refresh Flow:** Clients should use the refresh token to obtain new access tokens when expired

### Authorization Strategy
Authorization is enforced at multiple levels:

1. **Row-Level Security (RLS)** in PostgreSQL ensures data isolation at the database level
2. **API-level checks** validate user permissions before processing requests
3. **Resource ownership** is verified through the `user_id` field on protected resources

### Protected Endpoints
All endpoints require authentication except:
- `/api/auth/register`
- `/api/auth/login`

### Authorization Rules
- Users can only access their own:
  - Fridge items (`user_products`)
  - Recipes (`recipes`)
  - Private products (`products` where `user_id` matches)
  - Cooking history (`cooking_history`)
- Users can read all:
  - Global products (`products` where `user_id IS NULL`)
  - Units (`units`)
  - Tags (`tags`)

## 4. Validation & Business Logic

### 4.1 Input Validation

#### User Registration & Profile
- `email`: Valid email format, unique
- `password`: Minimum 8 characters, at least one uppercase, one lowercase, one number
- `username`: Minimum 3 characters, unique, alphanumeric with underscores
- `full_name`: Optional, max 255 characters

#### Products
- `name`: Required, non-empty string, case-insensitive uniqueness check using `LOWER(name)`

#### User Products (Fridge)
- `product_id`: Must reference existing product accessible to user
- `quantity`: Required, decimal >= 0
- `unit_id`: Must reference existing unit
- `expiry_date`: Optional, valid date, cannot be in the past on creation

#### Recipes
- `title`: Required, non-empty string
- `instructions`: Required, non-empty string
- `cooking_time`: Optional, integer > 0 if provided
- `difficulty`: Optional, must be one of: `easy`, `medium`, `hard`
- `ingredients`: Array with at least one ingredient
  - `product_id`: Must reference existing product
  - `quantity`: Required, decimal > 0
  - `unit_id`: Must reference existing unit
- `tag_ids`: Optional array of existing tag IDs

#### Tags
- `name`: Required, non-empty string, unique

### 4.2 Business Logic

#### Recipe Search Hierarchy (US-004)
The `/api/recipes/search-by-fridge` endpoint implements a three-tier search strategy:

1. **Tier 1: User Recipes**
   - Search user's own recipes for matches with available ingredients
   - Calculate match score based on ingredient availability
   - Return results if match score > threshold (e.g., 70%)

2. **Tier 2: External API**
   - If no sufficient matches found in user recipes, query external recipe API
   - Transform API response to internal recipe format
   - Map external ingredients to internal products
   - Save successful recipes with `source: 'api'`

3. **Tier 3: AI Generation**
   - If external API returns no results or fails, use AI generation
   - Send fridge contents and preferences to OpenRouter API
   - Parse AI response and validate recipe structure
   - Save successful recipes with `source: 'ai'`
   - Include generation metadata for auditing

#### Shopping List Generation (US-005)
The `/api/shopping-list/generate` endpoint:
1. Retrieves recipe ingredients and required quantities
2. Queries user's fridge for available quantities
3. Calculates missing quantities by comparing required vs. available
4. Handles unit conversions if necessary
5. Returns detailed list with product info and missing amounts

#### Cooking History & Fridge Update
The `/api/cooking-history` POST endpoint:
1. Captures current fridge state (before cooking)
2. Validates that user has sufficient ingredients
3. Deducts ingredient quantities from fridge items using a database transaction
4. Captures new fridge state (after cooking)
5. Records history entry with both states for auditing
6. Uses PostgreSQL function to ensure atomicity

#### Product Name Uniqueness
- Product names are validated for uniqueness using case-insensitive comparison
- Uses the `products_lower_name_idx` index for performance
- Prevents duplicate products like "Tomato" and "tomato"

#### Expired Products Handling
- Fridge listing endpoint supports filtering by expiration status
- `expiring_soon` parameter allows proactive notification
- Expired products are not automatically removed but can be filtered in queries

### 4.3 Error Handling

All API errors follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context if applicable"
    }
  }
}
```

#### Common Error Codes
- `UNAUTHORIZED`: Authentication required or token invalid
- `FORBIDDEN`: User lacks permission for the resource
- `NOT_FOUND`: Resource does not exist
- `VALIDATION_ERROR`: Input validation failed
- `CONFLICT`: Resource conflict (e.g., duplicate name)
- `INSUFFICIENT_INGREDIENTS`: Not enough ingredients in fridge for recipe
- `EXTERNAL_API_ERROR`: External recipe API failure
- `AI_SERVICE_ERROR`: AI generation service failure

### 4.4 Rate Limiting

To ensure fair usage and system stability:

- **Authentication endpoints**: 10 requests per minute per IP
- **Recipe generation (AI)**: 5 requests per minute per user
- **General endpoints**: 100 requests per minute per user
- **Rate limit headers** included in responses:
  - `X-RateLimit-Limit`: Total allowed requests
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

### 4.5 Performance Optimizations

- **Pagination**: All list endpoints support pagination to limit response size
- **Selective loading**: Use query parameters to request only needed data
- **Database indexes**: Leverage full-text search indexes for fast product/recipe queries
- **Caching strategy**:
  - Dictionary data (units, tags) cached for 1 hour
  - User fridge data cached for 5 minutes
  - Recipe data cached per user for 10 minutes
- **Connection pooling**: Use Supabase connection pooling for database efficiency

## 5. API Versioning

- **Current Version**: v1
- **Version Prefix**: All endpoints are prefixed with `/api/` (implicit v1)
- **Future Versioning**: When breaking changes are needed, use `/api/v2/` prefix
- **Deprecation Policy**: Previous versions supported for minimum 6 months with deprecation warnings

## 6. Response Headers

Standard headers included in all responses:
- `Content-Type: application/json`
- `X-Request-ID`: Unique identifier for request tracing
- `X-Response-Time`: Response time in milliseconds

## 7. CORS Configuration

- **Allowed Origins**: Configured per environment (development: `http://localhost:*`, production: specific domain)
- **Allowed Methods**: `GET`, `POST`, `PATCH`, `DELETE`, `OPTIONS`
- **Allowed Headers**: `Authorization`, `Content-Type`
- **Credentials**: Supported for authenticated requests

