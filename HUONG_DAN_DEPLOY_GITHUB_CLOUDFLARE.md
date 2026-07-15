# Hướng dẫn triển khai TikTok Analytics từ GitHub lên Cloudflare Pages

Tài liệu này hướng dẫn public dự án `TikTok Lark Analytics` từ máy cá nhân lên GitHub, sau đó tự động build và triển khai bằng Cloudflare Pages.

## 1. Thông tin dự án

- GitHub repository: `https://github.com/hieutm83/content`
- Branch production: `main`
- Cloudflare project đề xuất: `tiktok-lark-analytics`
- Framework: Next.js
- Build command: `npm run pages:build`
- Build output: `.vercel/output/static`
- File cấu hình Cloudflare: `wrangler.toml`

## 2. Yêu cầu trước khi bắt đầu

Cần có:

1. Tài khoản GitHub có quyền quản trị repository `hieutm83/content`.
2. Tài khoản Cloudflare.
3. Node.js 20 hoặc mới hơn.
4. Git đã được cài trên máy.
5. Các thông tin kết nối Lark Custom App và Lark Base.

Kiểm tra công cụ:

```powershell
node --version
npm --version
git --version
```

## 3. Chuẩn bị biến môi trường local

Tạo file `.env.local` trong thư mục dự án. Có thể bắt đầu từ `.env.example`:

```powershell
Copy-Item .env.example .env.local
```

File cần có các tên biến sau:

```dotenv
LARK_APP_ID=
LARK_APP_SECRET=
LARK_APP_TOKEN=
LARK_TABLE_ID=
LARK_VIEW_ID=
```

Điền giá trị thật lấy từ Lark Developer Console và Lark Base.

Không commit `.env.local` lên GitHub. File `.gitignore` của dự án đã loại trừ:

```text
.env
.env.local
.env.*.local
node_modules/
.next/
*.log
*.tsbuildinfo
```

Kiểm tra `.env.local` đang được bỏ qua:

```powershell
git check-ignore -v .env.local
```

## 4. Cài đặt và kiểm tra dự án

Mở PowerShell tại thư mục dự án:

```powershell
cd "D:\9router\content web\lark"
npm install
npm run typecheck
```

Chạy local:

```powershell
npm run dev
```

Mở:

```text
http://localhost:3000
```

Chỉ chạy một Next.js dev server cho thư mục này. Nhiều server cùng sử dụng `.next` có thể làm cache xung đột.

## 5. Tạo repository GitHub

Nếu repository chưa tồn tại:

1. Đăng nhập `https://github.com`.
2. Chọn **New repository**.
3. Đặt tên repository, ví dụ `content`.
4. Không thêm README hoặc `.gitignore` nếu source local đã có sẵn.
5. Chọn **Create repository**.

Repository đang dùng cho dự án này:

```text
https://github.com/hieutm83/content
```

## 6. Khởi tạo Git và push source

Nếu thư mục chưa có Git:

```powershell
git init -b main
git remote add origin https://github.com/hieutm83/content.git
```

Kiểm tra trước khi commit:

```powershell
git status --short
git check-ignore -v .env.local node_modules .next
```

Commit và push:

```powershell
git add .
git diff --cached --check
git commit -m "Build TikTok Lark analytics dashboard"
git push -u origin main
```

Nếu Git báo `dubious ownership` trên ổ đĩa Windows không lưu ownership:

```powershell
git config --global --add safe.directory "D:/9router/content web/lark"
```

Sau đó chạy lại các lệnh Git.

Xác minh source tại:

```text
https://github.com/hieutm83/content
```

Đảm bảo không nhìn thấy `.env.local` trong repository.

## 7. Kết nối GitHub với Cloudflare

1. Mở `https://dash.cloudflare.com`.
2. Chọn **Workers & Pages**.
3. Chọn **Create application**.
4. Chọn **Pages** và **Connect to Git**.
5. Chọn GitHub.
6. Cấp quyền cho ứng dụng **Cloudflare Workers and Pages**.
7. Nên chỉ cấp quyền cho repository `hieutm83/content`.
8. Chọn repository `hieutm83/content`.
9. Chọn branch production là `main`.

Cloudflare sẽ tự động build lại mỗi khi có commit mới được push lên `main`.

Tài liệu chính thức:

- https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/
- https://developers.cloudflare.com/pages/get-started/git-integration/

## 8. Cấu hình build Cloudflare Pages

Nhập các giá trị sau:

```text
Project name: tiktok-lark-analytics
Production branch: main
Root directory: /
Build command: npm run pages:build
Build output directory: .vercel/output/static
```

Nếu giao diện Cloudflare có trường **Deploy command**, nhập:

```text
npx wrangler pages deploy .vercel/output/static --project-name tiktok-lark-analytics
```

Không sử dụng:

```text
npx wrangler deploy
```

`wrangler deploy` là lệnh dành cho Workers. Dùng lệnh đó trong Pages sẽ xuất hiện lỗi:

```text
It looks like you've run a Workers-specific command in a Pages project.
For Pages, please run `wrangler pages deploy` instead.
```

Nếu giao diện Pages Git integration không có trường Deploy command, chỉ cần Build command và Build output directory. Cloudflare sẽ tự upload output sau khi build.

Tài liệu build chính thức:

- https://developers.cloudflare.com/pages/configuration/build-configuration/

## 9. Thêm Variables and Secrets

Trong Cloudflare project, mở:

```text
Settings -> Variables and Secrets -> Add
```

Thêm các biến sau cho môi trường **Production**:

