# TikTok Lark Analytics

Dashboard Next.js 15 tổng hợp dữ liệu TikTok từ Lark Base qua Cloudflare Functions. Trình duyệt chỉ gọi `/api/*`.

## Setup

Yêu cầu Node.js 20+ và một Lark Custom App có quyền đọc Base. Trong Lark Developer Console, cấp quyền `bitable:app:readonly`, phát hành app và cho app quyền truy cập Base.

```bash
npm install
copy .env.example .env.local
```

Điền App ID và App Secret vào `.env.local`.

## Environment Variables

- `LARK_APP_ID`: App ID của Lark Custom App.
- `LARK_APP_SECRET`: App Secret, chỉ cấu hình server-side.
- `LARK_APP_TOKEN`: `L89NbJwFAaTvCCsEVmajGVRHpJh`.
- `LARK_TABLE_ID`: `tbl632K3PIw26pvv`.
- `LARK_VIEW_ID`: `vew8E3SU2J`.

Không thêm secret vào biến `NEXT_PUBLIC_*`.

## Local Development

```bash
npm run dev
```

Mở `http://localhost:3000`. API Next Edge tương đương Cloudflare Functions được dùng khi phát triển local.

## Build

```bash
npm run typecheck
npm run build
npm run pages:build
```

## Deploy Cloudflare Pages

1. Kết nối repository với Cloudflare Pages.
2. Build command: `npm run pages:build`.
3. Output directory: `.vercel/output/static`.
4. Thêm toàn bộ environment variables trong Settings > Environment variables.
5. Deploy. `wrangler.toml` đã bật `nodejs_compat`.

Có thể deploy bằng CLI sau khi đăng nhập:

```bash
npx wrangler pages deploy .vercel/output/static --project-name tiktok-lark-analytics
```

## API

Các endpoint hỗ trợ query `start`, `end` theo ISO date và `force=true` để bỏ qua data cache:

`/api/summary`, `/api/daily`, `/api/weekly`, `/api/monthly`, `/api/top-videos`, `/api/traffic-sources`, `/api/keywords`, `/api/topics`, `/api/search-analysis`, `/api/viral-videos`.

## Quy tắc tính dữ liệu snapshot

- `video_create_time` là thời gian đăng video dùng để hiển thị và làm nguồn dự phòng khi các cột ngày đăng rời không hợp lệ.
- `week`, `year`, `mouth`, `day` đều mô tả thời gian đăng video. Trong code, `mouth` được chuẩn hóa thành `month`.
- `record created time` là thời gian hệ thống ghi nhận snapshot số liệu.
- Views, likes, shares, comments và các nguồn hiển thị là số cộng dồn từ lúc đăng video đến lúc snapshot được ghi nhận.
- KPI, top video, viral, traffic, keyword và topic chỉ dùng snapshot mới nhất của từng `item_id` trong phạm vi lọc. Không cộng nhiều snapshot của cùng video.
- Số liệu của ngày D được chốt khi có snapshot ngày D+1: `snapshot(D+1) - snapshot(D)`. Nếu chưa có snapshot ngày kế tiếp, ngày D hiển thị 0 thay vì hiển thị tổng cộng dồn.
- Biểu đồ luôn sinh đủ số ngày của khoảng lọc: 7 ngày có 7 mốc, 30 ngày có 30 mốc, 90 ngày có 90 mốc. Ngày không đủ hai snapshot liên tiếp hiển thị 0.
- Tuần và tháng được cộng từ các chênh lệch ngày đã tính ở trên, không cộng trực tiếp nhiều snapshot tích lũy.
- Mỗi KPI hiển thị phần trăm tăng/giảm so với khoảng liền trước có cùng số ngày. Công thức: `(kỳ hiện tại - kỳ trước) / kỳ trước * 100`.
- KPI `Video đăng mới` đếm `item_id` duy nhất có `year` + `mouth` + `day` nằm trong khoảng lọc. Nếu bộ cột này thiếu hoặc không hợp lệ, hệ thống mới fallback sang `video_create_time`.
- Tổng quan chia thành hai dòng KPI: toàn bộ video và riêng nhóm video đăng mới. Thẻ cuối mỗi dòng là trung bình cộng `full_video_watched_rate` của nhóm tương ứng.
- Thẻ Tổng video và Video đăng mới có thể nhấp để mở danh sách chi tiết, sắp xếp ngày đăng mới nhất trước. KPI và popup video mới dùng chung bộ lọc ngày đăng.
- Popup hiển thị ngày đăng từ `video_create_time` và được render qua portal phủ toàn viewport. Chỉ số của video mới là delta trong kỳ, không phải snapshot cộng dồn.
- Top video và Viral video xếp hạng theo views, shares và tương tác phát sinh của từng video trong kỳ. Các bảng này không hiển thị số cộng dồn tĩnh tại snapshot cuối.
- Sidebar chỉ còn một tab `Phân tích`; các tab ngày, tuần, tháng được gộp vì khoảng ngày đã được chọn trên header. Tab Top video đã được loại khỏi giao diện.
- Bộ lọc mặc định là Hôm qua. Tuần và tháng chỉ hiển thị giá trị thực sự tồn tại trong dữ liệu, sắp mới nhất trước; tuần kèm khoảng ngày. Header không còn trạng thái đồng bộ/nút làm mới và sidebar không còn footer nguồn dữ liệu.
- Dòng Toàn bộ video lấy tổng từ snapshot mới nhất của từng video trong khoảng lọc, không trừ snapshot. Tỷ lệ xem hết là trung bình cộng trên các snapshot mới nhất đó.
- Dòng Toàn bộ video không hiển thị so sánh kỳ trước. Popup Video đăng mới hiển thị snapshot mới nhất, trong khi KPI Video đăng mới bên ngoài vẫn tính số phát sinh.
- Trong dòng Chỉ số trong khoảng thời gian đã chọn, chỉ thẻ Video đăng mới là số video mới; các thẻ views, likes, shares và comments là tổng delta D+1 trừ D của toàn bộ video trong kỳ.
- Phân tích hashtag đọc trực tiếp field `Hashtag`, không còn tách từ khóa từ caption.
- Engagement Rate được tính từ tổng snapshot đã khử trùng: `(likes + shares + comments) / views * 100`.

## Troubleshooting

- `Thiếu LARK_APP_ID`: kiểm tra `.env.local` hoặc Cloudflare environment variables.
- HTTP `403`, mã `91403`: token hợp lệ nhưng Custom App không có quyền đọc Base. Trong Lark Developer Console, thêm scope xem/đọc Bitable, tạo và phát hành phiên bản mới. Sau đó bảo đảm app nằm trong tenant sở hữu Base và được phép truy cập tài liệu.
- Nếu Base hiển thị nhãn `Bên ngoài`, Base có thể thuộc tenant khác. `tenant_access_token` của app hiện tại không tự động kế thừa quyền từ link chia sẻ. Cách ổn định là tạo Custom App trong tenant sở hữu Base, hoặc sao chép/chuyển Base vào tenant của app rồi dùng App Token mới.
- Lark trả `99991663`: app thiếu scope hoặc phiên bản chứa scope mới chưa được phát hành.
- Không có bản ghi: kiểm tra app đã được thêm quyền truy cập Base và View ID đúng.
- Rate limit: service tự retry exponential; dữ liệu thành công được cache 5 phút.
- Field rỗng hoặc sai định dạng: normalizer chuyển số rỗng/sai thành `0`, ngày sai thành `null`.
