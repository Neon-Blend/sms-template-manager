import React, { useState, useRef, useEffect, useCallback } from 'react'

const TAGS = [
  { label: '{{first_name}}', value: '{{first_name}}' },
  { label: '{{product_name}}', value: '{{product_name}}' },
  { label: '{{order_number}}', value: '{{order_number}}' },
  { label: '{{shop_name}}', value: '{{shop_name}}' },
  { label: '{{review_link}}', value: '{{review_link}}' },
]

const PREVIEW_VARS = {
  first_name: 'Sarah',
  product_name: 'Skincare Set',
  order_number: '#1042',
  shop_name: 'Your Shop',
  review_link: 'https://example.com/review',
}

const DELAY_OPTIONS = [3, 5, 7]

const DEFAULT_TEMPLATES = {
  new_signup: '',
  first_purchase: '',
  post_purchase: '',
  post_purchase_delay: 3,
}

function applyPreview(text) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => PREVIEW_VARS[key] || `{{${key}}}`)
}

function CharCounter({ count }) {
  let colorClass = 'text-green-600'
  let label = `${count} / 160`
  if (count > 160) {
    colorClass = 'text-red-600 font-semibold'
    label = `${count} chars — over limit`
  } else if (count >= 140) {
    colorClass = 'text-amber-500 font-semibold'
    label = `${count} / 160 — near limit`
  }
  return <span className={`text-sm ${colorClass}`}>{label}</span>
}

function TemplateEditor({ title, value, onChange, textareaRef, extraControls }) {
  const count = value.length

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
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={6}
        className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
        placeholder="Type your SMS message here…"
      />

      <div className="flex items-center justify-between">
        <CharCounter count={count} />
      </div>

      <div className="flex flex-wrap gap-2">
        {TAGS.map(tag => (
          <button
            key={tag.value}
            onClick={() => insertTag(tag.value)}
            className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer"
          >
            {tag.label}
          </button>
        ))}
      </div>

      {extraControls}
    </div>
  )
}

function PreviewCard({ title, text }) {
  return (
    <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</p>
      <p className="text-sm text-gray-800 whitespace-pre-wrap min-h-[60px]">
        {text || <span className="text-gray-400 italic">No message yet</span>}
      </p>
    </div>
  )
}

export default function App() {
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES)
  const [saveStatus, setSaveStatus] = useState(null) // null | 'saving' | 'saved' | 'error'

  const refs = {
    new_signup: useRef(null),
    first_purchase: useRef(null),
    post_purchase: useRef(null),
  }

  useEffect(() => {
    fetch('/api/templates')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setTemplates(prev => ({
            ...prev,
            new_signup: data.new_signup || '',
            first_purchase: data.first_purchase || '',
            post_purchase: data.post_purchase || '',
            post_purchase_delay: data.post_purchase_delay ?? 3,
          }))
        }
      })
      .catch(() => {})
  }, [])

  function setField(field) {
    return val => setTemplates(prev => ({ ...prev, [field]: val }))
  }

  async function handleSave() {
    setSaveStatus('saving')
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_signup: templates.new_signup,
          first_purchase: templates.first_purchase,
          post_purchase: templates.post_purchase,
          post_purchase_delay: templates.post_purchase_delay,
        }),
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

  const delayDropdown = (
    <div className="flex items-center gap-2 mt-1">
      <label className="text-sm text-gray-600">Send delay:</label>
      <select
        value={templates.post_purchase_delay}
        onChange={e => setField('post_purchase_delay')(Number(e.target.value))}
        className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        {DELAY_OPTIONS.map(d => (
          <option key={d} value={d}>{d} days after order</option>
        ))}
      </select>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-indigo-50 px-4 py-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SMS Template Manager</h1>
            <p className="text-sm text-gray-500 mt-1">Edit, preview, and save your SMS templates</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-sm shadow hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-60"
          >
            {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Error — retry' : 'Save Templates'}
          </button>
        </div>

        {/* Editors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <TemplateEditor
            title="New Signup"
            value={templates.new_signup}
            onChange={setField('new_signup')}
            textareaRef={refs.new_signup}
          />
          <TemplateEditor
            title="First Purchase"
            value={templates.first_purchase}
            onChange={setField('first_purchase')}
            textareaRef={refs.first_purchase}
          />
          <TemplateEditor
            title="Post-Purchase Follow-up"
            value={templates.post_purchase}
            onChange={setField('post_purchase')}
            textareaRef={refs.post_purchase}
            extraControls={delayDropdown}
          />
        </div>

        {/* Live Preview */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Live Preview</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <PreviewCard title="New Signup" text={applyPreview(templates.new_signup)} />
            <PreviewCard title="First Purchase" text={applyPreview(templates.first_purchase)} />
            <PreviewCard
              title={`Post-Purchase (sent ${templates.post_purchase_delay} days after order)`}
              text={applyPreview(templates.post_purchase)}
            />
          </div>
        </div>

      </div>
    </div>
  )
}
