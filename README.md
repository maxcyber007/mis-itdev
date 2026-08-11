# ระบบ MIS แผนกวิชาเทคโนโลยีสารสนเทศ วิทยาลัยเทคนิคเชียงใหม่

ระบบสารสนเทศเพื่อการจัดการ (MIS) สำหรับงานพัสดุและงานการเงินของแผนกวิชา
พัฒนาด้วย Next.js 14 (App Router) + Tailwind CSS + MySQL/MariaDB

## ความสามารถของระบบ

1. **เข้าสู่ระบบ (Login)** — ยืนยันตัวตนด้วยชื่อผู้ใช้/รหัสผ่าน เก็บ session เป็นคุกกี้ `HttpOnly` ที่ลงลายเซ็น HMAC อายุ 8 ชั่วโมง รหัสผ่านเก็บแบบ `scrypt` + salt
2. **แดชบอร์ด** — สรุปคำขอรออนุมัติ รายการยืมที่ยังไม่คืน/เกินกำหนด ยอดเงินจ่ายสะสม เงินยืมค้างล้างหนี้ พัสดุคงเหลือน้อย และรายการล่าสุด (ผู้ใช้ทั่วไปเห็นเฉพาะข้อมูลของตนเอง)
3. **จัดการผู้ใช้ 3 ระดับสิทธิ์**
   - `admin` ผู้ดูแลระบบ — จัดการผู้ใช้ทั้งหมด และทำได้ทุกอย่างที่เจ้าหน้าที่ทำได้
   - `staff` เจ้าหน้าที่ — อนุมัติ/ไม่อนุมัติคำขอ รับคืนพัสดุ จ่ายเงิน ล้างหนี้ และจัดการคลังพัสดุ
   - `user` ผู้ใช้ทั่วไป — ยื่นคำขอและดูสถานะเฉพาะคำขอของตนเอง
4. **งานพัสดุ** — ทะเบียนพัสดุ/ครุภัณฑ์พร้อมจำนวนคงเหลือ, คำขอ**เบิก** (ตัดสต๊อกเมื่ออนุมัติ) และคำขอ**ยืม-คืน** (ตัดสต๊อกเมื่ออนุมัติ คืนสต๊อกเมื่อรับคืน) พร้อมแจ้งเตือนรายการเกินกำหนดคืน
5. **งานการเงิน** — คำขอ**เบิกจ่าย** (รออนุมัติ → อนุมัติ → จ่ายเงิน) และ**ยืมเงินทดรอง** (เพิ่มขั้นล้างหนี้พร้อมบันทึกยอดใช้จริง) พร้อมสรุปยอดเงินและรายการเกินกำหนดล้างหนี้

## งานออกแบบส่วนติดต่อผู้ใช้

- **Tailwind CSS** พร้อมชุดสี `brand` (น้ำเงินคราม) และ `ink` (เทาอมน้ำเงิน) ที่กำหนดเองใน `tailwind.config.js`
- **ฟอนต์ Noto Sans Thai** โหลดผ่าน `next/font` รองรับภาษาไทยเต็มรูปแบบ
- **อนิเมชัน** กำหนดไว้ใน `tailwind.config.js` — เข้าฉากแบบไล่ลำดับ (`fade-up` + `stagger-*`), เมนูเลื่อนเข้า, แสงพื้นหลังเคลื่อนไหว (`aurora`), จุดสถานะกะพริบ (`pulse-ring`), โครงร่างระหว่างโหลด (`shimmer`) และการนับตัวเลขขึ้นบนการ์ดสรุป
- **ไอคอน** เป็น inline SVG ใน `src/components/Icons.js` ไม่ต้องพึ่งไลบรารีภายนอก
- **กล่องยืนยันและการแจ้งเตือน** ใช้คอมโพเนนต์ของระบบเอง (`Modal`, `ActionDialog`, `Toast`) แทน `window.confirm` / `window.alert`
- **รองรับทุกขนาดจอ** เมนูข้างยุบเป็นลิ้นชักบนมือถือ ตารางเลื่อนแนวนอนได้โดยตรึงคอลัมน์ปุ่มดำเนินการไว้ขวาสุด
- **เข้าถึงง่าย** มีวงแหวนโฟกัสชัดเจน, `aria-label` บนปุ่มไอคอน และเคารพการตั้งค่า `prefers-reduced-motion`

## การติดตั้งและใช้งาน

