# 🍔 FASTFOOD MANAGEMENT SYSTEM & ADMIN DASHBOARD

Hệ thống quản trị và vận hành chuỗi cửa hàng thức ăn nhanh toàn diện (Fast Food Chain Management), được xây dựng chuẩn kiến trúc Full-Stack hiện đại với **Node.js/Express/MongoDB Mongoose (TypeScript)** và **React/Vite (TypeScript)**.

---

## 🚀 Tính năng nổi bật

### 1. Quản lý Đơn hàng (`/orders`)
- **Tìm kiếm & Lọc đa điều kiện**: Tìm theo mã đơn, tên khách, số điện thoại, địa chỉ nhận hàng; lọc theo trạng thái (`pending`, `confirmed`, `preparing`, `ready`, `out_for_delivery`, `delivered`, `cancelled`), chi nhánh cửa hàng và khoảng ngày đặt.
- **Quy trình xử lý chuẩn (Workflow Stepper)**: Cập nhật tuần tự từ tiếp nhận đơn ➔ xác nhận ➔ vào bếp ➔ sẵn sàng ➔ đang giao ➔ hoàn tất hoặc hủy đơn.
- **Audit Log tự động**: Mỗi lần cập nhật trạng thái qua `PATCH /api/orders/:id/status` tự động push bản ghi `{ status, at }` vào `statusHistory` và cập nhật `updatedAt`.
- **Gán tài xế giao hàng (`/orders/:id/assign-shipper`)**: Gán shipper cho đơn hàng và tự động đổi trạng thái shipper sang `busy` (Bận). Khi đơn hàng hoàn tất hoặc hủy, tài xế tự động trở lại `available` nếu không còn đơn khác đang giao.
- **Tạo đơn hàng mới (Create Order Modal)**: Chọn khách hàng, chọn chi nhánh phục vụ, chọn nhiều món ăn với số lượng linh hoạt, tự động tính tổng tiền (`subtotal + deliveryFee = totalAmount`), cập nhật địa chỉ giao hàng và ghi chú.
- **Xuất dữ liệu CSV (`/orders/export/csv`)**: Xuất file Excel/CSV theo bộ lọc hiện tại với định dạng UTF-8 BOM chuẩn tiếng Việt.

### 2. Quản lý Khách hàng (`/customers`)
- Tìm kiếm tức thì với Debounce, phân trang (Pagination).
- Xem thông tin chi tiết, địa chỉ giao hàng mặc định, tổng chi tiêu tích lũy (`totalSpent`) và tổng số đơn đã đặt (`orderCount`).
- Modal xem **Lịch sử đơn hàng** chi tiết của từng khách hàng.
- Thêm mới, chỉnh sửa và xóa khách hàng (CRUD).

### 3. Hệ thống Chi nhánh Cửa hàng (`/stores`)
- CRUD thông tin cửa hàng: `name, address, phone, location (GeoJSON Point [lng, lat], 2dsphere index), openHours {open, close}, status (open/closed)`.
- Hiển thị thống kê tổng doanh thu thực tế và số lượng đơn hàng theo từng chi nhánh.
- Tọa độ địa lý chuẩn GeoJSON hỗ trợ tìm kiếm không gian địa lý (2dsphere).

### 4. Đội ngũ Tài xế Giao hàng (`/shippers`)
- CRUD tài xế: `fullName, phone, vehicle, licensePlate, status (available/busy/offline), storeId`.
- Hiển thị huy hiệu số đơn hàng đang trực tiếp phụ trách giao theo thời gian thực.
- Chuyển đổi nhanh trạng thái làm việc (Sẵn sàng / Bận / Offline).

### 5. Đánh giá & Phản hồi Khách hàng (`/reviews`)
- Danh sách đánh giá gắn liền với đơn hàng đã giao (`orderId` unique), khách hàng (`customerId`), chi nhánh (`storeId`), điểm số (`rating` 1-5 sao) và bình luận (`comment`).
- Bảng tổng hợp điểm đánh giá trung bình theo từng chi nhánh (Store Scorecards).
- Bộ lọc đánh giá theo số sao (1⭐ đến 5⭐) và theo từng chi nhánh.

