# Foodnager

## Project Description

Foodnager is a mobile and web application that helps users search for, store, and manage culinary recipes. The application leverages AI to generate or modify recipes based on the ingredients available in a user's virtual pantry. It features user registration and authentication, comprehensive virtual fridge management, and a hierarchical recipe search that prioritizes user-created recipes, followed by API-sourced recipes, with AI-generated recipes as a fallback. Additionally, Foodnager can generate a shopping list of missing ingredients for any selected recipe.

## Tech Stack

- **Frontend:** Astro 5, React 19, Typescript 5, Tailwind 4, Shadcn/ui
- **Backend & Database:** Supabase
- **External Recipe API:** Spoonacular (optional, Tier 2)
- **AI Communication:** OpenRouter.ai with Perplexity Sonar (web search enabled)
- **Testing:** Vitest, React Testing Library, Playwright, MSW
- **CI/CD & Hosting:** GitHub Actions, DigitalOcean

### Testing Strategy

Foodnager implements comprehensive testing across multiple layers:

#### Unit Tests (Vitest)

- **Framework:** Vitest - fast, Vite-native testing framework
- **Coverage:** Utilities, validation schemas, mappers, and custom error classes
- **Target Coverage:** Minimum 80% for utils, mappers, and validators
- **Scope:** Business logic functions, data transformations, and error handling

#### Integration Tests (Vitest + MSW)

- **Framework:** Vitest with MSW (Mock Service Worker) for HTTP mocking
- **Coverage:** API endpoints, services layer, and external API integrations
- **Target Coverage:** Minimum 70% for services and API endpoints
- **Scope:** Authentication flows, database operations, hierarchical recipe search, and atomic transactions

#### Component Tests (Vitest + React Testing Library)

- **Framework:** Vitest with React Testing Library for component testing
- **Coverage:** React components with focus on user interactions and accessibility
- **Target Coverage:** Minimum 60% for React components
- **Scope:** Form validation, state management, conditional rendering, and accessibility compliance

#### E2E Tests (Playwright)

- **Framework:** Playwright for cross-browser end-to-end testing
- **Coverage:** Complete user journeys across Chrome, Firefox, and Safari
- **Scope:** User registration, fridge management, hierarchical recipe search, cooking workflows, and shopping list generation
- **Mobile Testing:** Responsive design validation across different viewports

#### Additional Testing Tools

- **Mocking:** MSW for API mocking, custom Supabase client mocks
- **Performance:** Lighthouse CI for automated performance audits
- **Load Testing:** k6 for concurrent user simulation
- **Security:** OWASP ZAP for automated security scanning
- **Accessibility:** axe-core integration for WCAG 2.1 Level AA compliance

#### Test Execution

- **CI/CD Integration:** Automated test execution on every push and PR via GitHub Actions
- **Test Environments:** Local development, CI staging, and production staging
- **Quality Gates:** Tests must pass before merge to main branch
- **Coverage Reporting:** Codecov integration for coverage tracking

### AI Model Configuration

Foodnager uses **Perplexity Sonar Pro with online web search** (`perplexity/sonar-pro`) as the default AI model. This model has real-time internet access and provides:

- ✅ Real, verified recipe sources from culinary websites
- ✅ Links to original recipes from blogs like KwestiaSmaku, AniaGotuje, BBC Good Food
- ✅ Authentic dishes based on actual online recipes (no hallucinated content)

Alternative models (without web search) can be configured via `OPENROUTER_MODEL` environment variable.

## Getting Started Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/foodnager.git
   ```
2. **Navigate into the project directory:**
   ```bash
   cd foodnager
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Configure environment variables:**

   Create a `.env` file in the root directory:

   ```bash
   # Supabase Configuration (Required)
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-supabase-anon-key

   # External Recipe API - Spoonacular (Optional, Tier 2)
   EXTERNAL_RECIPE_API_URL=https://api.spoonacular.com
   EXTERNAL_RECIPE_API_KEY=your-spoonacular-api-key

   # OpenRouter AI Configuration (Required, Tier 3)
   OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
   OPENROUTER_MODEL=perplexity/sonar-pro

   # Timeouts
   TIER2_TIMEOUT_MS=10000
   TIER3_TIMEOUT_MS=45000
   ```

   Get your credentials:
   - `SUPABASE_URL` and `SUPABASE_KEY` - from your [Supabase project](https://supabase.com)
   - `EXTERNAL_RECIPE_API_KEY` - (optional) from [Spoonacular](https://spoonacular.com/food-api)
   - `OPENROUTER_API_KEY` - from [OpenRouter Keys](https://openrouter.ai/keys)

   📖 See [SETUP.md](SETUP.md) for detailed configuration guide

5. **Run the development server:**
   ```bash
   npm run dev
   ```
6. **Open your browser:**  
   Visit `http://localhost:4321` (or the port specified) to view the application.

## Available Scripts

The following scripts are defined in the project's `package.json`:

### Development

- **`npm run dev`**: Starts the Astro development server.
- **`npm run build`**: Builds the project for production.
- **`npm run preview`**: Previews the production build.
- **`npm run astro`**: Runs Astro CLI commands.

### Code Quality

- **`npm run lint`**: Runs ESLint to analyze the code for potential quality issues.
- **`npm run lint:fix`**: Runs ESLint and automatically fixes problems where possible.
- **`npm run format`**: Formats the codebase using Prettier.

### Testing

#### Vitest (Unit & Component Tests)

- **`npm run test`**: Runs unit and integration tests with Vitest in watch mode.
- **`npm run test:ui`**: Runs tests with Vitest UI interface for interactive testing.
- **`npm run test:run`**: Runs all tests once (CI mode) without watch.
- **`npm run test:coverage`**: Runs tests with code coverage report.
- **`npm run test:watch`**: Runs tests in watch mode with file watching.

#### Playwright (E2E Tests)

- **`npm run test:e2e`**: Runs end-to-end tests with Playwright.
- **`npm run test:e2e:ui`**: Runs E2E tests with Playwright UI mode.
- **`npm run test:e2e:debug`**: Runs E2E tests in debug mode for step-by-step execution.
- **`npm run test:e2e:report`**: Shows Playwright test report from previous runs.
- **`npm run test:e2e:codegen`**: Interactive test code generation tool.

## Project Scope

Foodnager focuses on solving the user problem of efficiently finding recipes that match available ingredients. Key functionalities include:

- **User registration and login:** Secure account creation and authentication.
- **Virtual Fridge Management:** Add, edit, view, and delete products from a virtual pantry.
- **Recipe Management:** Create, view, and delete recipes with required (name, ingredients with quantities) and optional (cooking time, difficulty) fields.
- **Hierarchical Recipe Search (3 Tiers):**
  - **Tier 1:** Search through user-created recipes (always active)
  - **Tier 2:** Retrieve recipes via Spoonacular API (optional, requires API key)
  - **Tier 3:** Generate recipes with AI using OpenRouter (fallback)
- **Shopping List Generation:** Compare available ingredients against a recipe’s requirements and generate a list of missing items for easy shopping.

## Project Status

This project is currently in the MVP (Minimum Viable Product) phase. Certain advanced features, such as external recipe import via URLs, extensive multimedia support, and social sharing, are not included in this initial release.

## License

This project is licensed under the [MIT License](LICENSE).
