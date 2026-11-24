import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ArrowRight, ChartColumn, CircleAlert, CircleCheck, Clock, FileText, Plus, type LucideIcon } from 'lucide-react'
import { Header, Skeleton } from '../components/Page'
import { Pager, type Page } from '../components/Pager'
import { Tabs } from '../components/Tabs'
import { apiGet } from '../services/apiClient'
import { CATEGORY_LABELS, STATUS_LABELS, type ActivityRecord, type SourceCategory, type ActivityStatus, type ActivitySummary, type Facility, type ReportingPeriod } from '../types/api'
import { Notify } from '../components/Toast'

import { dateRange, day } from '../services/format'
const Badge = ({ status }: { status: ActivityStatus }) => <span className={`badge badge--${status.toLowerCase()}`}>{STATUS_LABELS[status]}</span>

function KCard({ tone, icon: Icon, title, sub, value, unit, link, to }: { tone: string; icon: LucideIcon; title: string; sub: string; value: number; unit: string; link: string; to: string }) {
  return (
    <Link className={`kcard kcard--${tone}`} to={to}>
      <div className="kcard__head">
        <div><h3 className="kcard__title">{title}</h3><p className="kcard__sub">{sub}</p></div>
        <span className="kcard__icon"><Icon size={20} /></span>
      </div>
      <div className="kcard__foot">
        <span className="kcard__value">{value.toLocaleString()}<span className="kcard__unit">{unit}</span></span>
        <span className="kcard__link">{link} <ArrowRight size={14} /></span>
      </div>
    </Link>
  )
}

