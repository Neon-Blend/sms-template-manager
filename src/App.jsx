import React, { useState, useRef, useEffect } from 'react'

const TEMPLATES_CONFIG = [
  {
    key: 'new_signup',
    title: 'New Signup',
    subtitle: 'Sends immediately when a customer creates an account',
    tags: ['{{first_name}}', '{{shop_name}}'],
  },
  {
    key: 'first_purchase',
    title: 'First Purchase',
    subtitle: 'Sends immediately on a customer\'s first order',
    tags: ['{{first_name}}', '{{order_number}}', '{{product_name}}'],
  },
  {
    key: 'post_purchase',
    title: 'Post-Purchase Follow-up',
    subtitle: 'Sends 5 days after first purchase',
    tags: ['{{first_name}}', '{{product_name}}', '{{review_link}}'],
  },
  {
    key: 'order_fulfilled',
    title: 'Order Fulfilled',
    subtitle: 'Sends immediately when an order is fulfilled',
    tags: ['{{first_name}}', '{{order_number}}', '{{tracking_url}}'],
  },
  {
    key: 'order_cancelled',
    title: 'Order Cancelled',
    subtitle: 'Sends immediately when an order is cancelled',
    tags: ['{{first_name}}', '{{order_number}}'],
  },
  {
    key: 'abandoned_cart',
    title: 'Abandoned Cart',
    subtitle: 'Sends 1 hour after checkout with no purchase',
    tags: ['{{first_name}}', '{{product_name}}', '{{checkout_url}}'],
  },
  {
    key: 'refund_created',
    title: 'Refund Confirmation',
    subtitle: 'Sends immediately when a refund is processed',
    tags: ['{{first_name}}', '{{order_number}}', '{{amount}}'],
  },
]

const PREVIEW_VARS = {
  first_name: 'Sarah',
  product_name: 'Quarterly Pest Control',
  order_number: '1042',
  shop_name: 'Tango',
  review_link: 'https://g.page/r/tango/review',
  tracking_url: 'https://tools.usps.com/go/Track?tLabels=92748...',
  checkout_url: 'https://tangogvl.myshopify.com/checkouts/abc123',
  amount: '85.00',
}

const DEFAULT_TEMPLATES = Object.fromEntries(
  TEMPLATES_CONFIG.map(t => [t.key, ''])
)

function applyPreview(text) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => PREVIEW_VARS[key] || `{{${key}}}`)
}

function CharCounter({ count }) {
  if (count === 0) return null
  if (count > 160) {
    return <span className="text-sm text-red-600 font-semibold">{count} chars — over 160 (2 SMS segments)</span>
  }
  if (count >= 140) {
    return <span className="text-sm text-amber-500 font-semibold">{count} / 160 — near limit</span>
  }
  return <span className="text-sm text-green-600">{count} / 160</span>
}

function TemplateEditor({ config, value, onChange }) {
  const textareaRef = useRef(null)

  function insertTag(tag) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const newVal = value.slice(0, start) + tag + value.slice(end)
    onChange(newVal)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + tag.length, start + tag.length)
    })
  }

  return (
    <div className="flex flex-col bg-white rounded-xl shadow border border-gray-200 p-5 gap-3">
      <div>
        <h2 className="text-base font-semibold text-gray-800">{config.title}</h2>
        <p className="text-xs text-gray-400 mt-0.5">{config.subtitle}</p>
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={5}
        className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
        placeholder="Type your SMS message here…"
      />

      <div className="flex items-center justify-between min-h-[20px]">
        <CharCounter count={value.length} />
      </div>

      <div className="flex flex-wrap gap-2">
        {config.tags.map(tag => (
          <button
            key={tag}
            onClick={() => insertTag(tag)}
            className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  )
}

function PreviewCard({ config, text }) {
  return (
    <div className="flex-1 min-w-[200px] bg-gray-50 rounded-lg border border-gray-200 p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{config.title}</p>
      <p className="text-xs text-gray-400 mb-2">{config.subtitle}</p>
      <p className="text-sm text-gray-800 whitespace-pre-wrap min-h-[48px]">
        {text || <span className="text-gray-400 italic">No message yet</span>}
      </p>
    </div>
  )
}

export default function App() {
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES)
  const [saveStatus, setSaveStatus] = useState(null)

  useEffect(() => {
    fetch('/api/templates')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setTemplates(prev => ({ ...prev, ...data }))
      })
      .catch(() => {})
  }, [])

  function setField(key) {
    return val => setTemplates(prev => ({ ...prev, [key]: val }))
  }

  async function handleSave() {
    setSaveStatus('saving')
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templates),
      })
      if (res.ok) {
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus(null), 3000)
      } else {
        setSaveStatus('error')
      }
    } catch {
      setSaveStatus('error')
    }
  }

  const saveLabel =
    saveStatus === 'saving' ? 'Saving…' :
    saveStatus === 'saved'  ? '✓ Saved!' :
    saveStatus === 'error'  ? 'Error — retry' :
    'Save Templates'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-indigo-50 px-4 py-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SMS Template Manager</h1>
            <p className="text-sm text-gray-500 mt-1">Edit, preview, and save your SMS templates — changes go live immediately</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-sm shadow hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-60"
          >
            {saveLabel}
          </button>
        </div>

        {/* Editors */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TEMPLATES_CONFIG.map(config => (
            <TemplateEditor
              key={config.key}
              config={config}
              value={templates[config.key]}
              onChange={setField(config.key)}
            />
          ))}
        </div>

        {/* Live Preview */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Live Preview</h2>
          <div className="flex flex-wrap gap-3">
            {TEMPLATES_CONFIG.map(config => (
              <PreviewCard
                key={config.key}
                config={config}
                text={applyPreview(templates[config.key])}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
