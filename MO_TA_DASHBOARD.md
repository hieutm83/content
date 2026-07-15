# Mô tả chi tiết TikTok Analytics Dashboard

## 1. Tổng quan hệ thống

TikTok Analytics Dashboard là hệ thống phân tích hiệu quả video TikTok từ dữ liệu được đồng bộ vào Lark Base.

Dashboard phục vụ:

- Chủ doanh nghiệp.
- Team Content.
- Team TikTok.
- Team Marketing.
- Team Vận hành.

Luồng dữ liệu:

```text
TikTok
  -> Lark Base
  -> Cloudflare Functions / Next.js API
  -> TikTok Analytics Dashboard
```

Trình duyệt không gọi trực tiếp Lark Open API. Toàn bộ dữ liệu được lấy thông qua các endpoint `/api/*` của hệ thống.

## 2. Quy tắc dữ liệu quan trọng

### 2.1 Thời gian đăng video

Field nguồn:

```text
video_create_time
```

Đây là thời gian video được đăng lên TikTok và được dùng làm nguồn dự phòng để hiển thị khi bộ cột ngày đăng rời không hợp lệ.

Các field `week`, `year`, `mouth`, `day` cũng là thời gian đăng video, không phải thời gian ghi nhận snapshot. Trong code, tên `mouth` được chuẩn hóa thành `month`.

### 2.2 Thời gian ghi nhận số liệu

Field nguồn:

```text
record created time
```

Đây là thời gian Lark Base ghi nhận một snapshot số liệu của video. Toàn bộ bộ lọc thời gian, biểu đồ ngày, tuần, tháng và việc xác định snapshot đều sử dụng field này.

### 2.3 Dữ liệu snapshot cộng dồn

Các chỉ số sau là số cộng dồn từ thời điểm đăng video đến thời điểm snapshot được ghi nhận:

- Views.
- Likes.
- Shares.
- Comments.
- Tổng tương tác.
- Nguồn hiển thị.

Vì đây là dữ liệu cộng dồn, hệ thống không cộng trực tiếp nhiều snapshot của cùng một video. KPI tổng hợp, top video, viral video, traffic source, keyword và topic chỉ sử dụng snapshot mới nhất của mỗi `item_id` trong phạm vi tương ứng.

### 2.4 Cách tính số liệu phát sinh theo ngày

Số liệu phát sinh của ngày D chỉ được hoàn tất khi có snapshot ngày D+1.

```text
Số liệu ngày D = Snapshot ngày D+1 - Snapshot ngày D
```

Ví dụ:

```text
Snapshot 14/07: 391.227 views
Snapshot 15/07: 410.000 views

Views của ngày 14/07 = 410.000 - 391.227 = 18.773 views
```

Nếu chưa có snapshot ngày kế tiếp, ngày hiện tại hiển thị `0`. Hệ thống không lấy toàn bộ số cộng dồn làm số liệu phát sinh trong ngày.

Chênh lệch âm do dữ liệu TikTok bị điều chỉnh hoặc reset được giới hạn về `0`.

## 3. Bố cục giao diện

Dashboard gồm ba khu vực chính:

### 3.1 Sidebar bên trái

Sidebar chứa tên hệ thống, tên kênh TikTok, danh sách các tab phân tích và thông tin nguồn dữ liệu.

Các tab gồm:

1. Tổng quan.
2. Phân tích.
3. Viral video.
4. Nguồn truy cập.
5. Phân tích tìm kiếm.
6. Phân tích hashtag.
7. Chủ đề.

Trên thiết bị di động, sidebar được chuyển thành menu đóng/mở.

### 3.2 Header phía trên

Header chứa bộ lọc toàn cục và trạng thái đồng bộ.

Các thành phần:

- Bộ lọc khoảng thời gian.
- Bộ lọc tuần.
- Bộ lọc tháng.
- Tổng số bản ghi trong phạm vi lọc.
- Thời gian đồng bộ gần nhất.
- Nút Làm mới.

### 3.3 Nội dung chính

Khu vực nội dung thay đổi theo tab đang được chọn. Tất cả trang đều sử dụng chung bộ lọc trên header.

## 4. Bộ lọc toàn cục

### 4.1 Khoảng thời gian

Các lựa chọn:

- Hôm qua: 1 ngày và là lựa chọn mặc định.
- 7 ngày: đúng 7 mốc ngày, bao gồm ngày kết thúc.
- 30 ngày: đúng 30 mốc ngày.
- 90 ngày: đúng 90 mốc ngày.
- Tùy chọn: người dùng chọn ngày bắt đầu và ngày kết thúc.

