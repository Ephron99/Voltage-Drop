-- Voltage Drop Database Schema
-- This schema is IDEMPOTENT and SAFE to run on every server restart.
-- It does NOT drop any tables or data. It uses:
--   - CREATE DATABASE IF NOT EXISTS
--   - CREATE TABLE IF NOT EXISTS
--   - INSERT IGNORE for seed roles
-- Existing data is preserved across server restarts.

CREATE DATABASE IF NOT EXISTS voltage_drop;
USE voltage_drop;





CREATE TABLE IF NOT EXISTS roles (
    name VARCHAR(50) PRIMARY KEY,
    description VARCHAR(255),
    permissions JSON
);

CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    branch VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME NULL,
    FOREIGN KEY (role) REFERENCES roles(name)
);

CREATE TABLE IF NOT EXISTS locations (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500) NOT NULL,
    governorate VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS `lines` (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    voltage_level ENUM('MV', 'LV') NOT NULL,
    location_id CHAR(36) NOT NULL,
    FOREIGN KEY (location_id) REFERENCES locations(id)
);

CREATE TABLE IF NOT EXISTS transformers (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    capacity_kva INT NOT NULL,
    line_id CHAR(36) NOT NULL,
    FOREIGN KEY (line_id) REFERENCES `lines`(id)
);

CREATE TABLE IF NOT EXISTS progress_entries (
    id CHAR(36) PRIMARY KEY,
    entry_date DATE NOT NULL,
    location_id CHAR(36) NOT NULL,
    line_id CHAR(36) NOT NULL,
    voltage_level ENUM('MV', 'LV') NOT NULL,
    transformer_id CHAR(36) NOT NULL,
    completed_km DECIMAL(10,3) DEFAULT 0,
    transformers_installed INT DEFAULT 0,
    transformers_terminated INT DEFAULT 0,
    transformers_tested INT DEFAULT 0,
    transformers_commissioned INT DEFAULT 0,
    status ENUM('draft', 'submitted', 'approved', 'published', 'rejected') DEFAULT 'draft',
    site_engineer_id CHAR(36) NOT NULL,
    branch_manager_id CHAR(36) NULL,
    submitted_at DATETIME NULL,
    approved_at DATETIME NULL,
    published_at DATETIME NULL,
    rejection_comments TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(id),
    FOREIGN KEY (line_id) REFERENCES `lines`(id),
    FOREIGN KEY (transformer_id) REFERENCES transformers(id),
    FOREIGN KEY (site_engineer_id) REFERENCES users(id),
    FOREIGN KEY (branch_manager_id) REFERENCES users(id),
    INDEX idx_entry_date (entry_date),
    INDEX idx_status (status),
    INDEX idx_engineer (site_engineer_id),
    INDEX idx_manager (branch_manager_id)
);

INSERT IGNORE INTO roles (name, description, permissions) VALUES
('site_engineer', 'Site Engineer - Enters daily progress data', '{"progress":["create","edit","submit"],"dashboard":["view_own"]}'),
('branch_manager', 'Branch Manager - Reviews and approves progress', '{"progress":["review","approve","publish","reject"],"dashboard":["view_branch"]}'),
('planning', 'Planning Department - Creates scopes and budgets', '{"scope":["create","edit","manage_budget"],"progress":["view_all"]}'),
('senior_management', 'Senior Management - Views dashboards and approves scope changes', '{"dashboard":["view_all"],"scope":["approve_changes"],"comments":["add"]}'),
('it_engineer', 'IT Engineer - Platform maintenance only', '{"system":["maintain","manage_users_no_data"]}'),
('trusted_admin', 'Trusted Administrator - Full system control', '{"system":["full_control","backup","configure","correct_data"]}');
