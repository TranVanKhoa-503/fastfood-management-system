-- MySQL 8 query workbook for the optional FastFood SQL reference.
-- Run fastfood_demo_mysql.sql first. These statements are separate from the main MongoDB app.
USE `fastfood_demo_mysql`;

-- 01. Count rows in the six business entities.
SELECT 'stores' AS entity, COUNT(*) AS row_count FROM stores
UNION ALL SELECT 'customers', COUNT(*) FROM customers
UNION ALL SELECT 'menu_items', COUNT(*) FROM menu_items
UNION ALL SELECT 'shippers', COUNT(*) FROM shippers
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'reviews', COUNT(*) FROM reviews;

-- 02. Find customers by part of name, email, phone, or address.
SET @search_text = 'nguyen';
SELECT id, name, email, phone, address
FROM customers
WHERE LOWER(name) LIKE CONCAT('%', LOWER(@search_text), '%')
   OR LOWER(email) LIKE CONCAT('%', LOWER(@search_text), '%')
   OR phone LIKE CONCAT('%', @search_text, '%')
   OR LOWER(address) LIKE CONCAT('%', LOWER(@search_text), '%')
ORDER BY name;

-- 03. List branches that are open.
SELECT id, name, address, phone, longitude, latitude, open_time, close_time
FROM stores
WHERE status = 'open'
ORDER BY name;

-- 04. Browse available menu items in one category.
SET @menu_category = 'Burgers';
SELECT id, name, category, price, description
FROM menu_items
WHERE is_available = TRUE AND category = @menu_category
ORDER BY price, name;

-- 05. Show the most recently created orders with their customer, branch, and shipper.
SELECT o.id, o.created_at, o.status, c.name AS customer_name,
       s.name AS store_name, sh.full_name AS shipper_name,
       o.subtotal, o.delivery_fee, o.total_amount
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN stores s ON s.id = o.store_id
LEFT JOIN shippers sh ON sh.id = o.shipper_id
ORDER BY o.created_at DESC
LIMIT 20;

-- 06. Filter recent orders by status and a date range.
SET @filter_status = 'delivered';
SET @from_utc = UTC_TIMESTAMP() - INTERVAL 30 DAY;
SELECT id, status, payment_method, total_amount, created_at
FROM orders
WHERE status = @filter_status AND created_at >= @from_utc
ORDER BY created_at DESC;

-- 07. Select one sample order and inspect its totals.
SET @order_id = (SELECT id FROM orders ORDER BY created_at DESC LIMIT 1);
SELECT id, status, subtotal, delivery_fee, total_amount, delivery_address
FROM orders
WHERE id = @order_id;

-- 08. Inspect the embedded-equivalent order lines stored in the relational table.
SELECT oi.order_id, oi.item_name, oi.item_category, oi.quantity, oi.unit_price,
       oi.quantity * oi.unit_price AS line_total_vnd
FROM order_items oi
WHERE oi.order_id = @order_id
ORDER BY oi.id;

-- 09. Read the complete status history for the selected order.
SELECT order_id, status, changed_at
FROM order_status_history
WHERE order_id = @order_id
ORDER BY changed_at, id;

-- 10. Inspect one customer's order history.
SET @customer_id = (SELECT id FROM customers ORDER BY name LIMIT 1);
SELECT o.id, o.status, o.created_at, s.name AS store_name, o.total_amount
FROM orders o
JOIN stores s ON s.id = o.store_id
WHERE o.customer_id = @customer_id
ORDER BY o.created_at DESC;

-- 11. Count orders and order value by status.
SELECT status, COUNT(*) AS order_count,
       SUM(total_amount) AS order_value_vnd,
       ROUND(AVG(total_amount), 0) AS average_order_vnd
FROM orders
GROUP BY status
ORDER BY order_count DESC, status;

-- 12. Revenue by day from the reporting view (delivered orders only).
SELECT order_date, delivered_orders, revenue_vnd
FROM v_daily_revenue
ORDER BY order_date DESC
LIMIT 30;

-- 13. Compare revenue and volume across branches.
SELECT store_id, store_name, revenue_vnd, order_count, delivered_count
FROM v_store_revenue
ORDER BY revenue_vnd DESC, store_name;

-- 14. Compare delivered sales by menu category.
SELECT category, items_sold, revenue_vnd
FROM v_category_revenue
ORDER BY revenue_vnd DESC;

-- 15. Find best-selling menu items.
SELECT menu_item_id, item_name, item_category, items_sold, revenue_vnd
FROM v_top_items
ORDER BY items_sold DESC, revenue_vnd DESC
LIMIT 10;

-- 16. Rank customers by actual delivered spend derived from orders.
SELECT c.id, c.name, c.phone,
       COUNT(o.id) AS delivered_orders,
       SUM(o.total_amount) AS delivered_spend_vnd
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE o.status = 'delivered'
GROUP BY c.id, c.name, c.phone
ORDER BY delivered_spend_vnd DESC
LIMIT 10;

-- 17. Average rating and review count per branch, including branches without reviews.
SELECT s.id, s.name,
       COUNT(r.id) AS review_count,
       ROUND(AVG(r.rating), 2) AS average_rating
FROM stores s
LEFT JOIN reviews r ON r.store_id = s.id
GROUP BY s.id, s.name
ORDER BY average_rating DESC, review_count DESC, s.name;

