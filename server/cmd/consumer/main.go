package main

import (
    "context"
    "database/sql"
    "encoding/json"
    "log"
    "os"

    "github.com/segmentio/kafka-go"
    _ "github.com/lib/pq"
)

// 메인 서버와 동일한 구조로 수정
type GazeData struct {
    X           float64 `json:"x"`
    Y           float64 `json:"y"`
    Timestamp   int64   `json:"timestamp"`  
    SectionID   *string `json:"sectionId,omitempty"`
    CurrentPage *string `json:"currentPage,omitempty"`
}

func main() {
    // DB 연결
    dbHost := os.Getenv("DB_HOST")
    if dbHost == "" {
        dbHost = "localhost"
    }

    connectionString := "host=" + dbHost + " port=5432 user=admin password=1q2w3e4r dbname=eyetracking sslmode=disable"
    db, err := sql.Open("postgres", connectionString)
    if err != nil {
        log.Fatal("❌ DB 연결 실패:", err)
    }
    defer db.Close()
    log.Println("✅ Consumer PostgreSQL 연결 완료")

    // Kafka Consumer 설정
    kafkaBrokers := os.Getenv("KAFKA_BROKERS")
    if kafkaBrokers == "" {
        kafkaBrokers = "localhost:9092"
    }

    r := kafka.NewReader(kafka.ReaderConfig{
        Brokers:     []string{kafkaBrokers},
        Topic:       "gaze-data",
        GroupID:     "gaze-consumer-group",
        StartOffset: kafka.FirstOffset, // 처음부터 읽기
    })
    defer r.Close()

    log.Println("📥 Kafka Consumer 시작 - DB 저장 담당")

    for {
        m, err := r.ReadMessage(context.Background())
        if err != nil {
            log.Printf("❌ Kafka 메시지 수신 실패: %v", err)
            continue
        }

        var data GazeData
        if err := json.Unmarshal(m.Value, &data); err != nil {
            continue
        }

        // 확장된 데이터 저장
        _, err = db.Exec(`
            INSERT INTO gaze_data (x, y, timestamp, section_id, current_page) 
            VALUES ($1, $2, $3, $4, $5)`,
            data.X, data.Y, data.Timestamp, data.SectionID, data.CurrentPage)
        
        if err != nil {
            log.Printf("💾 DB 저장 실패: %v", err)
        } else {
            log.Printf("💾 저장 완료: x=%.2f y=%.2f page=%v section=%v", 
                data.X, data.Y, data.CurrentPage, data.SectionID)
        }
    }
}