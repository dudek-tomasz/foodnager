# Foodnager

## Project Description
Foodnager is a mobile and web application that helps users search for, store, and manage culinary recipes. The application leverages AI to generate or modify recipes based on the ingredients available in a user's virtual pantry. It features user registration and authentication, comprehensive virtual fridge management, and a hierarchical recipe search that prioritizes user-created recipes, followed by API-sourced recipes, with AI-generated recipes as a fallback. Additionally, Foodnager can generate a shopping list of missing ingredients for any selected recipe.

## Tech Stack
- **Frontend:** Astro 5, React 19, Typescript 5, Tailwind 4, Shadcn/ui
- **Backend & Database:** Supabase
- **AI Communication:** OpenRouter.ai with Perplexity Sonar (web search enabled)
- **CI/CD & Hosting:** GitHub Actions, DigitalOcean

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
   # Supabase Configuration
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-supabase-anon-key
   
   # OpenRouter AI Configuration
   OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
   OPENROUTER_MODEL=perplexity/sonar-pro
   
   # Timeout (increased for web search)
   TIER3_TIMEOUT_MS=45000
   ```
   
   Get your credentials:
   - `SUPABASE_URL` and `SUPABASE_KEY` - from your [Supabase project](https://supabase.com)
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
- **`npm run dev`**: Starts the Astro development server.
- **`npm run build`**: Builds the project for production.
- **`npm run preview`**: Previews the production build.
- **`npm run astro`**: Runs Astro CLI commands.
- **`npm run lint`**: Runs ESLint to analyze the code for potential quality issues.
- **`npm run lint:fix`**: Runs ESLint and automatically fixes problems where possible.
- **`npm run format`**: Formats the codebase using Prettier.

## Project Scope
Foodnager focuses on solving the user problem of efficiently finding recipes that match available ingredients. Key functionalities include:
- **User registration and login:** Secure account creation and authentication.
- **Virtual Fridge Management:** Add, edit, view, and delete products from a virtual pantry.
- **Recipe Management:** Create, view, and delete recipes with required (name, ingredients with quantities) and optional (cooking time, difficulty) fields.
- **Hierarchical Recipe Search:** 
  - First, search through user-created recipes.
  - Then, retrieve recipes via an external API.
  - Finally, use AI to generate a recipe if no suitable match is found.
- **Shopping List Generation:** Compare available ingredients against a recipe’s requirements and generate a list of missing items for easy shopping.

## Project Status
This project is currently in the MVP (Minimum Viable Product) phase. Certain advanced features, such as external recipe import via URLs, extensive multimedia support, and social sharing, are not included in this initial release.

## License
This project is licensed under the [MIT License](LICENSE).
