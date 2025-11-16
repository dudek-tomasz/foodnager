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

### 2. OpenRouter Setup

1. Go to [OpenRouter](https://openrouter.ai)
2. Sign up or log in
3. Navigate to [Keys](https://openrouter.ai/keys)
4. Create a new API key
5. Add credits to your account at [Credits](https://openrouter.ai/credits)

**Pricing Note:** Perplexity models with web search are more expensive than standard models:
- `perplexity/sonar-pro`: ~$3 per 1M tokens (with web search)
- `perplexity/sonar`: ~$1 per 1M tokens (with web search, cheaper)
- `anthropic/claude-3-haiku`: ~$0.25 per 1M tokens (no web search)

## Verification

After configuration, test your setup:

```bash
npm run dev
```

Visit the app and try generating a recipe. Check the console for:
- ✅ Successful API connections
- ✅ Real recipe sources with valid URLs (if using Perplexity)
- ⚠️ Any configuration errors

## Troubleshooting

### "OpenRouter API key not configured"
- Check that `OPENROUTER_API_KEY` is set in `.env`
- Verify the key starts with `sk-or-v1-`

### "Insufficient credits"
- Add credits at [OpenRouter Credits](https://openrouter.ai/credits)

### "Timeout" errors
- Increase `TIER3_TIMEOUT_MS` (try 60000 for 60 seconds)
- Web search models take longer to respond

### Fake/broken recipe links
- Verify you're using a Perplexity model with `-online` suffix
- Check `OPENROUTER_MODEL` in `.env`
- Standard models (Claude, GPT) don't have web access

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