### 6. Báo cáo & Phân tích Doanh thu (`/analytics`)
Sử dụng các MongoDB Aggregation Pipeline tối ưu hiệu năng:
- **Doanh thu theo ngày**: Biểu đồ miền (AreaChart) theo khoảng thời gian tùy chọn (7 ngày, 14 ngày, 30 ngày).
- **Doanh thu theo cửa hàng**: Biểu đồ cột so sánh doanh số giữa các chi nhánh.
- **Doanh thu theo danh mục**: Biểu đồ Donut phân bổ tỷ trọng doanh thu (Burger, Pizza, Đồ uống, Gà rán...).
- **Tăng trưởng khách hàng**: Biểu đồ số lượng khách hàng mới đăng ký theo ngày.
- **Tỷ lệ trạng thái đơn**: Biểu đồ Donut thể hiện tỷ trọng các trạng thái đơn hàng.
- **Top món ăn bán chạy nhất**: Bảng xếp hạng số lượng phần bán và doanh thu đóng góp.
- **Top khách hàng thân thiết (VIP)**: Bảng xếp hạng khách hàng có tổng chi tiêu cao nhất.

### 7. Thực đơn & Món ăn (`/menu`)
- Quản lý danh mục món ăn (Burgers, Pizzas, Drinks, Sides, Desserts, Combos), giá bán, mô tả, hình ảnh và toggle trạng thái mở bán/tắt bán.

### 8. Cài đặt Hệ thống (`/settings`)
- **General**: Tên chuỗi nhà hàng, Hotline, Mã số thuế, đơn vị tiền tệ.
- **Profile**: Thông tin quản trị viên.
- **Appearance**: Chuyển đổi Dark Mode / Light Mode thời thượng, hỗ trợ lưu vào `localStorage`.
- **Notifications**: Cấu hình âm thanh chuông đơn hàng mới, cảnh báo tồn kho, đánh giá mới.
- **Security**: Đổi mật khẩu và giao diện cấu hình xác thực hai lớp (2FA).

---

## 📁 Cấu trúc Thư mục Dự án

```
fastfood/
├── package.json                 # Quản lý script khởi chạy toàn bộ hệ thống
├── .env.example                 # Mẫu biến môi trường
├── README.md                    # Tài liệu hướng dẫn chi tiết
│
├── server/                      # Backend API (Node.js + Express + TypeScript + Mongoose)
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── scripts/
│   │   └── 01_setup_fastfood.js # Standalone script seed dữ liệu cho Mongo Shell / NoSQLBooster
│   └── src/
│       ├── config/              # Kết nối Database và Biến môi trường
│       ├── models/              # Mongoose Models (Store, Customer, MenuItem, Shipper, Order, Review)
│       ├── services/            # Business Logic & Aggregation Pipelines
│       ├── controllers/         # Request handlers cho từng module
│       ├── routes/              # Express API Routes
│       ├── middleware/          # Global Error Handler & Logging
│       ├── scripts/             # TypeScript Seed Script
│       └── index.ts             # Entry point khởi chạy Express Server
│
└── client/                      # Frontend Admin UI (React + Vite + TypeScript + Tailwind CSS)
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── components/
        │   ├── layout/          # Sidebar, Header, Layout
        │   ├── dashboard/       # KPI cards, Quick widgets
        │   ├── orders/          # OrderList, OrderFilterBar, Modals, Stepper, CSV Export
        │   ├── customers/       # CustomerList, Detail & Form Modals
        │   ├── stores/          # StoreList, StoreCard, StoreModal
        │   ├── shippers/        # ShipperList, ShipperModal
        │   ├── reviews/         # ReviewList, RatingStars
        │   ├── analytics/       # Recharts Aggregation Dashboards
        │   ├── menu/            # MenuList, MenuModal
        │   ├── settings/        # SettingsView
        │   └── common/          # Badge, Modal, Button, Input, Select, Pagination, Toast, StatCard
        ├── pages/               # DashboardPage, OrdersPage, CustomersPage, StoresPage, v.v.
        ├── store/               # ThemeProvider, ToastProvider Context
        ├── hooks/               # useDebounce hook
        ├── types/               # TypeScript interfaces & types
        ├── lib/                 # Axios client instance, formatters
        ├── index.css            # CSS theme variables & Tailwind
        ├── App.tsx              # Component điều hướng chính
        └── main.tsx             # Entry point React
```

