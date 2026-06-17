-- JE BAR Catalog Production V1

create extension if not exists "uuid-ossp";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'staff' check (role in ('owner', 'staff')),
  created_at timestamptz default now()
);

create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  name_th text not null,
  name_en text not null,
  sort_order int default 0,
  is_active boolean default true
);

insert into categories (code, name_th, name_en, sort_order)
values
('CAKE', 'เค้ก', 'Cake', 1),
('BREAD', 'ขนมปัง', 'Bread', 2),
('COOKIES_SNACKS', 'คุกกี้ / Snack', 'Cookies & Snacks', 3),
('OTHERS', 'สินค้าอื่นๆ', 'Others', 4)
on conflict (code) do nothing;

create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  name_th text not null,
  name_en text,
  category_code text references categories(code),
  price numeric(10,2) not null default 0,
  description_th text,
  description_en text,
  promotion_th text,
  promotion_en text,
  original_image_url text,
  web_image_url text,
  catalog_image_url text,
  is_favorite boolean default false,
  is_active boolean default true,
  sort_order int default 0,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists daily_selections (
  id uuid primary key default uuid_generate_v4(),
  selection_date date not null default current_date,
  product_id uuid references products(id) on delete cascade,
  quantity int default 0,
  is_available boolean default false,
  sort_order int default 0,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(selection_date, product_id)
);

create table if not exists settings (
  id int primary key default 1,
  shop_name text default 'JE BAR Coffee & Pastry',
  customer_title_th text default 'ขนมพร้อมเสิร์ฟวันนี้',
  customer_title_en text default 'Today Available Selection',
  line_url text default 'https://lin.ee/t8QoAix',
  messenger_url text default 'https://m.me/102339796492016',
  catalog_url text default 'https://catalog.jebar.app',
  welcome_message_th text,
  order_received_message_th text,
  updated_at timestamptz default now()
);

insert into settings (id, welcome_message_th, order_received_message_th)
values (
  1,
  'สวัสดีค่ะ 😊

เฌอบาร์ยินดีให้บริการค่ะ

วันนี้มีขนม เค้ก และเบเกอรี่พร้อมเสิร์ฟหลายรายการเลยนะคะ 💛

สามารถเลือกสินค้าที่ต้องการ แล้วส่งรายการกลับมาให้ทางร้านตรวจสอบได้เลยค่ะ

ขอให้สนุกกับการเลือกขนมนะคะ 😊',
  'ขอบคุณค่ะ 😊

ทางร้านได้รับรายการเรียบร้อยแล้วนะคะ

กำลังตรวจสอบสินค้า และจะรีบตอบกลับเพื่อยืนยันรายการให้อีกครั้งค่ะ 💛

ขอบคุณมากนะคะ

JE BAR Coffee & Pastry'
)
on conflict (id) do nothing;

alter table profiles enable row level security;
alter table products enable row level security;
alter table daily_selections enable row level security;
alter table settings enable row level security;

-- Basic authenticated access for Owner + Staff
create policy "profiles read own" on profiles for select using (auth.uid() = id);
create policy "products auth all" on products for all using (auth.role() = 'authenticated');
create policy "daily selections auth all" on daily_selections for all using (auth.role() = 'authenticated');
create policy "settings auth read" on settings for select using (true);
create policy "settings auth update" on settings for update using (auth.role() = 'authenticated');

-- Public catalog read access
create policy "products public read active" on products for select using (is_active = true);
create policy "daily selections public read" on daily_selections for select using (is_available = true);
