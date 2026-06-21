'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, RefreshCw } from 'lucide-react'
import { Metric, Sidebar } from '../../../components/AppUi'

type Report = {
  visitors: number
  views: number
  starts: number
  cartAdds: number
  orders: number
  conversionRate: number
  topProducts: Array<{ name: string; clicks: number }>
  recentEvents: Array<{ name: string; timestamp: string; productName: string }>
}

const emptyReport: Report = {
  visitors: 0,
  views: 0,
  starts: 0,
  cartAdds: 0,
  orders: 0,
  conversionRate: 0,
  topProducts: [],
  recentEvents: []
}

export default function AnalyticsPage() {
  const [report, setReport] = useState<Report>(emptyReport)
  const [loading, setLoading] = useState(true)

  async function loadReport() {
    setLoading(true)
    const response = await fetch('/api/analytics/events', { cache: 'no-store' })
    if (response.ok) setReport(await response.json())
    setLoading(false)
  }

  useEffect(() => {
    void loadReport()
  }, [])

  return (
    <main className="appFrame">
      <Sidebar active="analytics" />
      <section className="workspace">
        <header className="pageHeader">
          <div>
            <p className="kicker">KPI 7 วันล่าสุด</p>
            <h1>Customer Analytics</h1>
          </div>
          <div className="headerActions">
            <button className="button" onClick={loadReport} disabled={loading}>
              <RefreshCw size={16} />
              {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
            </button>
            <a
              className="button darkButton"
              href="https://vercel.com/num-s-projects2/jebar_catalog_app_production_v1/analytics"
              target="_blank"
              rel="noreferrer"
            >
              Vercel Traffic <ExternalLink size={15} />
            </a>
          </div>
        </header>

        <section className="metricGrid">
          <Metric label="ผู้ใช้งานไม่ซ้ำ" value={report.visitors} suffix="คน" />
          <Metric label="เปิดหน้าแคตตาล็อก" value={report.views} suffix="ครั้ง" />
          <Metric label="เริ่มดูรายการ" value={report.starts} suffix="ครั้ง" />
          <Metric label="เพิ่มสินค้าลงรายการ" value={report.cartAdds} suffix="ครั้ง" />
          <Metric label="คัดลอกออเดอร์" value={report.orders} suffix="ครั้ง" />
          <Metric label="Conversion" value={report.conversionRate} suffix="เปอร์เซ็นต์" />
        </section>

        <div className="dashboardGrid">
          <section className="surface">
            <div className="surfaceHeader">
              <div>
                <h2>สินค้าที่ถูกกดมากที่สุด</h2>
                <p>เรียงจากจำนวนครั้งที่ลูกค้ากดเพิ่มสินค้า</p>
              </div>
            </div>
            <div className="compactList">
              {report.topProducts.length === 0 ? (
                <p className="muted">ยังไม่มีข้อมูล รอให้ลูกค้าเริ่มใช้งานหน้าแคตตาล็อก</p>
              ) : (
                report.topProducts.map((product) => (
                  <div className="compactRow" key={product.name}>
                    <strong>{product.name}</strong>
                    <b>{product.clicks} ครั้ง</b>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="surface">
            <div className="surfaceHeader">
              <div>
                <h2>กิจกรรมล่าสุด</h2>
                <p>20 events ล่าสุดในช่วง 7 วัน</p>
              </div>
            </div>
            <div className="compactList">
              {report.recentEvents.length === 0 ? (
                <p className="muted">ยังไม่มี event</p>
              ) : (
                report.recentEvents.map((event, index) => (
                  <div className="compactRow" key={`${event.timestamp}-${index}`}>
                    <div>
                      <strong>{event.name}</strong>
                      <span>{event.productName}</span>
                    </div>
                    <small>{new Date(event.timestamp).toLocaleString('th-TH')}</small>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}