Khoảng tùy chọn tính cả ngày bắt đầu và ngày kết thúc.

Các ngày không đủ hai snapshot liên tiếp vẫn xuất hiện trên biểu đồ với giá trị `0`. Vì vậy số cột hoặc số mốc luôn đúng với khoảng thời gian đã chọn.

### 4.2 Tuần

Chỉ hiển thị các tuần thực sự có video trong dữ liệu, sắp tuần mới nhất trước. Mỗi lựa chọn có dạng `W28 (06/07 - 12/07)`.

### 4.3 Tháng

Chỉ hiển thị các tháng thực sự có video trong dữ liệu, sắp tháng mới nhất trước, ví dụ `Tháng 7/2026`, `Tháng 6/2026`.

### 4.4 Nút Làm mới

Nút Làm mới yêu cầu backend bỏ qua data cache và tải lại dữ liệu từ Lark Base.

Trong lúc đồng bộ, biểu tượng làm mới chuyển động và nút được vô hiệu hóa để tránh gửi nhiều request trùng lặp.

### 4.5 Last Sync và tổng bản ghi

- Tổng bản ghi: số snapshot Lark Base nằm trong phạm vi lọc.
- Đồng bộ: thời gian cập nhật hoặc ghi nhận snapshot gần nhất.

## 5. Tab Tổng quan

Tab Tổng quan cung cấp cái nhìn nhanh về hiệu suất trong kỳ đang chọn.

Các KPI được chia thành hai dòng:

- Dòng Chỉ số tổng kênh: lấy snapshot mới nhất của từng video trong khoảng lọc, sau đó cộng views, likes, shares, comments và tính trung bình cộng tỷ lệ xem hết. Dòng này không dùng phép trừ snapshot.
- Các thẻ Chỉ số tổng kênh không hiển thị phần trăm tăng/giảm vì đây là chỉ số tổng tại snapshot mới nhất.
- Dòng Chỉ số trong khoảng thời gian đã chọn: số video đăng mới và các chỉ số phát sinh của toàn bộ video trong kỳ. Views, likes, shares và comments dùng công thức snapshot D+1 trừ snapshot D trên toàn kênh, không chỉ giới hạn ở video mới. Tỷ lệ xem hết trong kỳ là trung bình của toàn bộ video thuộc phạm vi.

Nhóm video mới gồm các `item_id` có ngày đăng theo `year` + `mouth` + `day` nằm trong khoảng lọc. Views, likes, shares và comments của nhóm này là số phát sinh trong kỳ theo công thức snapshot D+1 trừ snapshot D, không phải số cộng dồn tại snapshot mới nhất.

Tỷ lệ xem hết được tính bằng trung bình cộng `full_video_watched_rate` của các video trong nhóm. Hệ thống chuẩn hóa các dạng dữ liệu tỷ lệ phổ biến trước khi tính: `0.0932`, `9.32` và `932` đều được hiểu là `9,32%`.

### 5.1 Thẻ Tổng video

Hiển thị số video duy nhất được xác định bằng `item_id` trong phạm vi dữ liệu.

Nhiều snapshot của cùng một video không làm tăng số lượng video.

Nhấp vào thẻ Tổng video mở popup danh sách video, sắp xếp theo ngày đăng mới nhất. Ngày đăng trong popup lấy trực tiếp từ `video_create_time`. Popup hiển thị caption, ngày đăng, views, likes, shares, comments và tỷ lệ xem hết.

Tiêu đề video trong popup được hiển thị dưới dạng nút có kích thước cố định và rút gọn trên một dòng. Nhấp nút để mở TikTok; rê chuột lên nút để xem tiêu đề đầy đủ bằng tooltip trình duyệt.

### 5.2 Thẻ Video đăng mới

Hiển thị tổng số video được xuất bản lên kênh trong khoảng thời gian đã chọn.

Hệ thống đếm các video duy nhất có tổ hợp `year` + `mouth` + `day` nằm trong khoảng thời gian lọc. Nếu các cột này thiếu hoặc không hợp lệ, hệ thống fallback sang `video_create_time`. Nhiều snapshot của cùng một `item_id` chỉ được tính là một video đăng mới.

Nhấp vào thẻ Video đăng mới mở popup chỉ chứa các video có ngày đăng nằm trong khoảng đang chọn. Số lượng trên thẻ và danh sách popup sử dụng chung một hàm lọc và luôn khớp nhau.

