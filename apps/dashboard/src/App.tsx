import { useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, Check, ChevronDown,
  CircleAlert, Clock3, Download, ExternalLink, LayoutDashboard, Package,
  RefreshCw, Search, Settings2, ShieldCheck, ShoppingBag, Sparkles,
  TrendingUp, Wallet, X
} from 'lucide-react'

type Order = {
  id: string; customer: string; amount: number; status: string;
  payment: string; age: string; issue: string; priority: 'High'|'Needs attention';
}
const sampleOrders: Order[] = [
  { id:'#RT-20841', customer:'Aarav Sharma', amount:1840, status:'Pending payment', payment:'Unpaid', age:'2h 38m', issue:'Payment has been pending for more than 2 hours.', priority:'High' },
  { id:'#RT-20837', customer:'Kavita Jain', amount:960, status:'Processing', payment:'Paid', age:'26h 12m', issue:'Dispatch not verified after 24 hours.', priority:'Needs attention' },
  { id:'#RT-20832', customer:'Mohit Patidar', amount:2450, status:'Failed', payment:'Failed', age:'18m', issue:'Payment attempt failed. Review gateway status.', priority:'High' },
  { id:'#RT-20828', customer:'Nisha Rathore', amount:1280, status:'On hold', payment:'Awaiting confirmation', age:'3h 04m', issue:'Order is on hold; confirm whether payment is required.', priority:'Needs attention' },
]
const rupee = (n:number) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n)

