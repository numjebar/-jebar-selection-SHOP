export type MessageSettings = {
  welcomeMessage: string
  sendToCustomerMessage: string
  orderReceivedMessage: string
}

export const messageSettingsStorageKey = 'jebar.messages.v1'

export const defaultMessageSettings: MessageSettings = {
  welcomeMessage: `สวัสดีค่ะ 😊

เฌอบาร์ยินดีให้บริการค่ะ

วันนี้มีขนม เค้ก และเบเกอรี่พร้อมเสิร์ฟหลายรายการเลยนะคะ 💛

สามารถเลือกสินค้าที่ต้องการ แล้วส่งรายการกลับมาให้ทางร้านตรวจสอบได้เลยค่ะ

ขอให้สนุกกับการเลือกขนมนะคะ 😊`,
  sendToCustomerMessage: `สวัสดีค่ะ วันนี้ JE BAR มีขนมพร้อมเสิร์ฟแล้วนะคะ
ดูรายการและจองได้ที่นี่: {catalogUrl}

ถ้าต้องการรายการไหน แจ้งจำนวนกลับมาได้เลยค่ะ`,
  orderReceivedMessage: `ขอบคุณค่ะ 😊

ทางร้านได้รับรายการเรียบร้อยแล้วนะคะ

กำลังตรวจสอบสินค้า และจะรีบตอบกลับเพื่อยืนยันรายการให้อีกครั้งค่ะ 💛

ขอบคุณมากนะคะ

JE BAR Coffee & Pastry`
}