function RecordsTable({ rows }: { rows: ActivityRecord[] }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead><tr><th>Facility</th><th>Source</th><th>Category</th><th>Period</th><th>Dates</th><th>Quantity</th><th>Status</th><th>By</th><th aria-label="Open" /></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.facility.code}</td>
              <td>{r.emissionSource.name}</td>
              <td className="nowrap"><span className="field__hint">{CATEGORY_SHORT[r.emissionSource.category]}</span></td>
              <td className="nowrap">{r.reportingPeriod.name}</td>
              <td className="nowrap">{dateRange(r.startDate, r.endDate)}</td>
              <td className="num">{Number(r.quantity).toLocaleString(undefined, { maximumFractionDigits: 6 })} {r.unit}</td>
              <td><Badge status={r.status} /></td>
              <td className="nowrap">{r.createdBy.name}</td>
              <td className="table__actions"><Link className="link" to={`/activities/${r.id}`}>Details <ArrowRight size={13} className="icon-inline" /></Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ActivityDashboardPage() {
  const { me } = useAuth()
  const flash = (useLocation().state as { flash?: string } | null)?.flash
  const [data, setData] = useState<ActivitySummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const canWrite = me?.permissions.includes('activity.write')

  useEffect(() => { apiGet<ActivitySummary>('/api/activities/summary').then(setData).catch((e: Error) => setError(e.message)) }, [])

  return (
    <>
      <Header
        title="Activity Dashboard"
        subtitle={<>{me?.organization?.name}{data && <> · {data.total.toLocaleString()} activity records</>}</>}
        action={<>
          {me?.permissions.includes('report.read') && <Link className="button button--ghost" to="/analytics"><ChartColumn size={16} /> View analytics</Link>}
          {canWrite && <Link className="button" to="/activities/new"><Plus size={16} /> New activity record</Link>}
        </>}
      />
      <Notify message={flash} />
      <Notify kind="error" message={error} />
      {!data && !error && <Skeleton />}


      {data && (
        <>
          <div className="kcards">
            <KCard tone="violet" icon={FileText} title="Drafts in Progress" sub="Saved but not yet submitted" value={data.draft} unit="drafts" link="Open drafts" to="/activities?status=DRAFT" />
            <KCard tone="red" icon={CircleAlert} title="Returned for Correction" sub="Needs correcting and resubmitting" value={data.returned} unit="returned" link="Fix records" to="/activities?status=RETURNED" />
            <KCard tone="amber" icon={Clock} title="Awaiting Review" sub="Submitted, waiting for a reviewer" value={data.submitted} unit="pending" link="Review queue" to={me?.permissions.includes('activity.review') ? '/review' : '/activities?status=SUBMITTED'} />
            <KCard tone="green" icon={CircleCheck} title="Approved Records" sub={data.total ? `${Math.round((data.approved / data.total) * 100)}% of ${data.total.toLocaleString()} records` : 'No records yet'} value={data.approved} unit="approved" link="View approved" to="/activities?status=APPROVED" />
          </div>

          {data.total === 0 ? (
            <section className="card"><p className="status">No activity records yet.{canWrite && ' Create the first one with "New activity record".'}</p></section>
          ) : (
            <>
              {canWrite && data.myDrafts.length > 0 && (
                <section className="card card--spaced">
                  <h2 className="card__title">Continue your drafts and returned records</h2>
                  <ul className="list">
                    {data.myDrafts.map((d) => (
                      <li key={d.id}>
                        <Link className="list__item" to={`/activities/${d.id}`}>
                          <span className="list__title">{d.facility.code} · {d.emissionSource.name} <Badge status={d.status} /></span>
                          <span className="list__meta">{day(d.startDate)} · {Number(d.quantity).toLocaleString()} {d.unit} · edited {new Date(d.updatedAt).toLocaleDateString()}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="card card--spaced">
                <h2 className="card__title">By facility and reporting period</h2>
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>Facility</th><th>Reporting period</th><th className="num">Drafts</th><th className="num">Submitted</th><th className="num">Returned</th><th className="num">Approved</th><th className="num">Total</th></tr></thead>
                    <tbody>
                      {data.byFacilityPeriod.map((g) => (
                        <tr key={g.facility.id + g.period.id}>
                          <td>{g.facility.code} — {g.facility.name}</td>
                          <td>{g.period.name}{g.period.status === 'LOCKED' && ' (locked)'}</td>
                          <td className="num">{g.draft}</td>
                          <td className="num">{g.submitted}</td>
                          <td className="num">{g.returned}</td>
                          <td className="num">{g.approved}</td>
                          <td className="num"><Link className="link" to={`/activities?facilityId=${g.facility.id}&reportingPeriodId=${g.period.id}`}>{g.draft + g.submitted + g.returned + g.approved}</Link></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <div className="section-head"><h2>Recently Updated Records</h2><Link className="badge" to="/activities">View all {data.total.toLocaleString()} records</Link></div>
              <section className="card">
                <RecordsTable rows={data.recent} />
              </section>
            </>
          )}
        </>
      )}
    </>
  )
}

// The reviewer's queue is the record list fixed to submitted records, oldest first to review.
const STATUS_TABS: Array<[ActivityStatus, string, boolean]> = [['DRAFT', 'Drafts', false], ['SUBMITTED', 'Awaiting review', true], ['RETURNED', 'Returned', true], ['APPROVED', 'Approved', false]]
const CATEGORY_SHORT: Record<SourceCategory, string> = {
  PURCHASED_ELECTRICITY: 'Electricity', FUEL_COMBUSTION: 'Fuels', FUGITIVE_GAS: 'Refrigerants', PURCHASED_ENERGY: 'Steam / heat / cooling', PROCESS: 'Process', REMOVAL: 'Removals',
}

export function ReviewQueuePage() {
  const { me } = useAuth()
  if (!me?.permissions.includes('activity.review')) return <p className="status">The review queue is for reviewers. You do not have permission to review records.</p>
  return <ActivitiesPage queue />
}

export function ActivitiesPage({ queue = false }: { queue?: boolean }) {
  const { me } = useAuth()
  const flash = (useLocation().state as { flash?: string } | null)?.flash
  const [params, setParams] = useSearchParams()
  const [data, setData] = useState<(Page<ActivityRecord> & { counts: { status: Partial<Record<ActivityStatus, number>>; category: Partial<Record<SourceCategory, number>> } }) | null>(null)
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [periods, setPeriods] = useState<ReportingPeriod[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([apiGet<Facility[]>('/api/facilities'), apiGet<ReportingPeriod[]>('/api/reporting-periods')])
      .then(([f, p]) => { setFacilities(f); setPeriods(p) })
      .catch((e: Error) => setError(e.message))
  }, [])

  const query = queue ? new URLSearchParams({ ...Object.fromEntries(params), status: 'SUBMITTED' }).toString() : params.toString()
  const [loadedQuery, setLoadedQuery] = useState<string | null>(null)
  const loading = loadedQuery !== query
  useEffect(() => {
    apiGet<NonNullable<typeof data>>(`/api/activities${query ? `?${query}` : ''}`)
      .then((d) => { setData(d); setLoadedQuery(query) })
      .catch((e: Error) => setError(e.message))
  }, [query])

  const filter = (name: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(name, value)
    else next.delete(name)
    if (name !== 'page') next.delete('page') // new filter → back to page 1
    setParams(next)
  }

  return (
    <>
      <header className="page__header page__header--row">
        <div>
          <h1 className="page__title">{queue ? 'Review Queue' : 'Activity Records'}</h1>
          <p className="page__subtitle">{queue ? 'Submitted records waiting for approval. Open one to see its evidence and calculation preview, then approve or return it.' : `All activity data for ${me?.organization?.name}.`}</p>
        </div>
        {!queue && me?.permissions.includes('activity.write') && <Link className="button" to="/activities/new">New activity record</Link>}
      </header>
      <Notify message={flash} />
      {!queue && (
        <Tabs
          label="Status"
          active={params.get('status') ?? ''}
          onChange={(k) => filter('status', k)}
          tabs={[
            { key: '', label: 'All', count: data ? Object.values(data.counts.status).reduce((a, b) => a + (b ?? 0), 0) : undefined },
            ...STATUS_TABS.map(([st, label, alert]) => ({ key: st, label, count: data ? data.counts.status[st] ?? 0 : undefined, alert })),
          ]}
        />
      )}
      <Tabs
        small
        label="Category"
        active={params.get('category') ?? ''}
        onChange={(k) => filter('category', k)}
        tabs={[
          { key: '', label: 'All categories' },
          ...(Object.keys(CATEGORY_LABELS) as SourceCategory[])
            .filter((c) => !data || (data.counts.category[c] ?? 0) > 0 || params.get('category') === c)
            .map((c) => ({ key: c, label: CATEGORY_SHORT[c], count: data?.counts.category[c] ?? 0 })),
        ]}
      />
      <div className="filters">

        <select className="input" aria-label="Facility" value={params.get('facilityId') ?? ''} onChange={(e) => filter('facilityId', e.target.value)}>
          <option value="">All facilities</option>
          {facilities.map((f) => <option key={f.id} value={f.id}>{f.code} — {f.name}</option>)}
        </select>
        <select className="input" aria-label="Reporting period" value={params.get('reportingPeriodId') ?? ''} onChange={(e) => filter('reportingPeriodId', e.target.value)}>
          <option value="">All periods</option>
          {periods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <section className={`card ${loading && data ? 'is-loading' : ''}`} aria-busy={loading}>
        <Notify kind="error" message={error} />
        {!data && !error && <Skeleton />}
        {data?.total === 0 && <p className="status">{queue ? 'Nothing waiting for review.' : 'No records match.'}</p>}
        {!!data?.rows.length && <RecordsTable rows={data.rows} />}
        {data && <Pager data={data} onPage={(p) => filter('page', String(p))} />}
      </section>
    </>
  )
}

// What this person should do now, in the order the process runs: enter → review → calculate → lock → verify.
