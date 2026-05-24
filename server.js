const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 3000;

app.use(express.json());

// 📁 เปิดให้เซิร์ฟเวอร์เข้าถึงไฟล์ทั้งหมดในโฟลเดอร์ปัจจุบันที่สั่งรัน node
app.use(express.static(__dirname));

// 💾 API สำหรับดึงข้อมูลและบันทึกบ้านหลังใหม่ลงไฟล์ houses.kml ที่อยู่โฟลเดอร์เดียวกัน
app.post("/api/add-house", (req, res) => {
    const { name, lat, lng } = req.body;

    // 🎯 แก้ให้ชี้ไปที่ houses.kml ในโฟลเดอร์ปัจจุบันตรงๆ ไม่ต้องเข้าโฟลเดอร์ซ้อน
    const kmlPath = path.join(__dirname, "houses.kml");

    // 1. อ่านข้อมูลไฟล์ KML
    fs.readFile(kmlPath, "utf8", (err, data) => {
        if (err) {
            console.error("หาไฟล์ไม่เจอที่พาธ:", kmlPath);
            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "ไม่พบไฟล์ houses.kml ในโฟลเดอร์ปัจจุบัน กรุณาตรวจสอบชื่อไฟล์อีกครั้งครับ",
                });
        }

        // 2. สร้างโครงสร้างป้ายหมุดหลังใหม่
        const newPlacemark = `  <Placemark>
    <name>${name}</name>
    <ExtendedData>
      <Data name="address"><value></value></Data>
    </ExtendedData>
    <Point>
      <coordinates>${lng},${lat}</coordinates>
    </Point>
  </Placemark>\n</Document>`;

        // 3. ทำการแทนที่คำว่า </Document> ตัวท้ายสุดเพื่อต่อท้ายข้อมูล
        if (data.includes("</Document>")) {
            const updatedKml = data.replace("</Document>", newPlacemark);

            // 4. บันทึกเขียนทับลงไฟล์เดิม
            fs.writeFile(kmlPath, updatedKml, "utf8", (writeErr) => {
                if (writeErr) {
                    return res
                        .status(500)
                        .json({
                            success: false,
                            message: "เกิดข้อผิดพลาดในการเขียนเซฟไฟล์ KML",
                        });
                }
                console.log(
                    `[บันทึกสำเร็จ] เพิ่มบ้านเลขที่ ${name} ลงไฟล์ KML เรียบร้อยแล้ว`,
                );
                return res.json({
                    success: true,
                    message: `บันทึกบ้านเลขที่ ${name} สำเร็จ!`,
                });
            });
        } else {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "โครงสร้างไฟล์ KML ไม่ถูกต้อง (ไม่พบแท็ก </Document>)",
                });
        }
    });
});

app.listen(PORT, () => {
    console.log(
        `================================================================`,
    );
    console.log(
        `🚀 เซิร์ฟเวอร์เปิดใช้งานแล้ว! ลิงก์เข้าใช้งาน: http://localhost:${PORT}`,
    );
    console.log(`📂 อ่าน-เขียนไฟล์สำเร็จจากโฟลเดอร์ปัจจุบันโดยตรง`);
    console.log(
        `================================================================`,
    );
});