Các chỉ số Views, Likes, Shares và Comments trong popup video mới lấy trực tiếp từ snapshot mới nhất của từng video, không cộng trừ. Quy tắc này chỉ áp dụng trong popup; các KPI Video đăng mới bên ngoài vẫn là số phát sinh trong kỳ.

### 5.3 Thẻ Tổng lượt xem

Hiển thị tổng views phát sinh trong khoảng thời gian đã chọn.

Giá trị được tính từ chênh lệch giữa các snapshot liên tiếp, không phải tổng số views cộng dồn của snapshot.

### 5.4 Thẻ Lượt thích

Hiển thị tổng likes phát sinh trong khoảng thời gian đã chọn.

```text
Likes ngày D = Likes snapshot D+1 - Likes snapshot D
```

### 5.5 Thẻ Lượt chia sẻ

Hiển thị tổng shares phát sinh trong khoảng thời gian đã chọn.

```text
Shares ngày D = Shares snapshot D+1 - Shares snapshot D
```

### 5.6 Thẻ Bình luận

Hiển thị tổng comments phát sinh trong khoảng thời gian đã chọn.

```text
Comments ngày D = Comments snapshot D+1 - Comments snapshot D
```

### 5.7 Thẻ Tỷ lệ tương tác

Công thức:

```text
Engagement Rate =
(Likes phát sinh + Shares phát sinh + Comments phát sinh)
/ Views phát sinh
* 100
```

Nếu views bằng `0`, Engagement Rate bằng `0%`.

### 5.8 Phần trăm tăng hoặc giảm

Mỗi thẻ KPI hiển thị mức thay đổi so với khoảng thời gian liền trước có cùng độ dài.

Ví dụ:

- Chọn 7 ngày: so sánh với 7 ngày liền trước.
- Chọn 30 ngày: so sánh với 30 ngày liền trước.
- Chọn 90 ngày: so sánh với 90 ngày liền trước.
- Chọn 10 ngày tùy chỉnh: so sánh với 10 ngày liền trước ngày bắt đầu.

Công thức:

```text
% thay đổi =
(Giá trị kỳ hiện tại - Giá trị kỳ trước)
/ Giá trị kỳ trước
* 100
```

Quy ước hiển thị:

- Mũi tên lên màu xanh: chỉ số tăng.
- Mũi tên xuống màu đỏ: chỉ số giảm.
- Dấu ngang màu xám: không thay đổi.
- Kỳ trước bằng 0 và kỳ hiện tại cũng bằng 0: `0%`.
- Kỳ trước bằng 0 và kỳ hiện tại có phát sinh: `+100%`.

### 5.9 Biểu đồ Lượt xem theo ngày

Hai biểu đồ ngày được nhóm dưới tiêu đề **Biểu đồ diễn biến** và hiển thị thành hai cột có chiều ngang bằng nhau trên desktop. Trên mobile, hai biểu đồ xếp dọc.

Biểu đồ đường thể hiện views phát sinh theo từng ngày.

Trục ngang:

- Ngày theo `record created time`.

Trục dọc:

- Số views phát sinh.

Mỗi điểm dữ liệu sử dụng công thức snapshot ngày kế tiếp trừ snapshot ngày hiện tại.

### 5.10 Biểu đồ Tương tác theo ngày

Biểu đồ cột thể hiện tổng tương tác phát sinh theo từng ngày.

Công thức:

```text
Tương tác phát sinh = Likes phát sinh + Shares phát sinh + Comments phát sinh
```

Biểu đồ luôn có đúng số cột tương ứng với khoảng thời gian đã chọn.

## 6. Tab Phân tích

Tab Phân tích sử dụng trực tiếp khoảng thời gian trên header và hiển thị sáu biểu đồ theo ngày. Các tab Theo ngày, Theo tuần và Theo tháng trước đây đã được gộp vào tab này.

1. Lượt xem theo ngày.
2. Lượt thích theo ngày.
3. Lượt chia sẻ theo ngày.
4. Bình luận theo ngày.
5. Số video đăng mới theo ngày, dựa trên `year`, `mouth`, `day`.
6. Tỷ lệ tương tác theo ngày.

Các chỉ số tương tác được tính từ chênh lệch snapshot D+1 và snapshot D.

Ngày chưa có snapshot kế tiếp hiển thị giá trị `0`.

## 7. Tổng hợp tuần và tháng

Tab Theo tuần tổng hợp các chênh lệch ngày thành từng tuần.

