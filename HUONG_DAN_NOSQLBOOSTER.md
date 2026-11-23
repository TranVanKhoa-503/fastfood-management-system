# Hướng dẫn NoSQLBooster cho đề tài quản lý dịch vụ giao thức ăn nhanh

## Mục tiêu

Đề tài dùng NoSQLBooster để quản trị và khai thác cơ sở dữ liệu tài liệu MongoDB, đồng thời minh họa nghiệp vụ bằng ứng dụng React và Node.js/Express. MongoDB là nguồn dữ liệu chính. NoSQLBooster kết nối trực tiếp cùng database để xem document, chạy truy vấn và aggregation, kiểm tra index, rồi đối chiếu thay đổi do ứng dụng ghi xuống. File MySQL riêng trong gói là tài liệu tham khảo, không cần dùng trong buổi demo NoSQL.

NoSQLBooster cung cấp shell editor, trình xem dữ liệu dạng cây/bảng/JSON và hỗ trợ nhập xuất JSON/BSON. Xem [MongoDB Shell and Extensions](https://www.nosqlbooster.com/shellExtensions), [Data Viewer](https://www.nosqlbooster.com/dataViewer) và [các tính năng import/export](https://www.nosqlbooster.com/features) của nhà phát triển.

## 1. Khởi chạy ứng dụng và MongoDB

Yêu cầu Node.js 20.19 trở lên và một MongoDB local đang hoạt động hoặc Docker Desktop. Từ thư mục dự án, mở PowerShell và chạy:

```powershell
scripts/start-demo.ps1
```

Lần chạy đầu tiên, script tạo cấu hình cục bộ, dùng MongoDB trong `MONGODB_URI` nếu kết nối được, nếu không thì thử khởi động container MongoDB bằng Docker. Script nạp seed khi database còn trống, cài dependencies nếu cần rồi mở ứng dụng. Truy cập dashboard tại `http://localhost:5173`; API dùng `http://localhost:5000/api`.

Seed bằng Node.js riêng khi cần:

```powershell
npm run seed
```

Không chạy `server/scripts/01_setup_fastfood.js` trong query editor của NoSQLBooster. File đó là script Node.js dùng Mongoose. Sau khi seed, dùng NoSQLBooster để kết nối và thao tác với MongoDB.

## 2. Tạo kết nối NoSQLBooster

1. Mở NoSQLBooster và tạo kết nối mới.
2. Chọn kết nối MongoDB local, đặt tên `FastFood Local`.
3. Dùng URI `mongodb://127.0.0.1:27017/fastfood_db`; cổng local là `27017`.
4. Với cấu hình Docker demo đi kèm, không cần bật xác thực. Nếu dùng MongoDB Atlas hoặc máy chủ có xác thực, nhập URI và thông tin do chủ database cấp.
5. Kết nối, chọn database `fastfood_db` và mở các collection.

Kiểm tra kết nối bằng các lệnh sau trong Script Editor:

```javascript
db.getName();
db.getCollectionNames();
db.orders.countDocuments();
```

Sau khi nạp seed, số document dự kiến là 5 cửa hàng, 8 khách hàng, 12 món ăn, 5 tài xế, 45 đơn hàng và 15 đánh giá.

## 3. Cấu trúc CSDL tài liệu

| Collection | Nội dung | Quan hệ chính |
|---|---|---|
| `stores` | Chi nhánh, giờ mở cửa, trạng thái và tọa độ GeoJSON | Được tham chiếu bởi đơn, tài xế và đánh giá |
| `customers` | Thông tin khách hàng và số liệu mua hàng tổng hợp | Được tham chiếu bởi đơn và đánh giá |
| `menuitems` | Món ăn, danh mục, giá và trạng thái mở bán | Được tham chiếu trong từng dòng món của đơn |
| `shippers` | Tài xế, phương tiện, chi nhánh và trạng thái làm việc | Được tham chiếu bởi đơn đang/đã giao |
| `orders` | Đơn hàng, trạng thái, chi phí, lịch sử trạng thái và các dòng món nhúng | Chứa ObjectId tham chiếu khách, chi nhánh và tài xế |
| `reviews` | Điểm và nhận xét gắn với đơn đã giao | Tham chiếu đơn, khách hàng và chi nhánh |

Các trường `customerId`, `storeId`, `shipperId`, `menuItemId` dùng `ObjectId` tham chiếu giữa collection. `items` và `statusHistory` nằm nhúng trong document đơn hàng để đọc cùng đơn. Vị trí cửa hàng lưu theo GeoJSON Point `[kinh độ, vĩ độ]` và dùng index `2dsphere`.

## 4. Chạy truy vấn và aggregation

Trong NoSQLBooster, mở `server/scripts/nosqlbooster_demo_queries.js` vào Script Editor, bảo đảm đang kết nối đúng database, rồi chạy script. File gồm ví dụ:

- Tìm chi nhánh đang mở.
- Ghép đơn hàng với khách hàng và tài xế bằng `$lookup`.
- Tính doanh thu và số lượng bán theo danh mục bằng aggregation.
- Xếp hạng khách hàng theo giá trị đơn đã giao.
- Tìm chi nhánh gần tọa độ Hoàn Kiếm bằng truy vấn địa lý.
- Xem index trên cửa hàng và đơn hàng.

Có thể chạy từng đoạn trong file để xem kết quả riêng trong bảng/JSON viewer. NoSQLBooster cũng có Visual Query Builder và Fluent Query API; ví dụ trong hướng dẫn tập trung vào MongoDB query/aggregation chuẩn để có thể đối chiếu trực tiếp với API của ứng dụng.

## 5. Demo thêm, sửa, xóa document

Thực hiện trên database demo. Chạy từng lệnh riêng trong Script Editor và xem `insertedId` trả về. Ví dụ tạo một món thử:

```javascript
db.getSiblingDB('fastfood_db').menuitems.insertOne({
  name: 'DEMO NoSQLBooster item',
  category: 'Sides',
  price: 19000,
  description: 'Document tạo thử trong NoSQLBooster',
  image: '',
  isAvailable: true,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

Thay `COPY_INSERTED_ID` bên dưới bằng giá trị ObjectId vừa trả về:

```javascript
db.getSiblingDB('fastfood_db').menuitems.findOne({ _id: ObjectId('COPY_INSERTED_ID') });
db.getSiblingDB('fastfood_db').menuitems.updateOne(
  { _id: ObjectId('COPY_INSERTED_ID') },
  { $set: { price: 22000, updatedAt: new Date() } }
);
db.getSiblingDB('fastfood_db').menuitems.findOne({ _id: ObjectId('COPY_INSERTED_ID') });
```

Xóa đúng document thử sau khi demo:

```javascript
db.getSiblingDB('fastfood_db').menuitems.deleteOne({ _id: ObjectId('COPY_INSERTED_ID') });
```

Trong ứng dụng, thao tác thêm/sửa/xóa món vẫn dùng giao diện để đi qua validation của Mongoose và API. Không sửa trực tiếp trạng thái đơn hay tài xế qua NoSQLBooster trong buổi demo vì các lệnh trực tiếp sẽ bỏ qua quy tắc nghiệp vụ của ứng dụng.

## 6. Đối chiếu ứng dụng với database

1. Trên dashboard, mở **Đơn hàng** và tạo đơn mới từ khách, chi nhánh và món có sẵn.
2. Trong NoSQLBooster, chạy `db.orders.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(5)` để xem document đơn vừa tạo. Kiểm tra `subtotal`, `deliveryFee`, `totalAmount`, `items` và `statusHistory`.
3. Trong giao diện, xác nhận đơn, đưa qua chuẩn bị và sẵn sàng. Trước khi chuyển sang đang giao, gán tài xế cùng chi nhánh.
4. Làm mới kết quả trong NoSQLBooster: trạng thái đơn đổi, `statusHistory` có thêm phần tử, tài xế được gán chuyển sang `busy`.
5. Đánh dấu đơn đã giao. Kiểm tra đơn có trạng thái `delivered`, tổng chi tiêu khách tăng, và tài xế trở lại `available` nếu không còn đơn hoạt động khác.

Đây là phần trình bày chính của đề tài: NoSQLBooster giúp quản trị và kiểm tra document; ứng dụng minh họa tạo và cập nhật các document theo nghiệp vụ giao hàng.

## 7. Sao lưu dữ liệu demo

Ứng dụng xuất sáu collection ra Extended JSON bằng:

```powershell
npm run backup
```

Bản xuất dữ liệu thực tế được ghi vào thư mục có dấu thời gian `server/live-backups/`, thư mục này không được đưa lên Git vì có thể chứa thông tin cá nhân. Snapshot tổng hợp dùng cho demo nằm riêng trong `server/backup/`.

Để tạo lại snapshot dữ liệu demo mà không cần database đang chạy:

```powershell
npm run backup:demo
```

NoSQLBooster cũng hỗ trợ tác vụ import/export JSON/BSON và giao diện cho MongoDB backup tools; tên menu có thể khác theo phiên bản cài đặt. Snapshot tổng hợp kèm theo gói nằm trong `server/backup/`.

## Kịch bản thuyết trình ngắn

1. Giới thiệu MongoDB là database tài liệu và mở sáu collection trong NoSQLBooster.
2. Xem một document đơn hàng, chỉ ra ObjectId tham chiếu và các mảng nhúng `items`, `statusHistory`.
3. Chạy truy vấn đơn hàng, `$lookup` khách/tài xế và aggregation doanh thu.
4. Tạo đơn trên ứng dụng, quan sát document mới xuất hiện trong NoSQLBooster.
5. Gán shipper và hoàn tất giao hàng trên ứng dụng; đối chiếu lịch sử đơn và trạng thái tài xế trong NoSQLBooster.
6. Tạo, xem, sửa, xóa document món thử trực tiếp trong database demo.

## Tài liệu NoSQLBooster

- [NoSQLBooster MongoDB Shell and Extensions](https://www.nosqlbooster.com/shellExtensions)
- [NoSQLBooster Data Viewer](https://www.nosqlbooster.com/dataViewer)
- [NoSQLBooster Features: import/export and MongoDB tools](https://www.nosqlbooster.com/features)
