-- password: password123
-- bcrypt hash: $2a$10$QB7kJZnNALrfySEwSetH9eEgXoovoQTmk2H/IkZ12ig4k.Yk2Ek0O
INSERT OR IGNORE INTO users (id, name, email, password_hash, role) VALUES
  ('u-manager-001', '管理者 田中', 'manager@example.com', '$2a$10$QB7kJZnNALrfySEwSetH9eEgXoovoQTmk2H/IkZ12ig4k.Yk2Ek0O', 'manager'),
  ('u-driver-001', '運転者 佐藤', 'driver1@example.com', '$2a$10$QB7kJZnNALrfySEwSetH9eEgXoovoQTmk2H/IkZ12ig4k.Yk2Ek0O', 'driver'),
  ('u-driver-002', '運転者 鈴木', 'driver2@example.com', '$2a$10$QB7kJZnNALrfySEwSetH9eEgXoovoQTmk2H/IkZ12ig4k.Yk2Ek0O', 'driver');

INSERT OR IGNORE INTO vehicles (id, name, plate) VALUES
  ('v-001', '営業車A', '品川 300 あ 1234'),
  ('v-002', 'トラックB', '品川 400 い 5678');
