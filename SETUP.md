# Foodnager Setup Guide

## Environment Variables Configuration

### Required Variables

Create a `.env` file in the root directory with the following configuration:

```bash
# ===================================
# Supabase Configuration (Required)
# ===================================
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# ===================================
# OpenRouter AI Configuration (Required)
# ===================================
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here

# ===================================
# External Recipe API - Spoonacular (Optional, Tier 2)
# ===================================
EXTERNAL_RECIPE_API_URL=https://api.spoonacular.com
EXTERNAL_RECIPE_API_KEY=your-spoonacular-api-key
```

### Recommended AI Model Configuration

```bash
# Perplexity with web search (default - recommended for real recipe sources)
OPENROUTER_MODEL=perplexity/sonar-pro

# Timeout increased for web search
TIER3_TIMEOUT_MS=45000
```

### Alternative Models

If you prefer models without web search (cheaper but may generate fake links):

```bash
# Fast and economical
OPENROUTER_MODEL=anthropic/claude-3-haiku

# Balanced performance
OPENROUTER_MODEL=anthropic/claude-3-sonnet

# Most advanced
OPENROUTER_MODEL=anthropic/claude-3-opus
```

⚠️ **Warning:** Models without `-online` suffix cannot search the web and will hallucinate/make up recipe source URLs.

### Optional Configuration

```bash
# Model Parameters (optional - defaults are good)
OPENROUTER_TEMPERATURE=0.7
OPENROUTER_MAX_TOKENS=2000
OPENROUTER_TOP_P=1.0
OPENROUTER_FREQUENCY_PENALTY=0
OPENROUTER_PRESENCE_PENALTY=0

# Timeouts (optional)
TIER1_TIMEOUT_MS=5000
TIER2_TIMEOUT_MS=15000
TIER3_TIMEOUT_MS=45000

# Recipe Matching (optional)
RECIPE_MATCH_THRESHOLD=0.7
```

## Getting API Keys

### 1. Supabase Setup

1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Navigate to **Settings** → **API**
4. Copy your **Project URL** and **anon/public key**
5. Set up your database using migrations in `supabase/migrations/`

### 2. OpenRouter Setup (Required - Tier 3 AI Generation)

1. Go to [OpenRouter](https://openrouter.ai)
2. Sign up or log in
3. Navigate to [Keys](https://openrouter.ai/keys)
4. Create a new API key
5. Add credits to your account at [Credits](https://openrouter.ai/credits)

**Pricing Note:** Perplexity models with web search are more expensive than standard models:
- `perplexity/sonar-pro`: ~$3 per 1M tokens (with web search)
- `perplexity/sonar`: ~$1 per 1M tokens (with web search, cheaper)
- `anthropic/claude-3-haiku`: ~$0.25 per 1M tokens (no web search)

### 3. Spoonacular Setup (Optional - Tier 2 External API)

**Note:** Spoonacular is optional. If not configured, the app will skip Tier 2 and fall back directly from user recipes (Tier 1) to AI generation (Tier 3).

1. Go to [Spoonacular Food API](https://spoonacular.com/food-api)
2. Sign up and create an account
3. Navigate to [Dashboard](https://spoonacular.com/food-api/console#Dashboard)
4. Copy your API key
5. Add to `.env` as `EXTERNAL_RECIPE_API_KEY`

**Pricing:**
- **Free Plan:** 150 requests/day (perfect for testing & MVP)
- **Basic:** $19.99/month (500 requests/day)
- **Mega:** $49.99/month (5000 requests/day)
- **Ultra:** $149.99/month (50000 requests/day)

**Why use Spoonacular?**
- Rich recipe database with verified ingredients
- Detailed nutritional information
- Dietary and cuisine filtering
- High-quality recipe instructions
- Reduces AI generation costs (Tier 3 is more expensive)

📖 For detailed Spoonacular configuration, see [Spoonacular API Configuration](.ai/spoonacular-api-configuration.md)

## Recipe Discovery Hierarchy

Foodnager uses a 3-tier hierarchical search system:

### Tier 1: User Recipes (Always Active)
- Searches your own saved recipes first
- Fastest and free
- Best match for your cooking style

### Tier 2: External API - Spoonacular (Optional)
- Searches Spoonacular recipe database
- Activated when Tier 1 doesn't find good matches (score < 0.7)
- Requires `EXTERNAL_RECIPE_API_KEY`
- **If not configured:** System skips to Tier 3

### Tier 3: AI Generation (Required)
- Generates custom recipes using AI
- Activated when Tier 2 fails or is not configured
- Requires `OPENROUTER_API_KEY`
- Most flexible but most expensive

**Cost Optimization Strategy:**
- Configure Spoonacular (Tier 2) to reduce AI costs
- Most searches will end at Tier 1 or 2
- AI (Tier 3) is fallback for unique ingredient combinations

## Verification

After configuration, test your setup:

```bash
npm run dev
```

Visit the app and try generating a recipe. Check the console for:
- ✅ Successful API connections
- ✅ Real recipe sources with valid URLs (if using Perplexity)
- ✅ Spoonacular API responses (if configured)
- ⚠️ Any configuration errors

## Troubleshooting

### OpenRouter Issues

**"OpenRouter API key not configured"**
- Check that `OPENROUTER_API_KEY` is set in `.env`
- Verify the key starts with `sk-or-v1-`

**"Insufficient credits"**
- Add credits at [OpenRouter Credits](https://openrouter.ai/credits)

**"Timeout" errors**
- Increase `TIER3_TIMEOUT_MS` (try 60000 for 60 seconds)
- Web search models take longer to respond

**Fake/broken recipe links**
- Verify you're using a Perplexity model with `-online` suffix
- Check `OPENROUTER_MODEL` in `.env`
- Standard models (Claude, GPT) don't have web access

### Spoonacular Issues

**"Spoonacular API key not configured" (warning in console)**
- This is normal if you haven't set up Spoonacular
- System will skip Tier 2 and go directly to AI generation
- To enable: Add `EXTERNAL_RECIPE_API_KEY` to `.env`

**"External API returned 402" (payment required)**
- You've exceeded your daily request limit
- Check usage at [Spoonacular Dashboard](https://spoonacular.com/food-api/console#Dashboard)
- Wait for daily reset or upgrade plan

**"External API request timed out"**
- Increase `TIER2_TIMEOUT_MS` in `.env`
- Default is 10000ms (10 seconds)
- Try 15000ms (15 seconds)

**No recipes from Spoonacular**
- Spoonacular may not have recipes for exotic ingredient combinations
- System will automatically fall back to AI generation (Tier 3)
- Check that ingredient names are in English

## Security Best Practices

1. ✅ **Never commit `.env` to Git**
2. ✅ Keep API keys secure
3. ✅ Use environment variables in production (DigitalOcean App Platform)
4. ✅ Rotate API keys regularly
5. ❌ Never hard-code credentials in source code

## Support

For more information:
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Perplexity Models](https://openrouter.ai/perplexity)
- [Spoonacular API Documentation](https://spoonacular.com/food-api/docs)
- [Spoonacular API Console](https://spoonacular.com/food-api/console)

## Additional Resources

- [Spoonacular API Configuration Guide](.ai/spoonacular-api-configuration.md) - Detailed Spoonacular setup
- [Recipe Discovery Implementation Plan](.ai/implementation-plans/04-recipe-discovery-endpoints-plan.md) - Technical architecture

