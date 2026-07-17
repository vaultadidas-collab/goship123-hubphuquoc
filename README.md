# 🛵 Goship123 — Siêu app Phú Quốc

> **Đặt đồ ăn · Xe ôm · Mua hộ** tại Phú Quốc — 1 file HTML duy nhất, không cần server, deploy thẳng lên GitHub Pages.

📞 **Hotline/Zalo:** 0775 218 017 (7:00–22:00) · Một sản phẩm của **Kodeeboyzz**

---

## ✨ Tính năng

| Nhóm | Chi tiết |
|---|---|
| 🍜 **Đặt đồ ăn** | 29+ quán thật trên Google Maps (rating thật), 9 danh mục, tìm kiếm theo quán/món, giỏ hàng, voucher `GIAM5K` & `FREESHIP` áp dụng thật |
| 🛵 **Xe ôm** | Giá cố định 13.000đ mở cửa + 5.500đ/km, tính tự động theo khu (Dương Đông, An Thới, Hàm Ninh...) |
| 🛍️ **Mua hộ** | Khách ứng tiền hàng + phí qua chuyển khoản — chống boom đơn, thừa hoàn thiếu bù |
| 🔒 **Ứng cọc VietQR** | QR chuyển khoản MB Bank tự sinh kèm số tiền + mã đơn đối chiếu (API img.vietqr.io, không cần key) |
| 💬 **Chốt đơn qua Zalo** | Nội dung đơn tự copy → mở thẳng chat Zalo, khách chỉ việc dán |
| 🔔 **Thông báo Telegram** | Mỗi đơn mới / tin nhắn GoBot tự bắn về Telegram của chủ shop (xem cấu hình bên dưới) |
| 🗺️ **Hành trình giao đơn** | Bản đồ OpenStreetMap: điểm lấy hàng → điểm giao GPS của khách, shipper 🛵 chạy mô phỏng, ETA theo km thật |
| 📍 **Ghim GPS** | Khách ghim vị trí giao/đón trên bản đồ, đơn gửi kèm link Google Maps cho tài xế |
| 🌦️ **Thời tiết 3 ngày** | API Open-Meteo (miễn phí, không key) cho toạ độ Phú Quốc |
| ⏰ **Đồng hồ thật** | Giờ/ngày tiếng Việt + chip ĐANG MỞ CỬA / ĐÓNG theo giờ hoạt động |
| 🤖 **GoBot** | Bot chat trả lời phí ship, cọc, voucher, giờ mở cửa, tuyển đối tác... |
| 💼 **Tuyển đối tác** | Quán/tài xế miễn phí; gói ghim bài trả phí (99k/tuần, 299k/tháng) |
| 🎨 **Giao diện** | Chủ đề Đỏ–Vàng–Xanh lá, nền sáng đổi màu, hiệu ứng đồ ăn rơi + lấp lánh, banner tự chạy, SEO + schema LocalBusiness |

## 🚀 Deploy lên GitHub Pages (2 phút)

1. Tạo repo mới trên GitHub (VD: `goship123`)
2. Đổi tên file `goship123-final.html` thành **`index.html`** rồi upload vào repo
3. Vào **Settings → Pages** → Source chọn `Deploy from a branch` → Branch `main` / thư mục `/ (root)` → **Save**
4. Chờ ~1 phút → app chạy tại `https://<username>.github.io/goship123/`

> Muốn gắn tên miền riêng: Settings → Pages → Custom domain, rồi trỏ CNAME của domain về `<username>.github.io`.

## ⚙️ Cấu hình (khối `CONFIG` đầu phần `<script>`)

```js
const CONFIG = {
  HOTLINE    : "0775218017",   // số hotline (nút gọi)
  ZALO_PHONE : "0775218017",   // Zalo nhận đơn
  BANK_ID    : "MB",           // Mã ngân hàng VietQR: MB, VCB, TCB, ACB...
  BANK_ACC   : "5524520420",   // Số tài khoản nhận cọc
  BANK_NAME  : "VO QUOC CUONG",// Tên chủ TK (không dấu)
  SHIP_FEE   : 15000,          // Ship đồ ăn nội khu
  DEP_RATE   : 0.30,           // Tỉ lệ cọc đồ ăn (30%)
  DEP_MIN    : 20000,          // Cọc tối thiểu
  OPEN_HOUR  : 7,              // Giờ mở cửa
  CLOSE_HOUR : 22,             // Giờ đóng cửa
  TG_BOT_TOKEN : "",           // 🔔 xem hướng dẫn Telegram bên dưới
  TG_CHAT_ID   : "",
};
```

### 🔔 Bật thông báo đơn mới qua Telegram

1. Mở Telegram, chat với **@BotFather** → gõ `/newbot` → đặt tên → nhận **BOT TOKEN**
2. Bấm **Start** trong chat với bot vừa tạo
3. Chat với **@userinfobot** để lấy **CHAT ID** của bạn
4. Điền 2 giá trị vào `TG_BOT_TOKEN` và `TG_CHAT_ID` → xong! Mỗi đơn mới sẽ reo trên Telegram ⚡

## 🍜 Chỉnh menu & giá

Menu nằm trong mảng `SHOPS`. Mỗi quán:

```js
{name:"Tên quán", area:"Dương Đông", cat:"Hải sản", rate:4.8, rc:"780 đánh giá",
 gm:"link Google Maps", dishes:[["Tên món", 50000], ...]},
```

- ⚠️ **Giá món hiện là giá tham khảo** — gọi từng quán chốt giá thật rồi sửa số.
- 📌 **Ghim quán trả phí lên top:** thêm `pin:true` vào quán đó → tự nhảy đầu danh sách + badge TÀI TRỢ.

## 🛵 Chỉnh giá xe ôm

```js
const BASE=13000, PER_KM=5500; // mở cửa + giá/km
```

Khoảng cách giữa các khu nằm trong bảng `KM` (km ước lượng — chỉnh thoải mái).

## 🧩 Tech stack

- HTML/CSS/JS thuần — **1 file duy nhất, zero build**
- [Leaflet](https://leafletjs.com) + OpenStreetMap (bản đồ, miễn phí)
- [VietQR](https://vietqr.io) image API (QR chuyển khoản, không cần key)
- [Open-Meteo](https://open-meteo.com) (thời tiết, không cần key)
- Telegram Bot API (thông báo đơn)
- Google Fonts: Baloo 2 + Be Vietnam Pro

## ⚠️ Lưu ý

- Đơn hàng lưu trong phiên trình duyệt của khách (không có server/database). Kênh nhận đơn thật = **Zalo + Telegram**.
- Hành trình giao đơn & vị trí shipper trên bản đồ là **mô phỏng dự kiến** theo khoảng cách GPS — tracking live thật cần backend (Firebase...), sẽ nâng cấp khi app đông khách.
- Rating quán lấy từ Google Maps tại thời điểm build; nên kiểm tra định kỳ.

## 🤝 Hệ sinh thái Kodeeboyzz

- 🏝️ [Kodeeboyzz.com](https://kodeeboyzz.com) — Du lịch Phú Quốc trọn gói
- 🛍️ [Kodeeboyzz Deals](https://vaultadidas-collab.github.io/hubvn-auth/) — Tổng hợp shop Shopee chính hãng
- ✈️ Hợp tác quán/tài xế: [t.me/Kodeeboyzz](https://t.me/Kodeeboyzz) · Zalo 0775 218 017

---

© 2026 Goship123 · Made with 🛵 in Phú Quốc by **Kodeeboyzz**