-- 18. Distribution of review ratings.
SELECT rating, COUNT(*) AS review_count
FROM reviews
GROUP BY rating
ORDER BY rating DESC;

-- 19. Order counts and values by payment method.
SELECT payment_method, COUNT(*) AS order_count,
       SUM(total_amount) AS order_value_vnd
FROM orders
GROUP BY payment_method
ORDER BY order_count DESC;

-- 20. Shipper workload and current availability.
SELECT sh.id, sh.full_name, sh.status, s.name AS store_name,
       SUM(CASE WHEN o.status NOT IN ('delivered','cancelled') THEN 1 ELSE 0 END) AS active_orders,
       SUM(CASE WHEN o.status = 'delivered' THEN 1 ELSE 0 END) AS delivered_orders
FROM shippers sh
JOIN stores s ON s.id = sh.store_id
LEFT JOIN orders o ON o.shipper_id = sh.id
GROUP BY sh.id, sh.full_name, sh.status, s.name
ORDER BY s.name, sh.full_name;

-- 21. Detect an order marked out for delivery without an assigned shipper (expected: no rows).
SELECT id, store_id, status, shipper_id
FROM orders
WHERE status = 'out_for_delivery' AND shipper_id IS NULL;

-- 22. Reconcile order totals against subtotal plus delivery fee (expected: no rows).
SELECT id, subtotal, delivery_fee, total_amount,
       subtotal + delivery_fee AS calculated_total
FROM orders
WHERE total_amount <> subtotal + delivery_fee;

-- 23. Reconcile customer counters against order documents (expected: no rows).
WITH order_stats AS (
  SELECT customer_id,
         COUNT(*) AS actual_order_count,
         SUM(CASE WHEN status = 'delivered' THEN total_amount ELSE 0 END) AS actual_total_spent
  FROM orders
  GROUP BY customer_id
)
SELECT c.id, c.name,
       c.order_count, COALESCE(os.actual_order_count, 0) AS actual_order_count,
       c.total_spent, COALESCE(os.actual_total_spent, 0) AS actual_total_spent
FROM customers c
LEFT JOIN order_stats os ON os.customer_id = c.id
WHERE c.order_count <> COALESCE(os.actual_order_count, 0)
   OR c.total_spent <> COALESCE(os.actual_total_spent, 0);

-- 24. Reconcile shipper status with active assignments (expected: no rows).
WITH active_assignments AS (
  SELECT shipper_id, COUNT(*) AS active_order_count
  FROM orders
  WHERE shipper_id IS NOT NULL AND status NOT IN ('delivered','cancelled')
  GROUP BY shipper_id
)
SELECT sh.id, sh.full_name, sh.status,
       COALESCE(a.active_order_count, 0) AS active_order_count
FROM shippers sh
LEFT JOIN active_assignments a ON a.shipper_id = sh.id
WHERE (sh.status = 'busy' AND COALESCE(a.active_order_count, 0) = 0)
   OR (sh.status <> 'busy' AND COALESCE(a.active_order_count, 0) > 0);

-- 25. Check review customer and branch values against the referenced order (expected: no rows).
SELECT r.id AS review_id, r.order_id,
       r.customer_id AS review_customer_id, o.customer_id AS order_customer_id,
       r.store_id AS review_store_id, o.store_id AS order_store_id
FROM reviews r
JOIN orders o ON o.id = r.order_id
WHERE r.customer_id <> o.customer_id OR r.store_id <> o.store_id;

-- 26. Inspect indexes used by the app.
SHOW INDEX FROM orders;
SHOW INDEX FROM order_items;
EXPLAIN SELECT id, status, created_at, total_amount
FROM orders
WHERE store_id = (SELECT id FROM stores ORDER BY name LIMIT 1)
ORDER BY created_at DESC
LIMIT 10;

-- 27. Optional CRUD practice. Run the WHOLE block; ROLLBACK leaves no saved change.
START TRANSACTION;
SET @demo_menu_id = LOWER(LEFT(REPLACE(UUID(), '-', ''), 24));
INSERT INTO menu_items
  (id, name, category, price, description, image, is_available, created_at, updated_at)
VALUES
  (@demo_menu_id, 'SQL CRUD practice item', 'Sides', 1000,
   'Temporary row for practicing INSERT, SELECT, UPDATE, and DELETE.', '', TRUE,
   UTC_TIMESTAMP(3), UTC_TIMESTAMP(3));
SELECT id, name, price FROM menu_items WHERE id = @demo_menu_id;
UPDATE menu_items SET price = 2000, updated_at = UTC_TIMESTAMP(3)
WHERE id = @demo_menu_id;
SELECT id, name, price FROM menu_items WHERE id = @demo_menu_id;
DELETE FROM menu_items WHERE id = @demo_menu_id;
SELECT id, name FROM menu_items WHERE id = @demo_menu_id;
ROLLBACK;

-- 28. Preview a ready order and an available shipper from the same branch before assignment.
SELECT o.id AS ready_order_id, o.store_id, sh.id AS available_shipper_id,
       sh.full_name AS available_shipper
FROM orders o
JOIN shippers sh ON sh.store_id = o.store_id AND sh.status = 'available'
WHERE o.status = 'ready' AND o.shipper_id IS NULL
ORDER BY o.created_at, sh.full_name
LIMIT 10;
