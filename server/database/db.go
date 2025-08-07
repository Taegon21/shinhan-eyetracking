package database

import (
    "database/sql"
    "fmt"
    "log"

    "shinhan-eyetracking/server/config"
    "shinhan-eyetracking/server/models"

    _ "github.com/lib/pq"
)

type DB struct {
    conn *sql.DB
}

func New(cfg *config.Config) (*DB, error) {
    connectionString := fmt.Sprintf(
        "host=%s port=5432 user=%s password=%s dbname=%s sslmode=disable",
        cfg.DBHost, cfg.DBUser, cfg.DBPassword, cfg.DBName,
    )
    
    conn, err := sql.Open("postgres", connectionString)
    if err != nil {
        return nil, fmt.Errorf("DB 연결 실패: %w", err)
    }

    db := &DB{conn: conn}
    
    if err := db.createTables(); err != nil {
        return nil, fmt.Errorf("테이블 생성 실패: %w", err)
    }

    log.Println("✅ PostgreSQL 연결 완료")
    return db, nil
}

func (db *DB) Close() error {
    return db.conn.Close()
}

func (db *DB) createTables() error {
    // 시선 데이터 테이블
    _, err := db.conn.Exec(`
        CREATE TABLE IF NOT EXISTS gaze_data (
            id SERIAL PRIMARY KEY,
            x FLOAT NOT NULL,
            y FLOAT NOT NULL,
            timestamp BIGINT NOT NULL,
            section_id VARCHAR(100),
            current_page VARCHAR(100),
            created_at TIMESTAMP DEFAULT NOW()
        )
    `)
    if err != nil {
        return err
    }

    // 페이지 변경 이력 테이블
    _, err = db.conn.Exec(`
        CREATE TABLE IF NOT EXISTS page_changes (
            id SERIAL PRIMARY KEY,
            current_page VARCHAR(100) NOT NULL,
            timestamp BIGINT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        )
    `)
    return err
}

func (db *DB) SaveGazeData(data models.GazeData) error {
    _, err := db.conn.Exec(`
        INSERT INTO gaze_data (x, y, timestamp, section_id, current_page) 
        VALUES ($1, $2, $3, $4, $5)`,
        data.X, data.Y, data.Timestamp, data.SectionID, data.CurrentPage)
    return err
}

func (db *DB) SavePageChange(data models.PageChangeData) error {
    _, err := db.conn.Exec(`
        INSERT INTO page_changes (current_page, timestamp) 
        VALUES ($1, $2)`,
        data.CurrentPage, data.Timestamp)
    return err
}

func (db *DB) GetRecentGazeData(limit int) ([]map[string]interface{}, error) {
    rows, err := db.conn.Query(`
        SELECT id, x, y, timestamp, section_id, current_page, created_at 
        FROM gaze_data 
        ORDER BY created_at DESC 
        LIMIT $1`, limit)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var results []map[string]interface{}
    for rows.Next() {
        var id int
        var x, y float64
        var timestamp int64
        var sectionID, currentPage sql.NullString
        var createdAt sql.NullTime

        err := rows.Scan(&id, &x, &y, &timestamp, &sectionID, &currentPage, &createdAt)
        if err != nil {
            continue
        }

        result := map[string]interface{}{
            "id":        id,
            "x":         x,
            "y":         y,
            "timestamp": timestamp,
        }

        if createdAt.Valid {
            result["created_at"] = createdAt.Time.Format("2006-01-02 15:04:05")
        }
        if sectionID.Valid {
            result["section_id"] = sectionID.String
        }
        if currentPage.Valid {
            result["current_page"] = currentPage.String
        }

        results = append(results, result)
    }

    return results, nil
}

func (db *DB) ClearData() (gazeRows, pageRows int64, err error) {
    result1, err1 := db.conn.Exec("DELETE FROM gaze_data")
    result2, err2 := db.conn.Exec("DELETE FROM page_changes")

    if err1 != nil {
        return 0, 0, err1
    }
    if err2 != nil {
        return 0, 0, err2
    }

    gazeRows, _ = result1.RowsAffected()
    pageRows, _ = result2.RowsAffected()

    return gazeRows, pageRows, nil
}

func (db *DB) CleanOldData() (gazeRows, pageRows int64, err error) {
    result1, err1 := db.conn.Exec("DELETE FROM gaze_data WHERE created_at < NOW() - INTERVAL '7 days'")
    result2, err2 := db.conn.Exec("DELETE FROM page_changes WHERE created_at < NOW() - INTERVAL '7 days'")

    if err1 != nil {
        return 0, 0, err1
    }
    if err2 != nil {
        return 0, 0, err2
    }

    gazeRows, _ = result1.RowsAffected()
    pageRows, _ = result2.RowsAffected()

    return gazeRows, pageRows, nil
}