---

## ⚙️ Yêu cầu Môi trường

- **Node.js**: Phiên bản 18 trở lên (khuyên dùng Node 20+)
- **MongoDB**: MongoDB Community Server bản 6.0+ chạy tại `localhost:27017` hoặc MongoDB Atlas Connection String.
- **Trình duyệt**: Google Chrome, Edge, Brave hoặc Firefox.

---

## 🛠️ Hướng dẫn Cài đặt & Khởi chạy

### Bước 1: Clone hoặc mở thư mục dự án
```bash
cd d:\fastfood
```

### Bước 2: Cài đặt Dependencies
Bạn có thể cài đặt tự động cho cả root, server và client bằng 1 câu lệnh:
```bash
npm run install:all
```
*Hoặc cài đặt thủ công từng thư mục:*
```bash
# Cài đặt server
cd server && npm install

# Cài đặt client
cd ../client && npm install
```

---

## 🗄️ Cấu hình MongoDB & Chạy Seed Dữ liệu

### 1. Cấu hình file `.env`
Tạo file `server/.env` (hoặc copy từ `server/.env.example`):
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/fastfood_db
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### 2. Chạy Seed dữ liệu mẫu (Khởi tạo Database)
Chạy lệnh sau tại thư mục gốc:
```bash
npm run seed
```
*Hoặc chạy trực tiếp script JavaScript độc lập:*
```bash
node server/scripts/01_setup_fastfood.js
```

**Dữ liệu được khởi tạo tự động bao gồm:**
- **5 Cửa hàng / Chi nhánh**: Hà Nội (Hoàn Kiếm, Cầu Giấy), TP.HCM (Quận 1, Bình Thạnh Landmark 81), Đà Nẵng với tọa độ GeoJSON Point `[lng, lat]` và chỉ mục `2dsphere`.
- **8 Khách hàng mẫu**: Thông tin địa chỉ đầy đủ tại các thành phố.
- **12 Món ăn & Combo**: Burger, Pizza, Khoai tây lắc, Gà rán, Trà sữa, Kem Lava, Combo Party.
- **5 Tài xế Shipper**: Thông tin phương tiện và biển số xe.
- **45 Đơn hàng**: Trải dài trong 30 ngày qua với đầy đủ lịch sử trạng thái (`statusHistory`), hỗ trợ hiển thị biểu đồ phân tích doanh thu.
- **20 Đánh giá & Phản hồi**: Điểm đánh giá từ 3⭐ đến 5⭐ kèm bình luận.

---

## 🔍 Kết nối NoSQLBooster với MongoDB

Để xem và truy vấn trực tiếp cơ sở dữ liệu trên GUI:

1. Mở phần mềm **NoSQLBooster for MongoDB**.
2. Bấm vào nút **Connect** ➔ **Create Connection**.
3. Điền thông tin kết nối:
   - **Connection Name**: `FastFood Local`
   - **Host / IP**: `127.0.0.1` (hoặc `localhost`)
   - **Port**: `27017`
   - **Connection String**:
     ```
     mongodb://127.0.0.1:27017/fastfood_db
     ```
4. Bấm **Test Connection** để kiểm tra, sau đó bấm **Save & Connect**.
5. Bạn sẽ thấy database `fastfood_db` với 6 collections:
   - `stores` (với 2dsphere index trên trường `location`)
   - `customers`
   - `menuitems`
   - `shippers`
   - `orders`
   - `reviews`

### Một số câu lệnh truy vấn mẫu trên NoSQLBooster:
```javascript
// 1. Tìm các cửa hàng đang mở cửa
db.stores.find({ status: "open" });

// 2. Tìm đơn hàng theo trạng thái
db.orders.find({ status: "delivered" }).sort({ createdAt: -1 });

// 3. Truy vấn không gian địa lý: Tìm cửa hàng gần tọa độ Hoàn Kiếm trong bán kính 10km
db.stores.find({
  location: {
    $nearSphere: {
      $geometry: {
        type: "Point",
        coordinates: [105.8542, 21.0285]
      },
      $maxDistance: 10000 // 10,000 mét
    }
  }
});
```

---

## 🚀 Khởi chạy Ứng dụng

