CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS citizen_report (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL REFERENCES member(id),
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    report_location geometry(Point, 4326) NOT NULL,
    user_location geometry(Point, 4326) NOT NULL,
    user_accuracy_meters DOUBLE PRECISION,
    distance_meters DOUBLE PRECISION NOT NULL,
    gps_verified BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_citizen_report_location
    ON citizen_report
    USING GIST (report_location);

CREATE TABLE IF NOT EXISTS citizen_report_image (
    id BIGSERIAL PRIMARY KEY,
    report_id BIGINT NOT NULL REFERENCES citizen_report(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    stored_file_name VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
