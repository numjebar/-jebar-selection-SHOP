# JE BAR Catalog

ระบบเลือกสินค้าวันนี้ สร้างแคตตาล็อก และให้ลูกค้าคัดลอกรายการสั่งซื้อกลับมาทาง LINE OA หรือ Facebook Inbox

## ใช้งานจริง

1. สร้าง Supabase project
2. เปิด Supabase SQL Editor แล้วรันไฟล์ `supabase/catalog_state.sql`
3. ตั้งค่า Environment Variables ในเครื่องหรือ Vercel
4. Deploy ขึ้น Vercel
5. เปิดหน้า `/admin/products`, `/admin/selection`, `/admin/catalog`, `/admin/settings` เพื่อจัดข้อมูลร้าน
6. ส่งลิงก์ `/catalog` ให้ลูกค้าเลือกสินค้าและคัดลอกข้อความสั่งซื้อ

## Environment Variables

สร้างไฟล์ `.env.local` ตอนรันในเครื่อง และใส่ค่าเดียวกันใน Vercel ตอน deploy

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=change-this-password
ADMIN_SESSION_TOKEN=change-this-long-random-token

NEXT_PUBLIC_LINE_URL=https://lin.ee/t8QoAix
NEXT_PUBLIC_LINE_OA_URL=https://lin.ee/t8QoAix
NEXT_PUBLIC_MESSENGER_URL=https://m.me/102339796492016
NEXT_PUBLIC_FACEBOOK_INBOX_URL=https://m.me/102339796492016
NEXT_PUBLIC_CATALOG_URL=https://catalog.jebar.app
NEXT_PUBLIC_SITE_URL=https://catalog.jebar.app
```

ถ้ายังไม่ใส่ Supabase ระบบจะใช้ข้อมูลใน browser เครื่องนั้นก่อน เหมาะสำหรับทดสอบเท่านั้น

ถ้าไม่ใส่ `ADMIN_PASSWORD` หน้า admin จะไม่ถูกล็อก เหมาะสำหรับพัฒนาในเครื่องเท่านั้น ตอน deploy จริงต้องตั้งค่านี้เสมอ

`ADMIN_SESSION_TOKEN` ควรเป็นข้อความสุ่มยาว ๆ ใช้สำหรับ cookie หลังล็อกอิน ถ้าไม่ใส่ระบบจะใช้ค่าเดียวกับ `ADMIN_PASSWORD`

## Data Storage

โหมดใช้งานจริงเก็บข้อมูลใน Supabase table `catalog_state` เป็น snapshot เดียว ประกอบด้วย:

- สินค้า
- สินค้าที่เลือกขายวันนี้และจำนวนคงเหลือ
- หมวดหมู่
- ข้อความที่ร้านแก้เอง

รูปสินค้าปัจจุบันถูกย่อและเก็บเป็น data URL ใน snapshot เพื่อให้ใช้งานเร็วใน V1 ถ้ารูปเยอะมากควรย้ายไป Supabase Storage ในรอบถัดไป

## Commands

```bash
npm run dev
npm run build
npm run start
```

## Admin Login

หน้า admin ทั้งหมดอยู่หลังระบบล็อกอิน:

- `/admin/products`
- `/admin/selection`
- `/admin/catalog`
- `/admin/settings`

หน้าเข้าสู่ระบบคือ `/admin/login`