### Cách 1: Chạy cả Server & Client cùng lúc (Khuyên dùng)
Tại thư mục gốc `d:\fastfood`, chạy lệnh:
```bash
npm run dev
```
Hệ thống sẽ đồng thời khởi động:
- **Backend API Server**: `http://localhost:5000`
- **Frontend Dashboard**: `http://localhost:5173`

### Cách 2: Chạy riêng từng service
```bash
# Terminal 1: Chạy Server
npm run server

# Terminal 2: Chạy Client
npm run client
```

Mở trình duyệt truy cập: **`http://localhost:5173`**

---

## 📡 Danh sách API Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/health` | Kiểm tra trạng thái hoạt động của server |
| `GET` | `/api/orders` | Danh sách đơn hàng (hỗ trợ search, filter, pagination) |
| `POST` | `/api/orders` | Tạo đơn hàng mới |
| `GET` | `/api/orders/:id` | Xem chi tiết 1 đơn hàng |
| `PATCH` | `/api/orders/:id/status` | Cập nhật trạng thái đơn (push vào `statusHistory`) |
| `PATCH` | `/api/orders/:id/assign-shipper` | Gán tài xế giao hàng (chuyển shipper sang `busy`) |
| `GET` | `/api/orders/export/csv` | Xuất danh sách đơn hàng dạng file CSV |
| `GET` | `/api/customers` | Danh sách khách hàng (search, pagination) |
| `POST` | `/api/customers` | Tạo mới khách hàng |
| `GET` | `/api/customers/:id` | Chi tiết khách hàng và lịch sử đơn |
| `PUT` | `/api/customers/:id` | Cập nhật thông tin khách hàng |
| `DELETE` | `/api/customers/:id` | Xóa khách hàng |
| `GET` | `/api/stores` | Danh sách chi nhánh & doanh thu từng chi nhánh |
| `POST` | `/api/stores` | Tạo mới chi nhánh |
| `PUT` | `/api/stores/:id` | Cập nhật chi nhánh |
| `DELETE` | `/api/stores/:id` | Xóa chi nhánh |
| `GET` | `/api/shippers` | Danh sách tài xế & số đơn đang phụ trách |
| `POST` | `/api/shippers` | Thêm mới tài xế |
| `PUT` | `/api/shippers/:id` | Cập nhật tài xế |
| `DELETE` | `/api/shippers/:id` | Xóa tài xế |
| `GET` | `/api/reviews` | Danh sách đánh giá, lọc theo sao & điểm TB chi nhánh |
| `POST` | `/api/reviews` | Tạo đánh giá cho đơn hàng |
| `DELETE` | `/api/reviews/:id` | Xóa đánh giá |
| `GET` | `/api/menu` | Danh sách món ăn & combo |
| `POST` | `/api/menu` | Thêm món ăn mới |
| `PUT` | `/api/menu/:id` | Cập nhật món ăn / toggle mở bán |
| `DELETE` | `/api/menu/:id` | Xóa món ăn |
| `GET` | `/api/analytics/overview` | Tổng hợp KPI toàn hệ thống |
| `GET` | `/api/analytics/daily-revenue` | Doanh thu theo ngày (Aggregation) |
| `GET` | `/api/analytics/store-revenue` | Doanh thu theo cửa hàng (Aggregation) |
| `GET` | `/api/analytics/category-revenue` | Doanh thu theo danh mục món (Aggregation) |
| `GET` | `/api/analytics/customer-growth` | Tăng trưởng khách hàng (Aggregation) |
| `GET` | `/api/analytics/order-status` | Phân bổ trạng thái đơn (Aggregation) |
| `GET` | `/api/analytics/top-items` | Top món bán chạy nhất (Aggregation) |
| `GET` | `/api/analytics/top-customers` | Top khách hàng VIP (Aggregation) |

---

## 🔒 Kiểm thử Chất lượng Code (Code Quality)
- **TypeScript**: Strict mode trên cả Client và Server.
- **Không dùng `any`**: Các interface dữ liệu và props được định nghĩa chặt chẽ.
- **Xử lý trạng thái đầy đủ**: Có Loading Spinner, Empty State, Error Toast cảnh báo người dùng.
- **Responsive Design**: Tương thích hoàn hảo trên mọi kích thước màn hình (Mobile, Tablet, Desktop).
