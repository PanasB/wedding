# Wedding — เว็บการ์ดเชิญ + RSVP

เว็บการ์ดเชิญงานแต่ง (HTML/CSS/JS ล้วน ไม่ต้อง build) แบ่งเป็นสามหน้าตามแบบ Canva

| หน้า | ไฟล์ | มีอะไร |
|---|---|---|
| 1. จดหมาย | `index.html` | ซองจดหมายพร้อมตราครั่ง กดซองแล้วฝาซองเปิดและไปหน้าข้อมูล |
| 2. ข้อมูล | `details.html` | ชื่อ วันงาน นับถอยหลัง กำหนดการ Dress code สถานที่ + Google Maps |
| 3. RSVP | `rsvp.html` | ฟอร์มตอบรับ ส่งเข้า Google Sheets ได้ |

ทุกหน้าใช้ `config.js` · `script.js` · `styles.css` ร่วมกัน และรองรับมือถือ

## แก้เนื้อหา

แก้ที่ [`config.js`](./config.js) ไฟล์เดียว — ค่าที่มีตอนนี้เป็นตัวอย่างทั้งหมด

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

## เผยแพร่

- **GitHub Pages** — repo แบบ private ใช้ Pages ได้เฉพาะบัญชี GitHub Pro ขึ้นไป
  (ไม่งั้นต้องเปลี่ยน repo เป็น public)
- หรือใช้ Netlify / Vercel / Cloudflare Pages ซึ่งต่อ private repo ได้ฟรี