Các biểu đồ:

1. Lượt xem theo tuần.
2. Lượt thích theo tuần.
3. Lượt chia sẻ theo tuần.
4. Bình luận theo tuần.
5. Số video đăng mới theo tuần, dựa trên cột `week` và ngày đăng.
6. Tỷ lệ tương tác theo tuần.

Hệ thống không cộng trực tiếp các snapshot tích lũy theo tuần. Số liệu tuần là tổng các số liệu phát sinh theo ngày thuộc tuần đó.

```text
Views tuần = Tổng views phát sinh của các ngày trong tuần
```

## 8. Tab Theo tháng

Tab Theo tháng tổng hợp các chênh lệch ngày thành từng tháng.

Các biểu đồ:

1. Lượt xem theo tháng.
2. Lượt thích theo tháng.
3. Lượt chia sẻ theo tháng.
4. Bình luận theo tháng.
5. Số video đăng mới theo tháng, dựa trên `year` và `mouth`.
6. Tỷ lệ tương tác theo tháng.

```text
Views tháng = Tổng views phát sinh của các ngày trong tháng
```

## 9. Top video đã được loại bỏ

Top video không còn là một tab trên dashboard. API nền vẫn có thể được giữ để phục vụ tích hợp nội bộ, nhưng người dùng không nhìn thấy mục này trong sidebar.

Các chỉ số trong bảng là tăng trưởng của riêng từng video trong kỳ. Hệ thống tính chênh lệch giữa từng cặp snapshot liên tiếp của cùng `item_id`, sau đó cộng các chênh lệch hợp lệ trong khoảng lọc. Đây không phải số cộng dồn tại snapshot mới nhất.

### 9.1 Các cột

- Video: thumbnail hoặc ảnh fallback.
- Caption: nội dung video.
- Views: lượt xem phát sinh trong khoảng thời gian đã chọn.
- Likes: lượt thích phát sinh trong khoảng thời gian đã chọn.
- Shares: lượt chia sẻ phát sinh trong khoảng thời gian đã chọn.
- Comments: lượt bình luận phát sinh trong khoảng thời gian đã chọn.
- ER: tỷ lệ tương tác của video trong kỳ.
- Ngày tạo record: `record created time` của snapshot mới nhất.
- Ngày đăng: `video_create_time`.
- Link: liên kết TikTok.

ER của từng video trong kỳ:

```text
ER = (Likes phát sinh + Shares phát sinh + Comments phát sinh) / Views phát sinh * 100
```

### 9.2 Tính năng bảng

- Tìm kiếm theo caption.
- Sắp xếp theo cột.
- Mặc định sắp xếp Views phát sinh giảm dần.
- Phân trang.
- Xuất CSV.
- Nhấp vào hàng để mở `share_url` trong tab mới.

## 10. Tab Viral video

Tab Viral video hiển thị tối đa 50 video có tiềm năng viral dựa trên hiệu suất phát sinh trong khoảng thời gian đã chọn.

Thứ tự được xác định từ tổ hợp:

- Views phát sinh.
- Shares phát sinh.
- Engagement Rate trong kỳ.

Shares được đặt trọng số cao hơn tương tác thông thường vì khả năng chia sẻ là tín hiệu quan trọng của nội dung lan truyền.

Bảng Viral video có cùng quy tắc tính tăng trưởng theo từng video và cùng tính năng với bảng Top video:

- Search.
- Sort.
- Pagination.
- Export CSV.
- Mở link TikTok.

## 11. Tab Nguồn truy cập

Tab Nguồn truy cập phân tích nơi người xem nhìn thấy video.

Các nguồn:

- Dành cho bạn: `impression_sources_feed`.
- Đang theo dõi: `impression_sources_follow`.
- Hồ sơ: `impression_sources_profile`.
- Tìm kiếm: `impression_sources_search`.
- Âm thanh: `impression_sources_sound`.

### 11.1 Biểu đồ donut

Biểu đồ donut thể hiện tỷ trọng của từng nguồn truy cập.

### 11.2 Danh sách tỷ trọng

Mỗi nguồn hiển thị:

- Tên nguồn.
- Giá trị.
- Phần trăm trên tổng nguồn hiển thị.
- Thanh tỷ trọng.

Công thức:

```text
Tỷ trọng nguồn = Giá trị nguồn / Tổng tất cả nguồn * 100
```

Nguồn truy cập sử dụng snapshot mới nhất của mỗi video để tránh cộng trùng dữ liệu tích lũy.