```bash
npm install
cp .env.example .env.local       # แล้วแก้ค่าให้ตรงกับฐานข้อมูลของคุณ
npm run dev                      # โหมดพัฒนา http://localhost:3000
npm run build && npm run start   # โหมดใช้งานจริง
```

เปิดเบราว์เซอร์ที่ http://localhost:3000 ระบบจะพาไปหน้าเข้าสู่ระบบ

### บัญชีตัวอย่าง (สร้างอัตโนมัติเมื่อรันครั้งแรก)

| ชื่อผู้ใช้ | รหัสผ่าน | สิทธิ์ |
| --- | --- | --- |
| `admin` | `admin1234` | ผู้ดูแลระบบ |
| `staff` | `staff1234` | เจ้าหน้าที่ |
| `user` | `user1234` | ผู้ใช้ทั่วไป |

> ก่อนนำไปใช้งานจริง ให้เปลี่ยนรหัสผ่านของบัญชีตัวอย่างทั้งหมด และตั้งค่า
> `AUTH_SECRET` ในไฟล์ `.env.local` เป็นค่าสุ่มที่ยาวพอ เช่น
> `AUTH_SECRET=$(openssl rand -hex 32)`

## ฐานข้อมูล

ระบบใช้ **MySQL / MariaDB** โดยจะ **สร้างฐานข้อมูล ตาราง และข้อมูลตั้งต้นให้อัตโนมัติ**
เมื่อเชื่อมต่อครั้งแรก จึงไม่ต้องนำเข้าไฟล์ `.sql` เองและไม่ต้องสร้างฐานข้อมูลล่วงหน้า
— ขอแค่มีผู้ใช้ MySQL ที่เชื่อมต่อได้ก็พอ

**ผู้ใช้ที่ใช้เชื่อมต่อต้องมีสิทธิ์ `CREATE`** เพื่อให้สร้างฐานข้อมูล/ตารางเองได้:

```sql
CREATE USER 'mis_user'@'%' IDENTIFIED BY 'รหัสผ่านของคุณ';
GRANT ALL PRIVILEGES ON mis_cmtc.* TO 'mis_user'@'%';
GRANT CREATE ON *.* TO 'mis_user'@'%';
FLUSH PRIVILEGES;
```

> ถ้าไม่สะดวกให้สิทธิ์ `CREATE` แบบกว้าง (เช่นนโยบายองค์กรไม่อนุญาต) ให้สร้างฐานข้อมูล
> เปล่าไว้ล่วงหน้าเอง (`CREATE DATABASE mis_cmtc CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`)
> แล้ว `GRANT ALL PRIVILEGES ON mis_cmtc.* TO 'mis_user'@'%';` ก็เพียงพอ — ระบบจะสร้างแค่ตารางต่อจากนั้น

ตารางที่ระบบสร้างให้: `users`, `supply_items`, `supply_requests`, `finance_requests`, `counters`

- `src/lib/db.js` — connection pool, การสร้างตาราง, ทรานแซกชัน และการออกเลขที่เอกสาร
- `src/lib/store.js` — คำสั่งอ่าน/เขียนข้อมูลของแต่ละโมดูล

ขั้นตอนที่ต้องอ่านแล้วเขียนแบบอะตอมมิก (อนุมัติคำขอที่ต้องตัดสต๊อก และการออกเลขที่เอกสาร)
ทำงานภายในทรานแซกชันที่ล็อกแถวด้วย `SELECT ... FOR UPDATE` จำนวนคงเหลือจึงไม่ติดลบ
และเลขที่เอกสารไม่ซ้ำ แม้มีคำขอเข้ามาพร้อมกันหลายรายการ

### สิ่งที่ระบบต้องการ

| ตัวแปร | ค่าเริ่มต้น | คำอธิบาย |
| --- | --- | --- |
| `DB_HOST` | `127.0.0.1` | โฮสต์ฐานข้อมูล (ใน Docker ใช้ชื่อ container ของ MySQL) |
| `DB_PORT` | `3306` | พอร์ตฐานข้อมูล |
| `DB_USER` / `DB_PASSWORD` | `root` / ว่าง | บัญชีที่ใช้เชื่อมต่อ |
| `DB_NAME` | `mis_cmtc` | ชื่อฐานข้อมูล |
| `DB_POOL_SIZE` | `10` | จำนวน connection สูงสุดใน pool |
| `AUTH_SECRET` | *(ต้องกำหนดเอง)* | ค่าลับสำหรับลงลายเซ็น session |
| `SEED_*_PASSWORD` | ดูตารางบัญชีตัวอย่าง | รหัสผ่านตั้งต้น ใช้ตอนสร้างฐานข้อมูลครั้งแรกเท่านั้น |

