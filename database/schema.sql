DROP DATABASE IF EXISTS nyxa;

CREATE DATABASE IF NOT EXISTS nyxa
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE nyxa;

CREATE TABLE IF NOT EXISTS category (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_category_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user (
  id INT NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_email (email),
  UNIQUE KEY uq_user_username (username)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS event (
  id INT NOT NULL AUTO_INCREMENT,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  event_date DATETIME NOT NULL,
  venue VARCHAR(150) NOT NULL,
  address VARCHAR(255) NOT NULL,
  creator_id INT NOT NULL,
  category_id INT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_event_date (event_date),
  KEY idx_event_creator (creator_id),
  KEY idx_event_category (category_id),
  CONSTRAINT fk_event_creator
    FOREIGN KEY (creator_id) REFERENCES user (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_event_category
    FOREIGN KEY (category_id) REFERENCES category (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ticket (
  id INT NOT NULL AUTO_INCREMENT,
  purchased_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id INT NOT NULL,
  event_id INT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_ticket_user (user_id),
  KEY idx_ticket_event (event_id),
  CONSTRAINT fk_ticket_user
    FOREIGN KEY (user_id) REFERENCES user (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_ticket_event
    FOREIGN KEY (event_id) REFERENCES event (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS participant (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  role VARCHAR(80) NOT NULL,
  event_id INT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_participant_event (event_id),
  CONSTRAINT fk_participant_event
    FOREIGN KEY (event_id) REFERENCES event (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

INSERT INTO category (name) VALUES
  ('Concert'),
  ('Theater'),
  ('Sports');

CREATE USER 'nyxa_user'@'localhost' IDENTIFIED BY 'Clave1234';
GRANT ALL PRIVILEGES ON nyxa.* TO 'nyxa_user'@'localhost';
FLUSH PRIVILEGES;