## 12. Tab Phân tích tìm kiếm

Tab Phân tích tìm kiếm hiển thị:

- Search %.
- For You %.
- Profile %.
- Following %.
- Sound %.
- Kênh đóng góp lớn nhất.

Thẻ Kênh đóng góp lớn nhất cho biết nguồn đang chiếm tỷ trọng cao nhất trong dữ liệu hiện tại.

## 13. Tab Phân tích hashtag

Tab Phân tích hashtag lấy dữ liệu trực tiếp từ field `Hashtag` ở cuối bảng Lark Base.

Trước khi thống kê, hệ thống:

- Tách các hashtag theo dấu `#`, khoảng trắng, dấu phẩy hoặc dấu chấm phẩy.
- Loại dấu `#` ở đầu.
- Chuyển hashtag về chữ thường.
- Loại giá trị rỗng.
- Chỉ tính một hashtag một lần cho mỗi video.

Kết quả hiển thị tối đa 100 từ khóa.

Các cột:

- Hashtag.
- Tổng views của các video chứa từ khóa.
- Số video sử dụng hashtag.

Mỗi video chỉ dùng snapshot mới nhất nên hashtag và views không bị lặp do có nhiều lần ghi nhận.

## 14. Tab Chủ đề

Tab Chủ đề tự động nhóm caption vào các nhóm:

- Khí huyết.
- Mất ngủ.
- Dưỡng nhan.
- Nội tiết.
- Gan.
- Tiêu hóa.
- Thải độc.
- Làm đẹp.
- Khác.

Các cột:

- Chủ đề.
- Số video.
- Tổng views.
- View trung bình.
- ER trung bình.

Công thức:

```text
View trung bình = Tổng views của chủ đề / Số video của chủ đề
```

```text
ER trung bình = Tổng tương tác của chủ đề / Tổng views của chủ đề * 100
```

## 15. Trạng thái giao diện

### 15.1 Loading

Khi đang tải dữ liệu, dashboard hiển thị skeleton có kích thước tương ứng với nội dung thực tế.

### 15.2 Empty

Khi không có dữ liệu trong phạm vi lọc, dashboard hiển thị thông báo chưa có dữ liệu và gợi ý thay đổi bộ lọc hoặc đồng bộ dữ liệu.

### 15.3 Error

Khi API hoặc Lark Base gặp lỗi, dashboard hiển thị thông báo lỗi ngay trong khu vực nội dung.

Ví dụ:

- Thiếu App ID hoặc App Secret.
- Custom App không có quyền đọc Base.
- Lark trả HTTP 403.
- Request timeout.
- Endpoint không tồn tại.

## 16. API tương ứng

| Chức năng | Endpoint |
| :-- | :-- |
| KPI tổng quan | `/api/summary` |
| Theo ngày | `/api/daily` |
| Theo tuần | `/api/weekly` |
| Theo tháng | `/api/monthly` |
| Top video | `/api/top-videos` |
| Viral video | `/api/viral-videos` |
| Nguồn truy cập | `/api/traffic-sources` |
| Phân tích tìm kiếm | `/api/search-analysis` |
| Từ khóa | `/api/keywords` |
| Chủ đề | `/api/topics` |

Các endpoint hỗ trợ:

- `start`: ngày bắt đầu.
- `end`: ngày kết thúc.
- `force=true`: bỏ qua data cache và tải lại từ Lark Base.

## 17. Cache và đồng bộ

- Tenant access token được cache và làm mới trước khi hết hạn.
- Dữ liệu Lark Base được cache 5 phút.
- Nút Làm mới sử dụng `force=true` để bỏ qua data cache.
- API hỗ trợ pagination tối đa 500 record mỗi request cho đến khi tải hết dữ liệu.
- Request Lark có timeout và retry exponential cho lỗi rate limit hoặc lỗi server.

## 18. Responsive

### Desktop

- Sidebar cố định bên trái.
- Header nằm phía trên.
- KPI hiển thị trên một hàng khi đủ không gian.
- Biểu đồ và bảng sử dụng toàn bộ chiều rộng nội dung.

### Tablet

- KPI và biểu đồ tự chuyển sang ít cột hơn.
- Bảng cho phép cuộn ngang.

### Mobile

- Sidebar chuyển thành menu trượt.
- KPI hiển thị dạng hai cột.
- Bộ lọc tự xuống hàng.
- Bảng có thể cuộn ngang và vẫn giữ đầy đủ cột dữ liệu.
