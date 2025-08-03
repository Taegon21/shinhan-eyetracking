// main.go
package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/websocket"
	"github.com/segmentio/kafka-go"
	_ "github.com/lib/pq"
)

type GazeData struct {
	X  float64 `json:"x"`
	Y  float64 `json:"y"`
	TS int64   `json:"ts"`
}

var (
	db *sql.DB
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}
	kafkaWriter *kafka.Writer
)

func main() {
	// 환경변수에서 Kafka 브로커 주소 가져오기
	kafkaBrokers := os.Getenv("KAFKA_BROKERS")
	if kafkaBrokers == "" {
		kafkaBrokers = "localhost:9092"
	}
	
	kafkaWriter = kafka.NewWriter(kafka.WriterConfig{
		Brokers:      []string{kafkaBrokers},
		Topic:        "gaze-data",
		Balancer:     &kafka.LeastBytes{},
		BatchTimeout: 10 * time.Millisecond,
		BatchSize:    100,
	})
	defer kafkaWriter.Close()

	// PostgreSQL 연결
	initDB()
	defer db.Close()

	testKafkaConnection()

	http.HandleFunc("/ws", wsHandler)
	http.HandleFunc("/data", dataHandler)
	http.HandleFunc("/clear", clearDataHandler)

	log.Println("✅ 서버 실행: http://localhost:8080/ws")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func initDB() {
	var err error
	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		dbHost = "localhost"
	}
	
	connectionString := "host=" + dbHost + " port=5432 user=admin password=1q2w3e4r dbname=eyetracking sslmode=disable"
	db, err = sql.Open("postgres", connectionString)
	if err != nil {
		log.Fatal("❌ DB 연결 실패:", err)
	}

	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS gaze_data (
			id SERIAL PRIMARY KEY,
			x FLOAT NOT NULL,
			y FLOAT NOT NULL,
			timestamp BIGINT NOT NULL,
			created_at TIMESTAMP DEFAULT NOW()
		)
	`)
	if err != nil {
		log.Fatal("❌ 테이블 생성 실패:", err)
	}

	log.Println("✅ PostgreSQL 연결 완료")
}

func testKafkaConnection() {
	err := kafkaWriter.WriteMessages(context.Background(),
		kafka.Message{
			Key:   []byte("test"),
			Value: []byte(`{"message": "서버 시작됨", "timestamp": "` + time.Now().Format(time.RFC3339) + `"}`),
		},
	)
	if err != nil {
		log.Printf("❌ Kafka 연결 실패: %v", err)
	} else {
		log.Println("✅ Kafka 연결 성공")
	}
}

func wsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("업그레이드 실패:", err)
		return
	}
	defer conn.Close()

	log.Println("🟢 클라이언트 연결됨")

	for {
		var gazeData GazeData
		err := conn.ReadJSON(&gazeData)
		if err != nil {
			log.Printf("읽기 종료: %v", err)
			break
		}
		log.Printf("📊 수신: x=%.2f, y=%.2f", gazeData.X, gazeData.Y)

		go sendToKafka(gazeData)
	}
}

func sendToKafka(data GazeData) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		log.Printf("JSON 변환 실패: %v", err)
		return
	}

	err = kafkaWriter.WriteMessages(context.Background(),
		kafka.Message{
			Key:   []byte("gaze"),
			Value: jsonData,
		},
	)
	if err != nil {
		log.Printf("⚠️ Kafka 전송 실패: %v", err)
	} else {
		log.Printf("📦 Kafka 전송 성공: %s", string(jsonData))
	}
}

func dataHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, x, y, timestamp, created_at FROM gaze_data ORDER BY created_at DESC LIMIT 100")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var results []map[string]interface{}
	for rows.Next() {
		var id int
		var x, y float64
		var timestamp int64
		var createdAt time.Time

		err := rows.Scan(&id, &x, &y, &timestamp, &createdAt)
		if err != nil {
			continue
		}
		results = append(results, map[string]interface{}{
			"id":         id,
			"x":          x,
			"y":          y,
			"timestamp":  timestamp,
			"created_at": createdAt.Format("2006-01-02 15:04:05"),
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"count": len(results),
		"data":  results,
	})
}

func clearDataHandler(w http.ResponseWriter, r *http.Request) {
	result, err := db.Exec("DELETE FROM gaze_data")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	rowsAffected, _ := result.RowsAffected()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":      "데이터 삭제 완료",
		"deleted_rows": rowsAffected,
	})

	log.Printf("🗑️ 삭제 완료: %d개 행", rowsAffected)
}