export default function App() {
  const [tab, setTab] = useState('Overview')
  const [demo, setDemo] = useState(true)
  const [orders, setOrders] = useState(sampleOrders)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Order | null>(null)
  const [notice, setNotice] = useState('')
  const [reportBusy, setReportBusy] = useState(false)
  const [apiStatus, setApiStatus] = useState<'checking'|'online'|'offline'>('checking')

  useEffect(() => {
    fetch('/api/health').then(r => r.ok ? setApiStatus('online') : setApiStatus('offline')).catch(() => setApiStatus('offline'))
  }, [])
  const visibleOrders = useMemo(() => orders.filter(o => `${o.id} ${o.customer} ${o.issue} ${o.status}`.toLowerCase().includes(query.toLowerCase())), [orders, query])
  function generateReport() {
    setReportBusy(true)
    setTimeout(() => { setReportBusy(false); setNotice('Daily report preview generated. Live WooCommerce data is not connected yet.') }, 550)
  }
  function markReviewed(id:string) {
    setOrders(prev => prev.filter(o => o.id !== id))
    setSelected(null)
    setNotice(`${id} marked reviewed in this preview. No WooCommerce order was changed.`)
  }
  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><ShoppingBag size={21}/></div><div><b>RatlamiTadka</b><span>BUSINESS AGENT</span></div></div>
      <div className="store-pill"><span className="live-dot"/><span>ratlamitadka.com</span><ChevronDown size={15}/></div>
      <div className="nav-label">WORKSPACE</div>
      {[
        {name:'Overview',icon:LayoutDashboard},{name:'Orders & alerts',icon:Package},
        {name:'Daily reports',icon:TrendingUp},{name:'Approvals',icon:ShieldCheck},
      ].map(n=><button key={n.name} className={`nav-item ${tab===n.name?'active':''}`} onClick={()=>setTab(n.name)}><n.icon size={18}/><span>{n.name}</span>{n.name==='Orders & alerts'&&<em>{orders.length}</em>}</button>)}
      <div className="nav-label second">MANAGE</div>
      {[{name:'Integrations',icon:Activity},{name:'Settings',icon:Settings2}].map(n=><button key={n.name} className={`nav-item ${tab===n.name?'active':''}`} onClick={()=>setTab(n.name)}><n.icon size={18}/><span>{n.name}</span></button>)}
      <div className="sidebar-bottom"><div className="secure-icon"><ShieldCheck size={17}/></div><div><b>Approval-first mode</b><span>Store changes require review</span></div><div className="toggle on" aria-label="Approval mode enabled"><i/></div></div>
      <div className="user-row"><div className="avatar">RT</div><div className="user-text"><b>Store administrator</b><span>Private workspace</span></div><button className="icon-button" aria-label="Settings" onClick={()=>setTab('Settings')}><Settings2 size={17}/></button></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="crumb">Workspace <span>/</span> <b>{tab}</b></div><div className="top-actions"><div className={`connection ${apiStatus}`}><span/>{apiStatus==='online'?'API connected':apiStatus==='offline'?'Demo mode':'Checking API'}</div><button className="icon-button notification" aria-label="Notifications" onClick={()=>setTab('Orders & alerts')}><Bell size={18}/><i/></button><div className="avatar small">RT</div></div></header>
      <div className="page">
        <div className="welcome-row"><div><div className="eyebrow"><Sparkles size={14}/> YOUR AI BUSINESS ASSISTANT</div><h1>{tab==='Overview'?'Good evening. Here’s your store pulse.':tab}</h1><p className="subhead">Sales and order health for RatlamiTadka, in one place.</p></div><div className="date-chip"><span className="calendar-dot"/> Sunday, 11 October 2026 <ChevronDown size={15}/></div></div>
        {demo && <div className="demo-banner"><div className="demo-symbol"><Sparkles size={17}/></div><div><b>Preview data</b><span>This dashboard is using sample figures. Connect WooCommerce to see your real orders and sales.</span></div><button onClick={()=>setTab('Integrations')}>Connect store <ExternalLink size={14}/></button><button className="banner-close" onClick={()=>setDemo(false)} aria-label="Dismiss preview notice"><X size={16}/></button></div>}
        {tab==='Overview' || tab==='Daily reports' ? <>
          <div className="section-head"><div><h2>Today at a glance</h2><p>Compared with yesterday at the same time · 6:00 PM IST</p></div><button className="button secondary" onClick={generateReport} disabled={reportBusy}><RefreshCw size={15} className={reportBusy?'spin':''}/>{reportBusy?'Generating…':'Generate report'}</button></div>
          <div className="metrics">
            <Metric icon={<Wallet size={18}/>} label="Net sales" value="₹28,460" delta="+12.8%" positive detail="After discounts & refunds" />
            <Metric icon={<ShoppingBag size={18}/>} label="Orders received" value="34" delta="+6.3%" positive detail="Orders placed today" />
            <Metric icon={<TrendingUp size={18}/>} label="Average order value" value="₹837" delta="+4.1%" positive detail="Net sales ÷ orders" />
            <Metric icon={<Clock3 size={18}/>} label="Needs attention" value={String(orders.length).padStart(2,'0')} delta="2 high priority" positive={false} detail="Open order exceptions" />
          </div>
          <div className="content-grid">
            <section className="panel sales-panel"><div className="panel-head"><div><h3>Sales trend</h3><p>Net sales by time of day</p></div><button className="select-chip">Today <ChevronDown size={14}/></button></div>
              <div className="chart-total"><strong>₹28,460</strong><span className="growth"><ArrowUpRight size={15}/> 12.8%</span><small>vs yesterday at 6 PM</small></div>
              <div className="chart-wrap"><div className="y-labels"><span>₹8k</span><span>₹6k</span><span>₹4k</span><span>₹2k</span><span>₹0</span></div><svg viewBox="0 0 560 170" preserveAspectRatio="none" role="img" aria-label="Illustrative sales trend chart"><defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#d97736" stopOpacity=".22"/><stop offset="100%" stopColor="#d97736" stopOpacity="0"/></linearGradient></defs>{[15,50,85,120,155].map(y=><line key={y} x1="0" x2="560" y1={y} y2={y} stroke="#ecece7" strokeDasharray="3 5"/>)}<path d="M0 142 C30 138 42 122 65 129 S106 108 130 118 S171 83 195 101 S233 77 260 89 S298 45 325 69 S365 53 390 59 S430 29 455 45 S510 19 560 24 L560 160 L0 160 Z" fill="url(#fill)"/><path d="M0 142 C30 138 42 122 65 129 S106 108 130 118 S171 83 195 101 S233 77 260 89 S298 45 325 69 S365 53 390 59 S430 29 455 45 S510 19 560 24" fill="none" stroke="#c86a2b" strokeWidth="2.5" strokeLinecap="round"/></svg></div><div className="x-labels"><span>9 AM</span><span>11 AM</span><span>1 PM</span><span>3 PM</span><span>5 PM</span><span>6 PM</span></div><div className="chart-foot"><span><i className="legend-dot"/> Today</span><span><i className="legend-dot pale"/> Yesterday (comparison)</span><span className="illustrative">Illustrative preview</span></div>
            </section>
            <section className="panel insight-panel"><div className="panel-head"><div className="insight-title"><div className="ai-icon"><Sparkles size={17}/></div><div><h3>Agent’s briefing</h3><p>Daily business summary</p></div></div><span className="soft-badge">PREVIEW</span></div>
              <div className="briefing"><p className="briefing-lead">Sales are trending ahead of yesterday.</p><p>Sample data shows net sales up 12.8%, with average order value also improving. Focus first on the payment exceptions below.</p></div>
              <div className="insight-item"><div className="insight-bullet orange"><CircleAlert size={16}/></div><div><b>2 high-priority orders</b><span>One payment is overdue; one payment failed.</span></div></div>
              <div className="insight-item"><div className="insight-bullet green"><TrendingUp size={16}/></div><div><b>Average order value improved</b><span>Sample increase of ₹33 versus yesterday.</span></div></div>
              <button className="text-button" onClick={()=>setTab('Daily reports')}>View daily report <span>→</span></button>
            </section>
          </div>
        </> : null}
        {tab==='Overview' || tab==='Orders & alerts' ? <section className="panel orders-panel"><div className="panel-head order-head"><div><h3>Orders needing attention <span className="count">{orders.length}</span></h3><p>Rules-based alerts · Last checked just now in preview</p></div><div className="order-tools"><div className="search-box"><Search size={15}/><input placeholder="Search orders…" value={query} onChange={e=>setQuery(e.target.value)}/></div><button className="button secondary small-button" onClick={()=>setOrders(sampleOrders)}><RefreshCw size={14}/> Refresh</button></div></div>
          <div className="table-scroll"><table><thead><tr><th>ORDER</th><th>ISSUE</th><th>ORDER VALUE</th><th>AGE</th><th>PRIORITY</th><th/></tr></thead><tbody>{visibleOrders.map(o=><tr key={o.id}><td><button className="order-link" onClick={()=>setSelected(o)}>{o.id}</button><span className="customer">{o.customer}</span></td><td><span className={`status-dot ${o.payment==='Paid'?'amber':o.payment==='Failed'?'red':'orange'}`}/>{o.status}<span className="issue-sub">{o.issue}</span></td><td className="amount">{rupee(o.amount)}</td><td className="age">{o.age}</td><td><span className={`priority ${o.priority==='High'?'high':'attention'}`}>{o.priority==='High'?<CircleAlert size={12}/>:<Clock3 size={12}/>} {o.priority}</span></td><td><button className="row-action" onClick={()=>setSelected(o)}>Review <span>→</span></button></td></tr>)}</tbody></table>{visibleOrders.length===0&&<div className="empty">No matching orders.</div>}</div>
          <div className="table-foot"><span>Showing {visibleOrders.length} sample exceptions</span><button className="text-button" onClick={()=>setTab('Orders & alerts')}>View all orders <span>→</span></button></div>
        </section>:null}
        {tab==='Approvals'&&<section className="panel blank-panel"><div className="blank-icon"><ShieldCheck size={24}/></div><h3>No actions waiting for approval</h3><p>When the agent proposes an action, you’ll review the exact change here before it can run.</p><span className="muted-tag">Approval-first mode enabled</span></section>}
        {tab==='Integrations'&&<section className="panel integrations-panel"><div className="panel-head"><div><h3>Store connections</h3><p>Connect your store without exposing credentials in the browser.</p></div><span className="soft-badge">SETUP REQUIRED</span></div><div className="integration-card"><div className="integration-logo">W</div><div className="integration-copy"><b>WooCommerce</b><span>Orders, refunds, payment and product data</span><small>Read-only API key recommended for initial setup</small></div><span className="connection-tag">Not connected</span><button className="button primary" onClick={()=>setNotice('Next: deploy the Worker, set WooCommerce credentials as Cloudflare secrets, then configure signed webhooks. See README.md.')}>Setup guide <ExternalLink size={14}/></button></div><div className="security-note"><ShieldCheck size={18}/><div><b>Credentials stay server-side</b><p>Never paste API keys into this dashboard or commit them to Git. Store them as Cloudflare Worker secrets.</p></div></div></section>}
        {tab==='Settings'&&<section className="panel settings-panel"><div className="panel-head"><div><h3>Agent settings</h3><p>Business rules selected for the first release</p></div></div><div className="setting-row"><div><b>Reporting timezone</b><span>Daily reporting cutoff uses India Standard Time.</span></div><strong>Asia/Kolkata (IST)</strong></div><div className="setting-row"><div><b>Daily report</b><span>Report compares today with yesterday at the same cutoff.</span></div><strong>6:00 PM IST</strong></div><div className="setting-row"><div><b>Payment pending alert</b><span>Unpaid eligible orders are flagged after this threshold.</span></div><strong>2 hours</strong></div><div className="setting-row"><div><b>Dispatch delay alert</b><span>Requires a reliable dispatch event to confirm shipment.</span></div><strong>24 hours</strong></div><div className="setting-row"><div><b>Actions</b><span>Any future store-changing action needs explicit approval.</span></div><strong>Approval required</strong></div></section>}
        <footer className="footer"><span>© 2026 RatlamiTadka Business Agent</span><span><ShieldCheck size={13}/> Private workspace <span className="footer-sep">·</span> <span className="demo-text">Demo data until connected</span></span></footer>
      </div>
    </main>
    {selected&&<div className="modal-backdrop" onClick={()=>setSelected(null)}><section className="review-modal" onClick={e=>e.stopPropagation()}><div className="modal-top"><div><span className="eyebrow">ORDER REVIEW</span><h2>{selected.id}</h2></div><button className="icon-button" onClick={()=>setSelected(null)} aria-label="Close"><X size={19}/></button></div><div className="modal-status"><span className={`priority ${selected.priority==='High'?'high':'attention'}`}>{selected.priority}</span><span>{selected.status}</span></div><div className="modal-grid"><div><small>Customer</small><b>{selected.customer}</b></div><div><small>Order value</small><b>{rupee(selected.amount)}</b></div><div><small>Elapsed time</small><b>{selected.age}</b></div><div><small>Payment state</small><b>{selected.payment}</b></div></div><div className="reason-box"><CircleAlert size={17}/><div><b>Why this was flagged</b><p>{selected.issue}</p></div></div><div className="modal-warning">Preview only. This action will not change the WooCommerce order.</div><div className="modal-actions"><button className="button secondary" onClick={()=>setSelected(null)}>Close</button><button className="button primary" onClick={()=>markReviewed(selected.id)}><Check size={15}/> Mark reviewed</button></div></section></div>}
    {notice&&<div className="toast"><Check size={17}/><span>{notice}</span><button onClick={()=>setNotice('')} aria-label="Dismiss"><X size={15}/></button></div>}
  </div>
}
function Metric({icon,label,value,delta,positive,detail}:{icon:React.ReactNode,label:string,value:string,delta:string,positive:boolean,detail:string}) {
  return <section className="metric-card"><div className="metric-top"><span className="metric-icon">{icon}</span><span className={`delta ${positive?'up':'down'}`}>{positive?<ArrowUpRight size={13}/>:<ArrowDownRight size={13}/>} {delta}</span></div><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-detail">{detail}</div></section>
}