| Type | Variable name | Value |
|---|---|---|
| Text | `LARK_APP_ID` | Giá trị trong `.env.local` |
| Secret | `LARK_APP_SECRET` | Giá trị trong `.env.local` |
| Text | `LARK_APP_TOKEN` | Giá trị trong `.env.local` |
| Text | `LARK_TABLE_ID` | Giá trị trong `.env.local` |
| Text | `LARK_VIEW_ID` | Giá trị trong `.env.local` |
| Text | `NODE_VERSION` | `20` |

Nếu sử dụng Preview deployments, thêm cùng các biến cho môi trường **Preview**.

Lưu ý:

- Không gửi hoặc chụp màn hình giá trị `LARK_APP_SECRET`.
- Không đưa secret vào `wrangler.toml`, README hoặc source code.
- Sau khi sửa variables/secrets, cần chạy deployment mới để cấu hình có hiệu lực.

Tài liệu chính thức:

- https://developers.cloudflare.com/pages/functions/bindings/

## 10. Deploy lần đầu

Sau khi nhập đủ cấu hình:

1. Chọn **Save and Deploy** hoặc **Deploy**.
2. Theo dõi lần lượt các bước Cloning, Installing, Building và Deploying.
3. Build thành công phải tạo thư mục `.vercel/output/static`.
4. Deploy thành công sẽ cung cấp URL dạng:

```text
https://tiktok-lark-analytics.pages.dev
```

Mở URL và kiểm tra:

1. Dashboard hiển thị bình thường.
2. Sidebar và bộ lọc hoạt động.
3. API `/api/summary` không trả lỗi.
4. Dữ liệu Lark Base được tải.
5. Popup video và xuất CSV hoạt động.

Có thể kiểm tra API trực tiếp:

```text
https://tiktok-lark-analytics.pages.dev/api/summary
```

## 11. Tự động triển khai các phiên bản sau

Sau khi Git integration hoạt động, quy trình cập nhật chỉ còn:

```powershell
git status
git add .
git commit -m "Mô tả thay đổi"
git push
```

Cloudflare sẽ tự động:

1. Clone commit mới.
2. Chạy `npm install`.
3. Chạy `npm run pages:build`.
4. Deploy output lên Pages.

Có thể xem trạng thái trong:

```text
Cloudflare Dashboard -> Workers & Pages -> tiktok-lark-analytics -> Deployments
```

## 12. Gắn tên miền riêng

1. Mở project `tiktok-lark-analytics`.
2. Chọn **Custom domains**.
3. Chọn **Set up a custom domain**.
4. Nhập domain hoặc subdomain, ví dụ `analytics.example.com`.
5. Làm theo hướng dẫn DNS của Cloudflare.

Nếu domain đang quản lý trên cùng tài khoản Cloudflare, bản ghi DNS thường được tạo tự động.

## 13. Xử lý lỗi thường gặp

### 13.1 Dùng sai Deploy command

Thông báo:

```text
Workers-specific command in a Pages project
```

Sửa Deploy command thành:

```text
npx wrangler pages deploy .vercel/output/static --project-name tiktok-lark-analytics
```

### 13.2 Không tìm thấy `.vercel/output/static`

Nguyên nhân thường là Build command đang dùng:

```text
npm run build
```

Sửa thành:

```text
npm run pages:build
```

### 13.3 Thiếu `LARK_APP_ID` hoặc `LARK_APP_SECRET`

Kiểm tra:

```text
Settings -> Variables and Secrets
```

Đảm bảo biến đã được thêm vào đúng môi trường Production/Preview và chạy deployment mới.

### 13.4 Lark trả HTTP 403 hoặc mã 91403

Token hợp lệ nhưng Custom App chưa có quyền đọc Base.

1. Mở Lark Developer Console.
2. Thêm quyền đọc Bitable/Base.
3. Tạo và phát hành phiên bản app mới.
4. Cho app quyền truy cập Base.
5. Kiểm tra App Token, Table ID và View ID.

### 13.5 Lark trả mã 99991663

App thiếu scope hoặc phiên bản chứa scope mới chưa được phát hành. Cập nhật scope và phát hành lại app.

### 13.6 Build variables hiển thị `None`

Các biến chưa được thêm hoặc chưa được lưu vào build environment. Mở Variables and Secrets, thêm đủ biến, lưu và retry deployment.

### 13.7 Wrangler báo phiên bản cũ

Cảnh báo phiên bản Wrangler cũ không nhất thiết làm build thất bại. Nếu cần cập nhật:

```powershell
npm install --save-dev wrangler@4
```

Sau khi nâng major version, cần chạy lại typecheck/build vì có thể có thay đổi cấu hình.

### 13.8 Website hoạt động nhưng không có dữ liệu

Kiểm tra lần lượt:

1. `LARK_APP_ID` và `LARK_APP_SECRET`.
2. App đã được phát hành.
3. App có quyền đọc Bitable.
4. App có quyền truy cập Base.
5. `LARK_APP_TOKEN`, `LARK_TABLE_ID`, `LARK_VIEW_ID` đúng.
6. Base thuộc đúng tenant của Custom App.

## 14. Checklist trước khi public

- [ ] `npm run typecheck` thành công.
- [ ] Website local chạy tại `http://localhost:3000`.
- [ ] `.env.local` được Git ignore.
- [ ] Source đã push lên branch `main`.
- [ ] Cloudflare kết nối đúng repository.
- [ ] Build command là `npm run pages:build`.
- [ ] Output directory là `.vercel/output/static`.
- [ ] Deploy command dùng `wrangler pages deploy` nếu giao diện yêu cầu.
- [ ] Đã thêm đủ Variables and Secrets.
- [ ] Deployment hiển thị Success.
- [ ] URL Pages mở được dashboard.
- [ ] API và dữ liệu Lark hoạt động.

