# Wedding — เว็บการ์ดเชิญ + RSVP

เว็บการ์ดเชิญงานแต่ง (HTML/CSS/JS ล้วน ไม่ต้อง build) แบ่งเป็นสี่หน้าตามแบบ Canva

| หน้า | ไฟล์ | มีอะไร |
|---|---|---|
| 1. Welcome | `welcome.html` | ซองจดหมายพร้อมตราครั่ง กดซองแล้วฝาซองเปิดและไปหน้า home |
| 2. Home | `home.html` | ชื่อ วันงาน นับถอยหลัง ปุ่มไปหน้า details และ RSVP |
| 3. Details | `details.html` | กำหนดการ Dress code สถานที่ + Google Maps |
| 4. RSVP | `rsvp.html` | ฟอร์มตอบรับ ส่งเข้า Google Sheets ได้ |

`index.html` พาไปหน้า welcome อัตโนมัติ (ลิงก์หลักของเว็บ)

ทุกหน้าใช้ `config.js` · `script.js` · `styles.css` ร่วมกัน และรองรับมือถือ

## แก้เนื้อหา

แก้ที่ [`config.js`](./config.js) ไฟล์เดียว

## เปิดดูบนเครื่อง

```bash
npx --yes serve .
```

หรือดับเบิลคลิก `index.html` ก็ได้

## ต่อฟอร์ม RSVP เข้า Google Sheets

1. สร้าง Google Sheet ใหม่ แถวแรกใส่หัวคอลัมน์: `timestamp | name | attending | guests | contact`
   (ตอบว่าไม่มา ช่อง `guests` จะว่าง)
2. เมนู **Extensions → Apps Script** แล้ววางโค้ดนี้

   ```js
   function doPost(e) {
     const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
     const p = e.parameter;
     sheet.appendRow([new Date(), p.name, p.attending, p.guests || "", p.contact]);
     return ContentService.createTextOutput("ok");
   }
   ```

3. **Deploy → New deployment → Web app** · Execute as: *Me* · Who has access: *Anyone*
4. คัดลอก URL ที่ได้ไปใส่ `rsvpEndpoint` ใน `config.js`

> ฟอร์มส่งแบบ `no-cors` จึงอ่านผลตอบกลับไม่ได้ — ตรวจข้อมูลที่เข้ามาใน Sheet อีกครั้งหลังทดสอบ

## เผยแพร่ — ปล่อยทีละ version

เว็บจริงอยู่ที่ <https://panasb.github.io/wedding/> · GitHub Pages ดึงจาก branch **`release`** ไม่ใช่ `main`

| branch | ใช้ทำอะไร |
|---|---|
| `main` | งานที่กำลังปรับ · push ได้ทุกเมื่อ เว็บจริงไม่เปลี่ยน |
| `release` | รุ่นที่ปล่อยแล้ว · ขยับเฉพาะตอนออก version ใหม่ |

ขั้นตอนออก version ใหม่ (ตัวอย่าง `v1.1.0`):

```bash
git tag -a v1.1.0 -m "v1.1.0 — สรุปสิ่งที่เปลี่ยน"
git push origin v1.1.0
git push origin v1.1.0^{commit}:release
gh release create v1.1.0 --title "v1.1.0" --notes "สรุปสิ่งที่เปลี่ยน"
```

GitHub Pages จะ build ใหม่ภายในประมาณหนึ่งนาทีหลัง `release` ขยับ
