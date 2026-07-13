# Portfolio — Nguyễn Mạnh Hưng

Website portfolio 3 trang cho Kỹ sư Môi trường / PMO Manager. HTML/CSS/JS thuần, hiệu ứng bằng **GSAP + ScrollTrigger**, dữ liệu dự án quản lý qua file JSON.

## Cấu trúc

```
portfolio/
├── index.html         # Trang 1 — Trang chủ (giới thiệu, dự án nổi bật, dịch vụ)
├── work.html          # Trang 2 — Dự án (thẻ mở rộng, lọc theo loại)
├── contact.html       # Trang 3 — Liên hệ (thông tin + form gửi qua email)
├── data/
│   └── projects.json  # ★ NGUỒN DỮ LIỆU CHÍNH (sửa ở đây)
└── assets/
    ├── css/
    │   ├── style.css  # Design system (font, màu, nav, footer, nút)
    │   └── pages.css  # Style riêng từng trang (hero, thẻ dự án, form)
    ├── js/
    │   ├── data.js    # Bản sao của projects.json cho trình duyệt (xem bên dưới)
    │   ├── icons.js   # Thư viện icon SVG
    │   └── main.js    # GSAP animation, nav, reveal, chuyển trang
    └── img/
        └── avatar.jpg # Ảnh đại diện
```

## Chạy website

**Cách 1 — Mở trực tiếp:** nhấp đúp vào `index.html`. Website chạy được ngay vì dữ liệu nạp qua `assets/js/data.js` (không cần server).

**Cách 2 — Chạy bằng server (khuyến nghị khi phát triển):**
- VS Code: cài extension **Live Server**, chuột phải `index.html` → *Open with Live Server*.
- Hoặc bất kỳ static server nào (Netlify, Vercel, GitHub Pages...). Chỉ cần đẩy toàn bộ thư mục lên là xong.

## ✏️ Sửa dữ liệu dự án

Tất cả nội dung (thông tin cá nhân, dịch vụ, kinh nghiệm, học vấn, **danh sách dự án**) nằm trong **`data/projects.json`**.

> **QUAN TRỌNG:** Trình duyệt khi mở file trực tiếp (`file://`) không đọc được `.json`, nên website đọc từ `assets/js/data.js` — đây là bản sao của `projects.json` được bọc trong `window.PORTFOLIO_DATA = {...}`.
>
> **Sau khi sửa `projects.json`, phải cập nhật lại `data.js`** bằng một trong hai cách:
>
> - **Thủ công:** mở `assets/js/data.js`, thay toàn bộ phần trong `{ ... }` bằng nội dung mới của `projects.json` (giữ nguyên dòng `window.PORTFOLIO_DATA = ` ở đầu và `;` ở cuối).
> - **Bằng lệnh** (Git Bash / máy có coreutils):
>   ```bash
>   printf 'window.PORTFOLIO_DATA = ' > assets/js/data.js && cat data/projects.json >> assets/js/data.js && printf ';\n' >> assets/js/data.js
>   ```
>
> *(Nếu deploy qua server có hỗ trợ `fetch` JSON, có thể bỏ `data.js` và sửa `main.js` để `fetch('data/projects.json')` — nhưng cách hiện tại chạy được ở mọi nơi.)*

### Thêm một dự án mới

Thêm một object vào mảng `projects` trong `projects.json`:

```json
{
  "id": "ma-du-an-khong-dau-cach",
  "featured": false,
  "name": "Tên dự án",
  "category": "Vận Hành",
  "location": "Hà Nội",
  "capacity": "350 m³/ngđ",
  "period": "2023 — Nay",
  "role": "Kỹ Sư Vận Hành",
  "summary": "Mô tả ngắn hiển thị khi thẻ đóng.",
  "detail": {
    "role":     "Vai trò của tôi trong dự án...",
    "problem":  "Vấn đề của dự án...",
    "solution": "Giải pháp thực hiện...",
    "result":   "Kết quả và nghiệm thu..."
  }
}
```

- `category` dùng để **lọc**: chứa chữ `Vận Hành` / `Giám Sát` / `Quản Lý`.
- `featured: true` → thẻ có nhãn "Dự án trọng điểm" và viền xanh.
- Dự án gói thầu O&M dùng thêm mảng `plants` (danh sách nhà máy con) — xem dự án `goi-thau-om-quang-ninh` làm mẫu.
- Trang chủ tự lấy **6 dự án đầu tiên** làm mục "Dự án nổi bật".

## 🎨 Tuỳ chỉnh giao diện

- **Màu accent:** đổi `--accent: #0072B9;` trong `assets/css/style.css` (`:root`).
- **Font:** display = Montserrat, nội dung = Roboto, đoạn văn = Inter (light). Đổi ở `:root` và thẻ `<link>` Google Fonts trong `<head>`.
- **Thông tin liên hệ / email nhận form:** sửa trong `projects.json` (mục `contact`) và các link `tel:`/`mailto:` trong 3 file HTML; email nhận form nằm ở biến `TO` trong phần `<script>` của `contact.html`.

## Tính năng

- ✅ Hiệu ứng GSAP: S-line curve vẽ theo scroll, entrance/reveal cho ảnh và thẻ, đếm số, chuyển trang mượt, nút nam châm, con trỏ tuỳ biến.
- ✅ Thẻ dự án bấm để mở rộng (vai trò / vấn đề / giải pháp / kết quả), lọc theo loại công việc.
- ✅ Liên kết sâu: bấm dự án ở trang chủ → mở đúng thẻ đó ở trang Dự án (`work.html#id`).
- ✅ Form liên hệ có kiểm tra hợp lệ, gửi qua ứng dụng email (`mailto:`).
- ✅ Responsive điện thoại/máy tính, tôn trọng `prefers-reduced-motion` (tắt hiệu ứng cho người cần).
