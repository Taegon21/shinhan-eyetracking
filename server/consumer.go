package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"

	"github.com/segmentio/kafka-go"
	_ "github.com/lib/pq"
)

type GazeData struct {
	X  float64 `json:"x"`
	Y  float64 `json:"y"`
	TS int64   `json:"ts"`
}

func main() {
	// PostgreSQL 연결
	db, err := sql.Open("postgres", "host=localhost port=5432 user=admin password=1q2w3e4r dbname=eyetracking sslmode=disable")
	if err != nil {
		log.Fatal("❌ DB 연결 실패:", err)
	}
	defer db.Close()
	log.Println("✅ PostgreSQL 연결 완료")

	// Kafka Reader 설정
	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers:     []string{"localhost:9092"},
		Topic:       "gaze-data",
		GroupID:     "gaze-consumer-group",
		StartOffset: kafka.LastOffset, // 최신 메시지만 수신
	})
	defer r.Close()

	log.Println("📥 Kafka Consumer 시작")

	for {
		m, err := r.ReadMessage(context.Background())
		if err != nil {
			log.Printf("❌ Kafka 메시지 수신 실패: %v", err)
			continue
		}

		var data GazeData
		if err := json.Unmarshal(m.Value, &data); err != nil {
			log.Printf("⚠️ JSON 파싱 실패: %v", err)
			continue
		}

		_, err = db.Exec("INSERT INTO gaze_data (x, y, timestamp) VALUES ($1, $2, $3)", data.X, data.Y, data.TS)
		if err != nil {
			log.Printf("💾 DB 저장 실패: %v", err)
		} else {
			log.Printf("💾 저장 완료: x=%.2f y=%.2f", data.X, data.Y)
		}
	}
}
