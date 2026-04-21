const TEMPLATE_KEYS = [
  'new_signup',
  'first_purchase',
  'post_purchase',
  'order_fulfilled',
  'order_cancelled',
  'abandoned_cart',
  'refund_created',
]

export async function onRequestGet({ env }) {
  try {
    const entries = await Promise.all(
      TEMPLATE_KEYS.map(async key => {
        const value = await env.SMS_TEMPLATES.get(key)
        return [key, value ?? '']
      })
    )
    return new Response(JSON.stringify(Object.fromEntries(entries)), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to read templates' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json()
    await Promise.all(
      TEMPLATE_KEYS.map(key => {
        const value = (body[key] ?? '').trim()
        if (value === '') return Promise.resolve()
        return env.SMS_TEMPLATES.put(key, value)
      })
    )
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to save templates' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
