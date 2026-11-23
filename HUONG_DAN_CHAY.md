# Hướng dẫn chạy đề tài Quản lý dịch vụ giao thức ăn nhanh

## Chạy nhanh trên Windows

1. Cài Node.js 20.19 trở lên và Docker Desktop; mở Docker Desktop.
2. Mở PowerShell tại thư mục dự án.
3. Chạy `scripts/start-demo.ps1`.
4. Mở `http://localhost:5173`.

Lần đầu chạy, script tạo `server/.env`, khởi động MongoDB bằng Docker, cài các gói theo lockfile và nạp dữ liệu demo nếu cơ sở dữ liệu còn trống. Lần sau, dữ liệu MongoDB được giữ nguyên.

API mặc định chỉ lắng nghe trên máy hiện tại (`127.0.0.1`) vì bản demo chưa có đăng nhập. `CLIENT_URL` giới hạn origin của giao diện. Chỉ cấu hình `HOST=0.0.0.0` khi bạn chủ động cho máy khác truy cập và đã bổ sung bảo vệ phù hợp.

## Chạy thủ công

```powershell
if (-not (Test-Path server/.env)) { Copy-Item server/.env.example server/.env }
docker compose up -d mongodb
npm run install:all
npm run seed
npm run dev
```

Ứng dụng chạy tại `http://localhost:5173`; API chạy tại `http://localhost:5000/api`. Kiểm tra API bằng `http://localhost:5000/api/health`.

## Nạp lại dữ liệu demo

Lệnh seed chỉ chạy khi sáu collection còn trống. Để thay thế dữ liệu hiện có, hãy sao lưu trước, rồi chạy:

```powershell
npm --prefix server run seed -- --reset
```

`--reset` xóa và tạo lại sáu collection của database đang ghi trong `server/.env`.

## Sao lưu và khôi phục

```powershell
npm run backup
npm run restore
```

`npm run backup` ghi bản sao lưu database đang cấu hình vào thư mục riêng có dấu thời gian `server/live-backups/` (đã loại khỏi Git vì có thể chứa dữ liệu cá nhân). `npm run restore` khôi phục snapshot demo đã commit trong `server/backup/` vào database trống. Muốn khôi phục bản sao lưu riêng, truyền đúng đường dẫn thư mục dưới `server/live-backups/` sau dấu `--`. Chỉ dùng `--replace` sau khi đã xác nhận đúng database và có bản sao lưu an toàn. Lệnh `npm run backup:demo` tạo lại snapshot tổng hợp trong `server/backup/` mà không cần database đang chạy.

## Quản trị MongoDB bằng NoSQLBooster

Đây là luồng quản trị và demo chính theo đề tài NoSQL. Sau khi chạy `scripts/start-demo.ps1`, mở NoSQLBooster và kết nối tới `mongodb://127.0.0.1:27017/fastfood_db`. Hướng dẫn chi tiết về collection, truy vấn, aggregation, thao tác document và kịch bản đối chiếu ứng dụng nằm trong [HUONG_DAN_NOSQLBOOSTER.md](HUONG_DAN_NOSQLBOOSTER.md). Có thể mở `server/scripts/nosqlbooster_demo_queries.js` trong Script Editor để chạy các truy vấn mẫu.

## Mở bộ SQL tham khảo (không bắt buộc)

Ứng dụng chính chạy bằng MongoDB. File SQL chỉ là phần tham khảo bổ sung; không cần MySQL để chạy ứng dụng hoặc trình bày đề tài NoSQL. Nếu muốn xem mô hình quan hệ, mở `server/sql/mysql/fastfood_demo_mysql.sql` bằng MySQL Workbench trên MySQL 8.0.16 trở lên. Script tạo schema `fastfood_demo_mysql`, 8 bảng quan hệ, 10 khóa ngoại, 5 view báo cáo và 2 procedure giao dịch; cuối file đối chiếu 90 bản ghi demo. Có thể nạp bằng dòng lệnh:

```powershell
mysql -u root -p < server/sql/mysql/fastfood_demo_mysql.sql
```

File SQL này dùng cùng snapshot tổng hợp với backup MongoDB; nó là bản tham khảo riêng, không phải cấu hình kết nối thay thế cho ứng dụng.

Hai thủ tục `sp_assign_order_shipper` và `sp_transition_order` xử lý khóa giao dịch, kiểm tra cùng chi nhánh/tài xế sẵn sàng, chuyển trạng thái hợp lệ, ghi lịch sử, cập nhật chi tiêu khi giao xong và giải phóng tài xế khi đơn đóng. Hướng dẫn truy vấn và lệnh `CALL` nằm trong `server/sql/mysql/README.md`.

## Demo thao tác

- **Thêm / sửa / xóa món ăn:** mở Thực đơn, bấm Thêm món hoặc nút sửa/xóa tại dòng món. Có thể bật/tắt trạng thái mở bán.
- **Thêm / sửa / xóa khách hàng:** mở Khách hàng, dùng nút thêm, sửa hoặc xóa; tìm kiếm và phân trang nằm trên cùng danh sách.
- **Thêm / sửa / xóa chi nhánh và shipper:** mở Cửa hàng hoặc Tài xế giao hàng, thao tác tại thẻ/dòng tương ứng.
- **Thêm đơn hàng:** mở Đơn hàng, tạo đơn, chọn khách, chi nhánh, món, số lượng, hình thức thanh toán và địa chỉ giao.
- **Xử lý đơn:** mở chi tiết để chuyển trạng thái theo quy trình. Trước trạng thái “Đang giao”, gán một shipper đang sẵn sàng thuộc đúng chi nhánh; hệ thống giữ shipper cho một đơn hoạt động và tự giải phóng khi giao xong/hủy.
- **Đánh giá:** tạo đánh giá gắn với đơn đã giao; xóa đánh giá từ danh sách.

## Ghi chú phạm vi

Ứng dụng dùng MongoDB. Cài đặt chung, hồ sơ và tùy chọn thông báo được lưu ở trình duyệt hiện tại. Phiên bản đồ án chưa có đăng nhập, phân quyền người dùng, đổi mật khẩu, 2FA hay mô-đun tồn kho; không triển khai công khai trên Internet nếu chưa bổ sung các kiểm soát đó.

Để giữ lịch sử và khóa tham chiếu, khách hàng có đơn, món từng nằm trong đơn, tài xế từng được gán đơn và chi nhánh đang được tham chiếu sẽ không bị xóa. Tạo mới và xóa vẫn demo được trên các bản ghi chưa có lịch sử liên quan.