## การใช้งานด้วย Docker / Portainer

ระบบมาพร้อม `Dockerfile` (multi-stage, Next.js standalone, รันด้วยผู้ใช้ที่ไม่ใช่ root)
และ compose สองแบบ

### แบบที่ 1 — ใช้ MySQL container ที่มีอยู่แล้ว (`docker-compose.yml`)

1. หาเครือข่ายที่ MySQL container ของคุณใช้อยู่

   ```bash
   docker inspect <ชื่อ container ของ mysql> -f '{{json .NetworkSettings.Networks}}'
   ```

2. ใน Portainer: **Stacks → Add stack → Repository** ชี้มาที่ repo นี้
   (หรือเลือก Web editor แล้ววางเนื้อหาไฟล์ `docker-compose.yml`)

3. กรอกในช่อง **Environment variables** ของ Stack

   | ตัวแปร | ตัวอย่าง |
   | --- | --- |
   | `MIS_NETWORK` | ชื่อเครือข่ายจากขั้นตอนที่ 1 เช่น `docker_default` |
   | `DB_HOST` | ชื่อ container ของ MySQL เช่น `mysql` |
   | `DB_USER` / `DB_PASSWORD` / `DB_NAME` | ตามที่สร้างไว้ |
   | `AUTH_SECRET` | ผลลัพธ์จาก `openssl rand -hex 32` |
   | `APP_PORT` | พอร์ตบนโฮสต์ เช่น `3000` |

4. กด **Deploy the stack** แล้วเปิด `http://<ไอพีเซิร์ฟเวอร์>:3000`

> ถ้า MySQL ไม่ได้อยู่ในเครือข่าย Docker (เช่น ติดตั้งบนโฮสต์โดยตรง)
> ให้ลบบล็อก `networks:` ทั้งหมดออกจาก compose แล้วตั้ง `DB_HOST` เป็นไอพีของโฮสต์
> หรือ `host.docker.internal` พร้อมเพิ่ม `extra_hosts: ["host.docker.internal:host-gateway"]`

### แบบที่ 2 — รันพร้อมฐานข้อมูลในสแตกเดียว (`docker-compose.standalone.yml`)

ใช้เมื่อยังไม่มี MySQL container โดยจะสร้าง MariaDB 11 พร้อม volume ให้ด้วย

```bash
docker compose -f docker-compose.standalone.yml up -d
```

### ตรวจสอบสถานะ

ทั้งสองแบบมี healthcheck ที่เรียก `GET /api/health` — ตอบ `200` เมื่อเชื่อมต่อฐานข้อมูลได้
และ `503` เมื่อเชื่อมต่อไม่ได้ Portainer จึงแสดงสถานะ healthy/unhealthy ได้ถูกต้อง
เมื่อฐานข้อมูลกลับมา ระบบจะเชื่อมต่อใหม่เองโดยไม่ต้อง restart container

### แก้ปัญหา "เชื่อมต่อฐานข้อมูลไม่ได้"

เรียก `curl http://<โฮสต์>:<APP_PORT>/api/health` เพื่อดูรหัสข้อผิดพลาดที่ชัดเจน แล้วดูตารางนี้:

| รหัส | สาเหตุที่พบบ่อย |
| --- | --- |
| `ECONNREFUSED` / `ETIMEDOUT` | **`DB_HOST` หรือ `DB_PORT` ไม่ถูกต้อง** — สาเหตุที่พบบ่อยที่สุดเวลาต่อระหว่าง container: ใช้พอร์ตที่ map ออกสู่โฮสต์ (เช่น `3308`) แทนที่จะเป็นพอร์ตภายในของ container ฐานข้อมูล (ปกติคือ `3306` เสมอ ไม่ว่าจะ map ออกไปพอร์ตอะไร) และ `mis-app` ต้องอยู่ใน Docker network เดียวกับ MySQL container (ดู `MIS_NETWORK`) |
| `ENOTFOUND` | หา `DB_HOST` ไม่เจอ — ตรวจชื่อ container ให้ตรง หรือยังไม่ได้อยู่เครือข่ายเดียวกัน |
| `ER_ACCESS_DENIED_ERROR` / `ER_DBACCESS_DENIED_ERROR` | ชื่อผู้ใช้/รหัสผ่านผิด หรือผู้ใช้ไม่มีสิทธิ์ `CREATE`/`ALL PRIVILEGES` ตามหัวข้อฐานข้อมูลด้านบน |
| `ER_BAD_DB_ERROR` | สร้างฐานข้อมูลอัตโนมัติไม่สำเร็จ (มักมาคู่กับ access denied) |

