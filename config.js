/**
 * ข้อมูลงานแต่ง — แก้ไฟล์นี้ไฟล์เดียวก็เปลี่ยนเนื้อหาทั้งหน้าได้
 * ข้อมูลชุดนี้ยกมาจากแบบการ์ดใน Canva
 */
window.WEDDING = {
  // ชื่อเล่น เรียงตามแบบใน Canva — ใช้บนหัวการ์ดและตราครั่ง
  names: ["Fang", "Frank"],
  fullNames: "Pangkaew and Waratat",

  // รูปแบบ ISO: YYYY-MM-DDTHH:mm:ss+07:00 (เวลาไทย) — ใช้นับถอยหลัง
  date: "2027-11-28T15:00:00+07:00",
  dateText: "วันอาทิตย์ที่ 28 พฤศจิกายน 2570",
  greeting: "Time to Celebrate",

  schedule: [
    { time: "15:30", title: "พิธีขันหมาก · พิธีหมั้น" },
    { time: "16:09", title: "ไหว้ผู้ใหญ่" },
    { time: "17:09", title: "หลั่งน้ำพระพุทธมนต์" },
    { time: "18:30", title: "ฉลองมงคลสมรส" },
    { time: "19:00", title: "ดนตรี" },
    { time: "20:00", title: "Champagne" },
    { time: "22:00", title: "เดินทางกลับบ้าน" },
  ],

  venue: {
    name: "Rylyn Garden",
    address: "55 หมู่ที่ 7 ซอยสุขาประชาสรรค์ 2 ตำบลบางพูด อำเภอปากเกร็ด นนทบุรี 11120",
    mapUrl: "https://maps.app.goo.gl/PkL8GgZwQ2kZ1cRt9",
  },

  // สีของ Dress code ตามจุดสีในแบบ Canva
  dressCode: [
    { name: "แดงเลือดหมู", color: "#892324" },
    { name: "เขียวมะกอก", color: "#626c1d" },
    { name: "ฟ้า", color: "#5d82b0" },
    { name: "ขาว", color: "#ffffff" },
  ],

  rsvpMessage:
    "เรารอคอยที่จะได้เฉลิมฉลองวันสำคัญนี้ร่วมกับคุณ โปรดแจ้งให้เราทราบว่าคุณจะมาร่วมเป็นส่วนหนึ่งในความทรงจำแสนพิเศษของเราหรือไม่",
  rsvpDeadline: "20 กันยายน 2570",

  // URL ปลายทางของฟอร์ม RSVP (เช่น Google Apps Script Web App — ดู README)
  // ค่าว่าง = ฟอร์มยังไม่เปิดรับ และหน้าเว็บจะแจ้งผู้ใช้ตามนั้น
  rsvpEndpoint: "",
};
