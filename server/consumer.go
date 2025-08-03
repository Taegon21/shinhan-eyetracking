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

type GazeData struct {
	X  float64 `json:"x"`
	Y  float64 `json:"y"`
	TS int64   `json:"ts"`
}

func main() {
	// 환경변수에서 DB 호스트 가져오기
	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		dbHost = "localhost"
	}

	// PostgreSQL 연결
	connectionString := "host=" + dbHost + " port=5432 user=admin password=1q2w3e4r dbname=eyetracking sslmode=disable"
	db, err := sql.Open("postgres", connectionString)
	if err != nil {
		log.Fatal("❌ DB 연결 실패:", err)
	}
	defer db.Close()
	log.Println("✅ PostgreSQL 연결 완료")

	// 환경변수에서 Kafka 브로커 주소 가져오기
	kafkaBrokers := os.Getenv("KAFKA_BROKERS")
	if kafkaBrokers == "" {
		kafkaBrokers = "localhost:9092"
	}

	// Kafka Reader 설정
	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers:     []string{kafkaBrokers},
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
