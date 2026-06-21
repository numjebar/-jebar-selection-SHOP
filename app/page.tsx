'use client'

import Link from 'next/link'
import { CalendarDays } from 'lucide-react'
import { CatalogPoster, Metric, ProductThumb, Sidebar } from '../components/AppUi'
import { formatBaht, getAvailableProducts } from '../lib/catalogData'
import { useCatalogStore } from '../lib/useCatalogStore'
import { useTodayLabel } from '../lib/useTodayLabel'

export default function DashboardPage() {
  const { products, selection, stats, savedAt } = useCatalogStore()
  const todayLabel = useTodayLabel()
  const todayProducts = getAvailableProducts(products, selection)
  const recentProducts = todayProducts.slice(0, 5)

  return (
    <main className="appFrame">
      <Sidebar active="dashboard" />

      <section className="workspace">
        <header className="pageHeader">
          <div>
            <p className="kicker">แดชบอร์ด</p>
            <h1>JE BAR Daily Selection</h1>
          </div>
          <div className="dateChip">
            <CalendarDays size={16} />
            วันนี้ {todayLabel}
          </div>
        </header>

        <section className="metricGrid">
          <Metric label="สินค้าทั้งหมด" value={stats.totalProducts} suffix="รายการ" />
          <Metric label="สินค้าวันนี้" value={stats.todayProducts} suffix="รายการ" />
          <Metric label="แคตตาล็อกวันนี้" value={stats.catalogCount} suffix="เวอร์ชัน" />
          <Metric label="การจองวันนี้" value={stats.totalQuantity} suffix="รายการ" />
        </section>

        <div className="dashboardGrid">
          <section className="surface">
            <div className="surfaceHeader">
              <div>
                <h2>สินค้าที่มีวันนี้</h2>
                <p>รายการที่เปิดให้ลูกค้าเห็นในหน้าวันนี้</p>
              </div>
              <Link href="/admin/selection" className="textAction">
                ดูทั้งหมด
              </Link>
            </div>

            <div className="compactList">
              {recentProducts.map((product) => (
                <div className="compactRow" key={product.id}>
                  <ProductThumb productName={product.nameTh} imageUrl={product.imageUrl} />
                  <div>
                    <strong>{product.nameTh}</strong>
                    <span>เหลือ {selection[product.id]?.quantity || 0} ชิ้น</span>
                  </div>
                  <b>{formatBaht(product.price)}</b>
                </div>
              ))}
            </div>
          </section>

          <section className="surface">
            <div className="surfaceHeader">
              <div>
                <h2>แคตตาล็อกล่าสุด</h2>
                <p>อัปเดตล่าสุด {savedAt || '-'}</p>
              </div>
            </div>

            <CatalogPoster products={todayProducts.slice(0, 8)} selection={selection} />
            <Link href="/admin/catalog" className="button darkButton fullWidth">
              ดูแคตตาล็อก
            </Link>
          </section>
        </div>
      </section>
    </main>
  )
}
