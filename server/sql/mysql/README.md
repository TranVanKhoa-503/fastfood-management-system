# MySQL SQL tham khảo

File `fastfood_demo_mysql.sql` là bản chuyển đổi quan hệ từ cùng bộ dữ liệu demo Extended JSON dùng cho MongoDB. SQL này tạo schema `fastfood_demo_mysql`, 8 bảng có khóa chính/khóa ngoại, 5 view báo cáo và 2 thủ tục giao dịch cho gán shipper/chuyển trạng thái. Dữ liệu là dữ liệu tổng hợp để thuyết trình, không lấy từ cơ sở dữ liệu thật.

Ứng dụng chính vẫn kết nối MongoDB. File SQL là phần tham khảo để trình bày thiết kế quan hệ và truy vấn trên MySQL Workbench; nó không thay MongoDB trong luồng chạy React/Express.

## Nạp bằng MySQL Workbench

1. Dùng MySQL Server 8.0.16 trở lên và mở MySQL Workbench.
2. Kết nối server local, mở `fastfood_demo_mysql.sql`, rồi chạy toàn bộ script trên schema mới.
3. Chọn schema `fastfood_demo_mysql`. Cuối file có truy vấn đối chiếu 90 bản ghi nguồn.

## Nạp bằng dòng lệnh

```bash
mysql -u root -p < server/sql/mysql/fastfood_demo_mysql.sql
```

## Truy vấn demo

Sau khi nạp schema và dữ liệu bằng `fastfood_demo_mysql.sql`, mở `fastfood_demo_queries.sql` để chạy bộ 28 ví dụ độc lập. Bộ này gồm tìm kiếm/lọc, JOIN nhiều bảng, lịch sử đơn, báo cáo theo ngày/chi nhánh/danh mục, top khách/món, đối soát tổng tiền và thống kê, cùng `SHOW INDEX`/`EXPLAIN`.

Các câu truy vấn chỉ đọc ở phần đầu. Cuối file có một khối CRUD thử nghiệm cho `menu_items`, được bao trong transaction và kết thúc bằng `ROLLBACK` để không lưu thay đổi nếu chạy trọn khối.

```sql
USE fastfood_demo_mysql;
SELECT * FROM v_store_revenue ORDER BY revenue_vnd DESC;
SELECT * FROM v_daily_revenue ORDER BY order_date DESC;
SELECT * FROM v_category_revenue ORDER BY revenue_vnd DESC;
SELECT * FROM v_order_status_breakdown ORDER BY order_count DESC;
SELECT * FROM v_top_items ORDER BY items_sold DESC, revenue_vnd DESC LIMIT 10;
```

Hai thủ tục SQL minh họa cập nhật trạng thái theo đúng luồng và gán tài xế sẵn sàng cùng chi nhánh. Ví dụ dùng một đơn `ready` chưa gán shipper:

```sql
SET @order_id = (SELECT id FROM orders WHERE status = 'ready' AND shipper_id IS NULL ORDER BY created_at LIMIT 1);
SET @store_id = (SELECT store_id FROM orders WHERE id = @order_id);
SET @shipper_id = (SELECT id FROM shippers WHERE store_id = @store_id AND status = 'available' LIMIT 1);
CALL sp_assign_order_shipper(@order_id, @shipper_id);
CALL sp_transition_order(@order_id, 'out_for_delivery');
CALL sp_transition_order(@order_id, 'delivered');
```

Thủ tục chuyển đơn sang `out_for_delivery` kiểm tra đơn đã gán shipper và shipper đang `busy`. Các thủ tục dùng transaction cùng khóa hàng để tránh hai đơn cùng nhận một shipper.

Các lệnh `CALL` làm thay đổi dữ liệu demo. Nạp lại vào schema mới nếu muốn quay về trạng thái ban đầu.

## Tạo lại file SQL

Sau khi cập nhật snapshot MongoDB demo, chạy từ thư mục gốc dự án:

```bash
python server/scripts/export_mysql_reference.py
```

Script dùng Python standard library, không cần cài thêm package.
