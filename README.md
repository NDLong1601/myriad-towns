# Myriad Towns

Game city builder gốc chạy trên trình duyệt: thế giới sinh thủ tục vô hạn, công trình nâng cấp hoặc suy thoái theo
những gì nằm trong bán kính quanh nó. Chơi được trên máy (local) và deploy tĩnh lên GitHub Pages.

> Trạng thái: **M4** (tiến trình). Màn hình ván mới với hai chế độ: **Mục tiêu** (5 chương, phần thưởng, chọn 1 trong 2 gói công trình) và **Sandbox**. Công trình theo biome, di tích thưởng khi khám phá. **Nhiều thị trấn**: Toà thị chính lập thị trấn mới (cần Hiến chương), lãnh thổ lớn dần theo dân số, thị trấn ở xa camera chỉ chạy tóm tắt cho nhẹ. Có hướng dẫn cho người mới.

## Điều khiển

| Thao tác                              | Việc                                 |
| ------------------------------------- | ------------------------------------ |
| Kéo chuột trái / WASD / phím mũi tên  | Di chuyển (giữ Shift để nhanh)       |
| Kéo chuột phải                        | Xoay và nghiêng                      |
| Q / E                                 | Xoay 90°                             |
| R / F                                 | Nghiêng lên / xuống                  |
| Cuộn chuột                            | Zoom                                 |
| Cảm ứng: 1 ngón kéo, 2 ngón chụm/xoay | Di chuyển, zoom, xoay                |
| Space                                 | Tạm dừng / chạy tiếp                 |
| 1–9, 0                                | Bật/tắt bản đồ nhiệt một trường      |
| P                                     | Chế độ quy hoạch (bản nháp miễn phí) |
| X / Esc / Ctrl+Z / Ctrl+Y             | Phá / huỷ / hoàn tác / làm lại       |
| Bấm vào công trình                    | Xem trạng thái và "Vì sao?"          |

## Chạy trên máy (Windows / macOS / Linux)

Cần **Node.js 22** trở lên (https://nodejs.org).

```bash
npm install          # lần đầu
npm run dev          # mở http://localhost:5173
```

Tham số URL:

- `?seed=hanoi` đổi thế giới (cùng seed luôn ra cùng thế giới)
- `?speed=0|1|2|4` tốc độ lúc mở game, `?sandbox=1` mở khoá mọi công trình
- `&x=1000000&z=-500` bắt đầu tại ô bất kỳ
- `&r=4` bán kính hiển thị (chunk), giảm nếu máy yếu

## Lệnh thường dùng

| Lệnh                                                                      | Việc                                                           |
| ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `npm run dev`                                                             | Server phát triển, tự reload                                   |
| `npm run check`                                                           | Lint + typecheck + kiểm dữ liệu + unit test + build (giống CI) |
| `npm test`                                                                | Unit test (Vitest)                                             |
| `npx playwright install chromium` rồi `npm run build && npm run test:e2e` | Smoke test trên trình duyệt                                    |
| `npm run build` rồi `npm run preview`                                     | Thử bản production tại http://localhost:4173                   |

## Deploy lên GitHub Pages

1. Tạo repo trên GitHub (ví dụ `myriad-towns`) và push nhánh `main`.
2. Vào **Settings → Pages → Build and deployment → Source** chọn **GitHub Actions**.
3. Mỗi lần push lên `main`, workflow `deploy.yml` build và đăng tại `https://<tài-khoản>.github.io/myriad-towns/`.

## Làm việc với nhiều agent

Quy ước chung cho Claude Code và Antigravity nằm trong [AGENTS.md](AGENTS.md). Việc giao cho agent viết thành
task spec trong [docs/tasks/](docs/tasks/), bắt đầu từ [\_TEMPLATE.md](docs/tasks/_TEMPLATE.md).

## Giấy phép

Mã nguồn: chưa chọn (xem `LICENSE` khi có). Asset bên thứ ba ghi trong `CREDITS.md`.