## โครงสร้างโปรเจกต์

```
src/
├── app/
│   ├── login/page.js                  หน้าเข้าสู่ระบบ
│   ├── dashboard/
│   │   ├── layout.js                  โครงหน้าหลังเข้าสู่ระบบ (ตรวจสิทธิ์ฝั่งเซิร์ฟเวอร์)
│   │   ├── page.js                    แดชบอร์ด
│   │   ├── users/page.js              จัดการผู้ใช้ (เฉพาะผู้ดูแลระบบ)
│   │   ├── supplies/page.js           งานพัสดุ: คำขอเบิก/ยืม และคลังพัสดุ
│   │   └── finance/page.js            งานการเงิน: เบิกจ่าย/ยืมเงิน
│   └── api/                           Route Handlers (auth, users, supplies, finance, dashboard)
├── components/
│   ├── Shell.js                       เมนูข้าง + แถบบน
│   ├── Modal.js, ActionDialog.js      โมดัลและกล่องยืนยันการทำรายการ
│   ├── Toast.js                       แถบแจ้งเตือน
│   ├── StatCard.js, StatusBadge.js    การ์ดตัวเลข (นับขึ้น) และป้ายสถานะ
│   ├── Icons.js                       ชุดไอคอน inline SVG
│   └── ui.js                          PageHeader, SearchInput, Skeleton, EmptyState, Pill
├── lib/
│   ├── auth.js                        เข้ารหัสรหัสผ่านและ session token
│   ├── session.js                     อ่าน session และตรวจสิทธิ์ของ API
│   ├── db.js                          connection pool, สร้างตาราง, ทรานแซกชัน
│   ├── store.js                       คำสั่งอ่าน/เขียนข้อมูลของแต่ละโมดูล
│   ├── labels.js                      ป้ายกำกับภาษาไทยและการจัดรูปแบบ
│   └── constants.js                   ค่าคงที่ที่ใช้ได้ใน Edge middleware
└── middleware.js                      กันการเข้าถึง /dashboard เมื่อยังไม่เข้าสู่ระบบ

tailwind.config.js                     ชุดสี เงา และอนิเมชันของระบบ
Dockerfile                             อิมเมจสำหรับใช้งานจริง (multi-stage)
docker-compose.yml                     สแตกสำหรับ Portainer (ใช้ MySQL ที่มีอยู่แล้ว)
docker-compose.standalone.yml          สแตกที่มาพร้อม MariaDB ในตัว
.env.example                           รายการตัวแปรสภาพแวดล้อมทั้งหมด
```

## สรุป API

| Method | Endpoint | สิทธิ์ |
| --- | --- | --- |
| GET | `/api/health` | ทุกคน (ใช้โดย healthcheck) |
| POST | `/api/auth/login` `/api/auth/logout` | ทุกคน |
| GET | `/api/auth/me` | ผู้เข้าสู่ระบบ |
| GET | `/api/dashboard` | ผู้เข้าสู่ระบบ (ผู้ใช้ทั่วไปเห็นเฉพาะของตน) |
| GET / POST | `/api/users` | admin |
| PATCH / DELETE | `/api/users/[id]` | admin |
| GET | `/api/supplies/items` | ผู้เข้าสู่ระบบ |
| POST | `/api/supplies/items` · PATCH / DELETE `/api/supplies/items/[id]` | admin, staff |
| GET / POST | `/api/supplies/requests` | ผู้เข้าสู่ระบบ |
| PATCH | `/api/supplies/requests/[id]` | `approve`/`reject`/`return`: admin, staff · `cancel`: เจ้าของคำขอ |
| GET / POST | `/api/finance/requests` | ผู้เข้าสู่ระบบ |
| PATCH | `/api/finance/requests/[id]` | `approve`/`reject`/`pay`/`settle`: admin, staff · `cancel`: เจ้าของคำขอ |
