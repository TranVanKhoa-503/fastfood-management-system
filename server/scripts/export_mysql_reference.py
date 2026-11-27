#!/usr/bin/env python3
"""Convert the checked-in MongoDB demo fixture into a normalized MySQL 8 SQL file."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_INPUT = PROJECT_ROOT / "server" / "backup"
DEFAULT_OUTPUT = PROJECT_ROOT / "server" / "sql" / "mysql" / "fastfood_demo_mysql.sql"
COLLECTIONS = ("stores", "customers", "menuitems", "shippers", "orders", "reviews")


def decode_extended_json(value: Any) -> Any:
    if isinstance(value, list):
        return [decode_extended_json(item) for item in value]
    if not isinstance(value, dict):
        return value
    if "$oid" in value:
        return value["$oid"]
    if "$numberInt" in value:
        return int(value["$numberInt"])
    if "$numberLong" in value:
        return int(value["$numberLong"])
    if "$numberDouble" in value:
        return float(value["$numberDouble"])
    if "$numberDecimal" in value:
        return value["$numberDecimal"]
    if "$date" in value:
        date_value = value["$date"]
        if isinstance(date_value, dict) and "$numberLong" in date_value:
            return datetime.fromtimestamp(int(date_value["$numberLong"]) / 1000, timezone.utc)
        parsed = datetime.fromisoformat(str(date_value).replace("Z", "+00:00"))
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
    return {key: decode_extended_json(item) for key, item in value.items()}


def load_collections(directory: Path) -> dict[str, list[dict[str, Any]]]:
    result: dict[str, list[dict[str, Any]]] = {}
    for name in COLLECTIONS:
        path = directory / f"{name}.json"
        with path.open("r", encoding="utf-8") as source:
            value = decode_extended_json(json.load(source))
        if not isinstance(value, list):
            raise ValueError(f"{path} must contain a JSON array")
        result[name] = value
    return result


def sql_value(value: Any) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "1" if value else "0"
    if isinstance(value, datetime):
        return "'" + value.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M:%S.%f")[:23] + "'"
    if isinstance(value, (int, float)):
        return format(value, ".15g") if isinstance(value, float) else str(value)
    if isinstance(value, str):
        encoded = value.encode("utf-8").hex()
        return f"CONVERT(X'{encoded}' USING utf8mb4)"
    raise TypeError(f"Cannot encode {type(value).__name__} as SQL")


def insert_statement(table: str, columns: list[str], rows: list[list[Any]]) -> str:
    if not rows:
        return f"-- No demo rows for {table}.\n"
    column_sql = ", ".join(f"`{column}`" for column in columns)
    value_sql = ",\n".join("  (" + ", ".join(sql_value(value) for value in row) + ")" for row in rows)
    return f"INSERT INTO `{table}` ({column_sql}) VALUES\n{value_sql};\n"


SCHEMA = r"""-- FastFood Management System: MySQL 8 reference schema + synthetic demo data
-- This is a relational SQL reference for the course demo. The running app still uses MongoDB.
-- Import into a fresh schema. Data values are VND integers; timestamps are stored in UTC.

CREATE DATABASE IF NOT EXISTS `fastfood_demo_mysql`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `fastfood_demo_mysql`;

