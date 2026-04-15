const KV_KEY = 'sms_templates'

export async function onRequestGet({ env }) {
  try {
    const data = await env.SMS_TEMPLATES.get(KV_KEY, { type: 'json' })
    if (!data) {
      return new Response(JSON.stringify({
        new_signup: '',
        first_purchase: '',
        post_purchase: '',
        post_purchase_delay: 3,
      }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return new Response(JSON.stringify(data), {
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
    const templates = {
      new_signup: body.new_signup ?? '',
      first_purchase: body.first_purchase ?? '',
      post_purchase: body.post_purchase ?? '',
      post_purchase_delay: body.post_purchase_delay ?? 3,
    }
    await env.SMS_TEMPLATES.put(KV_KEY, JSON.stringify(templates))
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
