import Anthropic from '@anthropic-ai/sdk'
import type { Category, PatternIndex } from '@/types'

const client = new Anthropic({
  apiKey: import.meta.env.VITE_CLAUDE_API_KEY as string,
  dangerouslyAllowBrowser: true, // Required for client-side usage
})

interface ClaudeCategoryResult {
  narration: string
  pattern: string
  brand: string | null
  entity_type: string | null
  purpose: string | null
  category_name: string | null
  confidence: number
}

/**
 * Sends a batch of unknown narration strings to Claude and gets back
 * structured PatternIndex entries. Called at most once per import session.
 *
 * Returns an array of PatternIndex entries ready to be upserted into Supabase.
 * category_id is populated by matching category_name against the provided categories array.
 */
export async function batchCategorize(
  narrations: string[],
  categories: Category[],
): Promise<Omit<PatternIndex, 'id' | 'updated_at' | 'created_by'>[]> {
  if (narrations.length === 0) return []

  const categoryList = categories
    .filter((c) => !c.parent_id) // top-level only for Claude
    .map((c) => c.name)
    .join(', ')

  const prompt = `You are an Indian expense categorization assistant. Analyze the following raw bank/UPI transaction narration strings and return structured JSON.

Available top-level categories: ${categoryList}

For each narration, return:
- "narration": the original string
- "pattern": a regex pattern (case-insensitive) that would match this and similar transactions (e.g. "ZOMATO|zomato\\s*\\d*" for Zomato orders)
- "brand": brand/company name if identifiable, else null
- "entity_type": one of [individual, food_delivery, ecommerce, grocery, pharmacy, fuel, streaming, telecom, bank, wallet, government, restaurant, cafe, subscription, transport, utility] or null
- "purpose": one of [food, shopping, transport, entertainment, health, education, utilities, travel, finance, income, transfer] or null
- "category_name": best matching category from the list above, or null
- "confidence": 0.0 to 1.0 how confident you are in this categorization

Transaction narrations to categorize:
${narrations.map((n, i) => `${i + 1}. ${n}`).join('\n')}

Respond ONLY with a valid JSON array of objects, no markdown, no explanation.`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  let results: ClaudeCategoryResult[]
  try {
    results = JSON.parse(text) as ClaudeCategoryResult[]
  } catch {
    console.error('Claude returned invalid JSON:', text)
    return []
  }

  return results.map((r) => {
    const matchedCategory = categories.find(
      (c) => c.name.toLowerCase() === (r.category_name ?? '').toLowerCase(),
    )

    return {
      pattern: r.pattern,
      brand: r.brand,
      entity_type: r.entity_type,
      purpose: r.purpose,
      category_id: matchedCategory?.id ?? null,
      confidence: r.confidence,
      source: 'claude' as const,
    }
  })
}