CREATE TABLE IF NOT EXISTS `stores` (
  `id` CHAR(24) PRIMARY KEY,
  `name` VARCHAR(160) NOT NULL,
  `address` VARCHAR(300) NOT NULL,
  `phone` VARCHAR(32) NOT NULL,
  `longitude` DECIMAL(10,7) NOT NULL,
  `latitude` DECIMAL(10,7) NOT NULL,
  `open_time` CHAR(5) NOT NULL DEFAULT '08:00',
  `close_time` CHAR(5) NOT NULL DEFAULT '22:00',
  `status` ENUM('open','closed') NOT NULL DEFAULT 'open',
  `created_at` DATETIME(3) NOT NULL,
  `updated_at` DATETIME(3) NOT NULL,
  CHECK (`longitude` BETWEEN -180 AND 180),
  CHECK (`latitude` BETWEEN -90 AND 90)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `customers` (
  `id` CHAR(24) PRIMARY KEY,
  `name` VARCHAR(160) NOT NULL,
  `email` VARCHAR(190) NOT NULL UNIQUE,
  `phone` VARCHAR(32) NOT NULL,
  `address` VARCHAR(300) NOT NULL,
  `total_spent` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `order_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL,
  `updated_at` DATETIME(3) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `menu_items` (
  `id` CHAR(24) PRIMARY KEY,
  `name` VARCHAR(180) NOT NULL,
  `category` ENUM('Burgers','Pizzas','Drinks','Sides','Desserts','Combos') NOT NULL,
  `price` BIGINT UNSIGNED NOT NULL,
  `description` TEXT NOT NULL,
  `image` VARCHAR(1000) NOT NULL DEFAULT '',
  `is_available` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME(3) NOT NULL,
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `idx_menu_category_name` (`category`, `name`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `shippers` (
  `id` CHAR(24) PRIMARY KEY,
  `store_id` CHAR(24) NOT NULL,
  `full_name` VARCHAR(160) NOT NULL,
  `phone` VARCHAR(32) NOT NULL,
  `vehicle` VARCHAR(80) NOT NULL DEFAULT 'Motorbike',
  `license_plate` VARCHAR(32) NOT NULL,
  `status` ENUM('available','busy','offline') NOT NULL DEFAULT 'available',
  `created_at` DATETIME(3) NOT NULL,
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE KEY `uq_shipper_id_store` (`id`, `store_id`),
  INDEX `idx_shipper_store_status` (`store_id`, `status`),
  CONSTRAINT `fk_shipper_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `orders` (
  `id` CHAR(24) PRIMARY KEY,
  `customer_id` CHAR(24) NOT NULL,
  `store_id` CHAR(24) NOT NULL,
  `shipper_id` CHAR(24) NULL,
  `subtotal` BIGINT UNSIGNED NOT NULL,
  `delivery_fee` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `total_amount` BIGINT UNSIGNED NOT NULL,
  `status` ENUM('pending','confirmed','preparing','ready','out_for_delivery','delivered','cancelled') NOT NULL DEFAULT 'pending',
  `payment_method` ENUM('cash','card','momo','vnpay') NOT NULL DEFAULT 'cash',
  `delivery_address` VARCHAR(500) NOT NULL,
  `note` TEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL,
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `idx_order_store_created` (`store_id`, `created_at`),
  INDEX `idx_order_customer_created` (`customer_id`, `created_at`),
  INDEX `idx_order_shipper_status` (`shipper_id`, `status`),
  INDEX `idx_order_status_created` (`status`, `created_at`),
  CHECK (`total_amount` = `subtotal` + `delivery_fee`),
  CONSTRAINT `fk_order_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_order_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_order_shipper_store` FOREIGN KEY (`shipper_id`, `store_id`) REFERENCES `shippers` (`id`, `store_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `order_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `order_id` CHAR(24) NOT NULL,
  `menu_item_id` CHAR(24) NULL,
  `item_name` VARCHAR(180) NOT NULL,
  `item_category` ENUM('Burgers','Pizzas','Drinks','Sides','Desserts','Combos') NULL,
  `quantity` SMALLINT UNSIGNED NOT NULL,
  `unit_price` BIGINT UNSIGNED NOT NULL,
  CHECK (`quantity` > 0),
  INDEX `idx_order_item_product` (`menu_item_id`),
  CONSTRAINT `fk_order_item_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_order_item_menu` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `order_status_history` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `order_id` CHAR(24) NOT NULL,
  `status` ENUM('pending','confirmed','preparing','ready','out_for_delivery','delivered','cancelled') NOT NULL,
  `changed_at` DATETIME(3) NOT NULL,
  INDEX `idx_status_history_order_time` (`order_id`, `changed_at`),
  CONSTRAINT `fk_status_history_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `reviews` (
  `id` CHAR(24) PRIMARY KEY,
  `order_id` CHAR(24) NOT NULL UNIQUE,
  `customer_id` CHAR(24) NOT NULL,
  `store_id` CHAR(24) NOT NULL,
  `rating` TINYINT UNSIGNED NOT NULL,
  `comment` VARCHAR(1000) NOT NULL DEFAULT '',
  `created_at` DATETIME(3) NOT NULL,
  CHECK (`rating` BETWEEN 1 AND 5),
  INDEX `idx_review_store_rating` (`store_id`, `rating`),
  INDEX `idx_review_customer` (`customer_id`),
  CONSTRAINT `fk_review_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_review_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_review_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

"""


def generate_sql(collections: dict[str, list[dict[str, Any]]]) -> str:
    stores = collections["stores"]
    customers = collections["customers"]
    menu_items = collections["menuitems"]
    shippers = collections["shippers"]
    orders = collections["orders"]
    reviews = collections["reviews"]

    menu_by_id = {item["_id"]: item for item in menu_items}
    statements = [SCHEMA]
    statements.append(insert_statement("stores", ["id", "name", "address", "phone", "longitude", "latitude", "open_time", "close_time", "status", "created_at", "updated_at"], [
        [row["_id"], row["name"], row["address"], row["phone"], row["location"]["coordinates"][0], row["location"]["coordinates"][1], row["openHours"]["open"], row["openHours"]["close"], row["status"], row["createdAt"], row["updatedAt"]]
        for row in stores
    ]))
    statements.append(insert_statement("customers", ["id", "name", "email", "phone", "address", "total_spent", "order_count", "created_at", "updated_at"], [
        [row["_id"], row["name"], row["email"], row["phone"], row["address"], row.get("totalSpent", 0), row.get("orderCount", 0), row["createdAt"], row["updatedAt"]]
        for row in customers
    ]))
    statements.append(insert_statement("menu_items", ["id", "name", "category", "price", "description", "image", "is_available", "created_at", "updated_at"], [
        [row["_id"], row["name"], row["category"], row["price"], row.get("description", ""), row.get("image", ""), row.get("isAvailable", True), row["createdAt"], row["updatedAt"]]
        for row in menu_items
    ]))
    statements.append(insert_statement("shippers", ["id", "store_id", "full_name", "phone", "vehicle", "license_plate", "status", "created_at", "updated_at"], [
        [row["_id"], row["storeId"], row["fullName"], row["phone"], row.get("vehicle", "Motorbike"), row["licensePlate"], row["status"], row["createdAt"], row["updatedAt"]]
        for row in shippers
    ]))
    statements.append(insert_statement("orders", ["id", "customer_id", "store_id", "shipper_id", "subtotal", "delivery_fee", "total_amount", "status", "payment_method", "delivery_address", "note", "created_at", "updated_at"], [
        [row["_id"], row["customerId"], row["storeId"], row.get("shipperId"), row["subtotal"], row["deliveryFee"], row["totalAmount"], row["status"], row["paymentMethod"], row["deliveryAddress"], row.get("note", ""), row["createdAt"], row["updatedAt"]]
        for row in orders
    ]))

    item_rows: list[list[Any]] = []
    history_rows: list[list[Any]] = []
    for order in orders:
        for item in order["items"]:
            fallback_category = menu_by_id.get(item["menuItemId"], {}).get("category")
            item_rows.append([order["_id"], item["menuItemId"], item["name"], item.get("category", fallback_category), item["qty"], item["price"]])
        for history in order.get("statusHistory", []):
            history_rows.append([order["_id"], history["status"], history["at"]])
    statements.append(insert_statement("order_items", ["order_id", "menu_item_id", "item_name", "item_category", "quantity", "unit_price"], item_rows))
    statements.append(insert_statement("order_status_history", ["order_id", "status", "changed_at"], history_rows))
    statements.append(insert_statement("reviews", ["id", "order_id", "customer_id", "store_id", "rating", "comment", "created_at"], [
        [row["_id"], row["orderId"], row["customerId"], row["storeId"], row["rating"], row.get("comment", ""), row["createdAt"]]
        for row in reviews
    ]))

    statements.append(r"""
CREATE OR REPLACE VIEW `v_store_revenue` AS
SELECT s.id AS store_id, s.name AS store_name,
       COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN o.total_amount ELSE 0 END), 0) AS revenue_vnd,
       COUNT(o.id) AS order_count,
       COALESCE(SUM(o.status = 'delivered'), 0) AS delivered_count
FROM stores s LEFT JOIN orders o ON o.store_id = s.id
GROUP BY s.id, s.name;

CREATE OR REPLACE VIEW `v_daily_revenue` AS
SELECT DATE(created_at) AS order_date,
       SUM(total_amount) AS revenue_vnd,
       COUNT(*) AS delivered_orders
FROM orders
WHERE status = 'delivered'
GROUP BY DATE(created_at);

CREATE OR REPLACE VIEW `v_category_revenue` AS
SELECT COALESCE(oi.item_category, 'Combos') AS category,
       SUM(oi.quantity * oi.unit_price) AS revenue_vnd,
       SUM(oi.quantity) AS items_sold
FROM order_items oi JOIN orders o ON o.id = oi.order_id
WHERE o.status = 'delivered'
GROUP BY COALESCE(oi.item_category, 'Combos');

CREATE OR REPLACE VIEW `v_top_items` AS
SELECT oi.menu_item_id, oi.item_name, oi.item_category,
       SUM(oi.quantity) AS items_sold,
       SUM(oi.quantity * oi.unit_price) AS revenue_vnd
FROM order_items oi JOIN orders o ON o.id = oi.order_id
WHERE o.status = 'delivered'
GROUP BY oi.menu_item_id, oi.item_name, oi.item_category;

CREATE OR REPLACE VIEW `v_order_status_breakdown` AS
SELECT status, COUNT(*) AS order_count, SUM(total_amount) AS order_value_vnd
FROM orders GROUP BY status;
""")

    statements.append(r"""
DROP PROCEDURE IF EXISTS `sp_transition_order`;
DROP PROCEDURE IF EXISTS `sp_assign_order_shipper`;
DELIMITER $$
CREATE PROCEDURE `sp_transition_order`(IN p_order_id CHAR(24), IN p_next_status VARCHAR(24))
main: BEGIN
  DECLARE v_status VARCHAR(24) DEFAULT NULL;
  DECLARE v_customer_id CHAR(24) DEFAULT NULL;
  DECLARE v_shipper_id CHAR(24) DEFAULT NULL;
  DECLARE v_shipper_status VARCHAR(16) DEFAULT NULL;
  DECLARE v_total BIGINT UNSIGNED DEFAULT 0;
  DECLARE v_active_orders INT DEFAULT 0;
  DECLARE v_found BOOLEAN DEFAULT TRUE;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_found = FALSE;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  START TRANSACTION;
  SELECT status, customer_id, shipper_id, total_amount
    INTO v_status, v_customer_id, v_shipper_id, v_total
    FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT v_found THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Order not found'; END IF;

  IF NOT (
    (v_status = 'pending' AND p_next_status IN ('confirmed','cancelled')) OR
    (v_status = 'confirmed' AND p_next_status IN ('preparing','cancelled')) OR
    (v_status = 'preparing' AND p_next_status IN ('ready','cancelled')) OR
    (v_status = 'ready' AND p_next_status IN ('out_for_delivery','cancelled')) OR
    (v_status = 'out_for_delivery' AND p_next_status IN ('delivered','cancelled'))
  ) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid order status transition'; END IF;
  IF p_next_status = 'out_for_delivery' THEN
    IF v_shipper_id IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Assign a shipper before dispatch';
    END IF;
    SET v_found = TRUE;
    SELECT status INTO v_shipper_status FROM shippers WHERE id = v_shipper_id FOR UPDATE;
    IF NOT v_found OR v_shipper_status <> 'busy' THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Assigned shipper must be reserved before dispatch';
    END IF;
  END IF;

  UPDATE orders SET status = p_next_status, updated_at = UTC_TIMESTAMP(3) WHERE id = p_order_id;
  INSERT INTO order_status_history (order_id, status, changed_at)
    VALUES (p_order_id, p_next_status, UTC_TIMESTAMP(3));
  IF p_next_status = 'delivered' THEN
    UPDATE customers SET total_spent = total_spent + v_total WHERE id = v_customer_id;
  END IF;
  IF p_next_status IN ('delivered','cancelled') AND v_shipper_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_active_orders FROM orders
      WHERE shipper_id = v_shipper_id AND id <> p_order_id
        AND status NOT IN ('delivered','cancelled');
    IF v_active_orders = 0 THEN
      UPDATE shippers SET status = 'available' WHERE id = v_shipper_id AND status = 'busy';
    END IF;
  END IF;
  COMMIT;
END$$

CREATE PROCEDURE `sp_assign_order_shipper`(IN p_order_id CHAR(24), IN p_shipper_id CHAR(24))
main: BEGIN
  DECLARE v_order_status VARCHAR(24) DEFAULT NULL;
  DECLARE v_store_id CHAR(24) DEFAULT NULL;
  DECLARE v_old_shipper_id CHAR(24) DEFAULT NULL;
  DECLARE v_shipper_store_id CHAR(24) DEFAULT NULL;
  DECLARE v_shipper_status VARCHAR(24) DEFAULT NULL;
  DECLARE v_active_orders INT DEFAULT 0;
  DECLARE v_found BOOLEAN DEFAULT TRUE;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_found = FALSE;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  START TRANSACTION;
  SELECT status, store_id, shipper_id INTO v_order_status, v_store_id, v_old_shipper_id
    FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT v_found THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Order not found'; END IF;
  IF v_order_status IN ('delivered','cancelled') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot assign a shipper to a closed order';
  END IF;
  IF v_old_shipper_id = p_shipper_id THEN COMMIT; LEAVE main; END IF;

  SET v_found = TRUE;
  SELECT store_id, status INTO v_shipper_store_id, v_shipper_status
    FROM shippers WHERE id = p_shipper_id FOR UPDATE;
  IF NOT v_found THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Shipper not found'; END IF;
  IF v_shipper_store_id <> v_store_id THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Shipper must belong to the order store'; END IF;
  IF v_shipper_status <> 'available' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Shipper is not available'; END IF;
  SELECT COUNT(*) INTO v_active_orders FROM orders
    WHERE shipper_id = p_shipper_id AND id <> p_order_id
      AND status NOT IN ('delivered','cancelled');
  IF v_active_orders > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Shipper already has an active order'; END IF;

  UPDATE shippers SET status = 'busy' WHERE id = p_shipper_id AND status = 'available';
  IF ROW_COUNT() <> 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Shipper was claimed by another order'; END IF;
  UPDATE orders SET shipper_id = p_shipper_id, updated_at = UTC_TIMESTAMP(3) WHERE id = p_order_id;

  IF v_old_shipper_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_active_orders FROM orders
      WHERE shipper_id = v_old_shipper_id AND id <> p_order_id
        AND status NOT IN ('delivered','cancelled');
    IF v_active_orders = 0 THEN
      UPDATE shippers SET status = 'available' WHERE id = v_old_shipper_id AND status = 'busy';
    END IF;
  END IF;
  COMMIT;
END$$
DELIMITER ;
""")

    statements.append(r"""
-- Sanity check: expected totals are 5 stores, 8 customers, 12 menu items,
-- 5 shippers, 45 orders and 15 reviews (90 demo records altogether).
SELECT 'stores' AS collection_name, COUNT(*) AS row_count FROM stores
UNION ALL SELECT 'customers', COUNT(*) FROM customers
UNION ALL SELECT 'menu_items', COUNT(*) FROM menu_items
UNION ALL SELECT 'shippers', COUNT(*) FROM shippers
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'reviews', COUNT(*) FROM reviews;
""")
    return "\n".join(statements)


def main() -> None:
    parser = argparse.ArgumentParser(description="Export MongoDB Extended JSON demo fixtures as a MySQL SQL script")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT, help="folder containing the six demo JSON files")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="path for the generated SQL file")
    args = parser.parse_args()
    collections = load_collections(args.input)
    sql = generate_sql(collections)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(sql, encoding="utf-8", newline="\n")
    counts = {name: len(rows) for name, rows in collections.items()}
    print(f"Wrote {args.output} ({sum(counts.values())} source records): {counts}")


if __name__ == "__main__":
    main()
