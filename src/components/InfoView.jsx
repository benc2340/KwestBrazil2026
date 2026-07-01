import { useState } from 'react'

const LEADERS = [
  { name: 'Ben', phone: '828-772-0917' },
  { name: 'Sarah', phone: '917-806-5640' },
  { name: 'Becca', phone: '404-895-2990' },
  { name: 'Colin', phone: '571-623-2308' },
  { name: 'Carlos', phone: '323-632-2504' },
]

const EMERGENCY = [
  {
    name: 'Hospital Municipal Souza Aguiar',
    note: '24h Emergency — Rio',
    phone: '+55 21 3111-2600',
    address: 'Praça da República, 111 - Centro, Rio de Janeiro',
  },
  {
    name: 'Hospital Municipal Miguel Couto',
    note: '24h Emergency — Rio (Gávea)',
    phone: '+55 21 97337-7378',
    address: 'Rua Mario Ribeiro, 117 - Gávea, Rio de Janeiro',
  },
  {
    name: 'Emergency Health Center Copacabana (UPA)',
    note: 'Urgent care — fevers, aches, non-critical',
    phone: '+55 21 2134-4900',
    address: 'Rua Siqueira Campos, 129 - Copacabana, Rio de Janeiro',
  },
  {
    name: 'Hospital Dr Rodolpho Perisse',
    note: '24h Emergency — Búzios',
    phone: '+55 22 2350-6001',
    address: 'Estr. dos Búzios, S/N - São José, Armação dos Búzios',
  },
]

const BRL_RATE = 5.72 // approximate — verify before trip

export default function InfoView() {
  const [usd, setUsd] = useState('')
  const [brl, setBrl] = useState('')
  const [flipped, setFlipped] = useState(false)
  const [section, setSection] = useState('currency')

  function handleUsd(val) {
    setUsd(val)
    setBrl(val ? (parseFloat(val) * BRL_RATE).toFixed(2) : '')
  }
  function handleBrl(val) {
    setBrl(val)
    setUsd(val ? (parseFloat(val) / BRL_RATE).toFixed(2) : '')
  }
  function swap() { setFlipped(f => !f) }

  const topField = flipped
    ? { label: 'Brazilian Reais (BRL)', symbol: 'R$', value: brl, onChange: handleBrl }
    : { label: 'US Dollars (USD)', symbol: '$', value: usd, onChange: handleUsd }
  const bottomField = flipped
    ? { label: 'US Dollars (USD)', symbol: '$', value: usd, onChange: handleUsd }
    : { label: 'Brazilian Reais (BRL)', symbol: 'R$', value: brl, onChange: handleBrl }

  return (
    <div className="h-full flex flex-col">
      {/* Section tabs */}
      <div className="flex gap-2 pb-3 pt-1 shrink-0">
        {[
          { id: 'currency', label: '💱 Currency' },
          { id: 'leaders', label: '📞 Leaders' },
          { id: 'emergency', label: '🚨 Emergency' },
        ].map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${section === s.id ? 'bg-dusk text-sand' : 'bg-white text-ink/60'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        {section === 'currency' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="font-semibold text-ink mb-4">USD ↔ BRL Converter</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-ink/50 font-medium mb-1 block">{topField.label}</label>
                  <div className="flex items-center gap-2 border border-ink/15 rounded-xl px-4 py-3">
                    <span className="text-ink/40 font-medium">{topField.symbol}</span>
                    <input type="number" value={topField.value} onChange={e => topField.onChange(e.target.value)}
                      placeholder="0.00" className="flex-1 focus:outline-none text-ink font-semibold text-lg" />
                  </div>
                </div>
                <div className="text-center">
                  <button onClick={swap}
                    className="w-10 h-10 rounded-full bg-sand border border-ink/15 text-ink/50 text-xl flex items-center justify-center mx-auto hover:bg-ink/5 transition-colors">
                    ⇅
                  </button>
                </div>
                <div>
                  <label className="text-xs text-ink/50 font-medium mb-1 block">{bottomField.label}</label>
                  <div className="flex items-center gap-2 border border-ink/15 rounded-xl px-4 py-3">
                    <span className="text-ink/40 font-medium">{bottomField.symbol}</span>
                    <input type="number" value={bottomField.value} onChange={e => bottomField.onChange(e.target.value)}
                      placeholder="0.00" className="flex-1 focus:outline-none text-ink font-semibold text-lg" />
                  </div>
                </div>
              </div>
              <p className="text-ink/30 text-xs mt-3 text-center">Rate: 1 USD ≈ {BRL_RATE} BRL · Verify before using</p>
            </div>
            <div className="bg-bloom/20 rounded-2xl p-4">
              <p className="font-semibold text-ink text-sm mb-2">💡 Brazil Currency Tips</p>
              <ul className="text-ink/60 text-xs space-y-1.5">
                <li>• Carry some cash — many smaller vendors are cash only</li>
                <li>• ATMs (Banco24Horas) are the best rate for withdrawals</li>
                <li>• Avoid exchanging at airports — rates are poor</li>
                <li>• Notify your bank before traveling to avoid card blocks</li>
                <li>• Visa/Mastercard are widely accepted in Rio & Búzios</li>
              </ul>
            </div>
          </div>
        )}

        {section === 'leaders' && (
          <div className="space-y-2">
            <p className="text-ink/40 text-xs font-semibold tracking-widest uppercase mb-3">Your Trip Leaders</p>
            {LEADERS.map(l => (
              <div key={l.name} className="bg-white rounded-2xl px-4 py-3.5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="font-semibold text-ink">{l.name}</p>
                  <p className="text-ink/40 text-sm">{l.phone}</p>
                </div>
                <a
                  href={`tel:${l.phone.replace(/-/g, '')}`}
                  className="w-10 h-10 rounded-full bg-canopy/10 text-canopy flex items-center justify-center text-lg"
                >
                  📲
                </a>
              </div>
            ))}
          </div>
        )}

        {section === 'emergency' && (
          <div className="space-y-3">
            <div className="bg-clay/10 border border-clay/20 rounded-2xl p-3 mb-2">
              <p className="text-clay text-sm font-semibold">🚨 In a life-threatening emergency, call 192 (SAMU) or 193 (Fire/Rescue)</p>
            </div>
            {EMERGENCY.map(e => (
              <div key={e.name} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-semibold text-ink text-sm">{e.name}</p>
                    <p className="text-clay text-xs mt-0.5">{e.note}</p>
                    <p className="text-ink/40 text-xs mt-1">{e.address}</p>
                  </div>
                  <a
                    href={`tel:${e.phone.replace(/[\s-]/g, '')}`}
                    className="shrink-0 w-10 h-10 rounded-full bg-clay/10 text-clay flex items-center justify-center text-lg"
                  >
                    📲
                  </a>
                </div>
                <p className="text-dusk font-semibold text-sm mt-2">{e.phone}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
