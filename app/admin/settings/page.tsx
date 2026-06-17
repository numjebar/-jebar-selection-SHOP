'use client'

import { FormEvent, useState } from 'react'
import { KeyRound, Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import { Sidebar } from '../../../components/AppUi'
import { defaultMessageSettings } from '../../../lib/messages'
import { useCatalogStore } from '../../../lib/useCatalogStore'

export default function SettingsPage() {
  const {
    categories,
    messages,
    savedAt,
    addCategory,
    removeCategory,
    setMessages,
    updateCategory,
    updateMessages
  } = useCatalogStore()
  const [newCategoryName, setNewCategoryName] = useState('')
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordMessage, setPasswordMessage] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  function handleAddCategory(event: FormEvent) {
    event.preventDefault()
    addCategory(newCategoryName)
    setNewCategoryName('')
  }

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault()
    setPasswordMessage('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage('รหัสใหม่ไม่ตรงกัน')
      return
    }

    setIsChangingPassword(true)
    const response = await fetch('/api/admin/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
    })
    const data = await response.json().catch(() => null)

    setPasswordMessage(data?.message || (response.ok ? 'เปลี่ยนรหัสผ่านแล้ว' : 'เปลี่ยนรหัสผ่านไม่สำเร็จ'))
    setIsChangingPassword(false)

    if (response.ok) {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    }
  }

  return (
    <main className="appFrame">
      <Sidebar active="settings" />

      <section className="workspace">
        <header className="pageHeader">
          <div>
            <p className="kicker">ตั้งค่าร้าน</p>
            <h1>ข้อความและหมวดหมู่สินค้า</h1>
            <span className="muted">แก้แล้วระบบจะบันทึกอัตโนมัติใน browser นี้</span>
          </div>
          <button className="button subtleButton" onClick={() => setMessages(defaultMessageSettings)}>
            <RotateCcw size={17} />
            คืนค่าข้อความ
          </button>
        </header>

        <section className="settingsGrid">
          <label className="messageEditor surface">
            <span>ข้อความต้อนรับหน้าลูกค้า</span>
            <textarea
              value={messages.welcomeMessage}
              onChange={(event) => updateMessages({ welcomeMessage: event.target.value })}
              rows={9}
            />
          </label>

          <label className="messageEditor surface">
            <span>ข้อความส่งให้ลูกค้าทาง LINE OA / Facebook Inbox</span>
            <small>ใช้ตัวแปร {'{catalogUrl}'} เพื่อใส่ลิงก์หน้าลูกค้าอัตโนมัติ</small>
            <textarea
              value={messages.sendToCustomerMessage}
              onChange={(event) => updateMessages({ sendToCustomerMessage: event.target.value })}
              rows={8}
            />
          </label>

          <label className="messageEditor surface">
            <span>ข้อความขอบคุณหลังรับรายการ</span>
            <textarea
              value={messages.orderReceivedMessage}
              onChange={(event) => updateMessages({ orderReceivedMessage: event.target.value })}
              rows={8}
            />
          </label>

          <section className="categoryManager surface">
            <div>
              <span>หมวดหมู่สินค้า</span>
              <small>เพิ่ม ลบ หรือเปลี่ยนชื่อหมวดหมู่ได้เอง สินค้าที่อยู่ในหมวดที่ลบจะย้ายไปหมวดแรกอัตโนมัติ</small>
            </div>

            <form className="categoryAddRow" onSubmit={handleAddCategory}>
              <input
                className="input"
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder="ชื่อหมวดหมู่ใหม่"
              />
              <button className="button darkButton" type="submit">
                <Plus size={17} />
                เพิ่ม
              </button>
            </form>

            <div className="categoryList">
              {categories.map((category) => (
                <div className="categoryRow" key={category.code}>
                  <input
                    className="input"
                    value={category.label}
                    onChange={(event) => updateCategory(category.code, event.target.value)}
                  />
                  <button
                    aria-label={`ลบหมวดหมู่ ${category.label}`}
                    className="button subtleButton dangerButton"
                    disabled={categories.length <= 1}
                    onClick={() => removeCategory(category.code)}
                    type="button"
                  >
                    <Trash2 size={17} />
                    ลบ
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="passwordManager surface">
            <div>
              <span>รหัสผ่านหลังบ้าน</span>
              <small>เปลี่ยนรหัสที่ใช้เข้า `/admin/login` ได้จากตรงนี้</small>
            </div>

            <form className="passwordForm" onSubmit={handleChangePassword}>
              <label>
                <small>รหัสเดิม</small>
                <input
                  className="input"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })}
                  autoComplete="current-password"
                />
              </label>
              <label>
                <small>รหัสใหม่</small>
                <input
                  className="input"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
                  autoComplete="new-password"
                />
              </label>
              <label>
                <small>ยืนยันรหัสใหม่</small>
                <input
                  className="input"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })}
                  autoComplete="new-password"
                />
              </label>
              {passwordMessage ? <p className="passwordMessage">{passwordMessage}</p> : null}
              <button
                className="button darkButton fullWidth"
                disabled={isChangingPassword || !passwordForm.currentPassword || !passwordForm.newPassword}
                type="submit"
              >
                <KeyRound size={17} />
                {isChangingPassword ? 'กำลังเปลี่ยนรหัส' : 'เปลี่ยนรหัสผ่าน'}
              </button>
            </form>
          </section>
        </section>

        <footer className="settingsFooter">
          <Save size={17} />
          บันทึกล่าสุด {savedAt || '-'}
        </footer>
      </section>
    </main>
  )
}
