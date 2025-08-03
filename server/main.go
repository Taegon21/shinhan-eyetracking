package main

import (
    "context"
    "encoding/json"
    "log"
    "net/http"
    "time"

    "github.com/gorilla/websocket"
    "github.com/segmentio/kafka-go"
)

type GazeData struct {
    X  float64 `json:"x"`
    Y  float64 `json:"y"`
    TS int64   `json:"ts"`
}

var upgrader = websocket.Upgrader{
    CheckOrigin: func(r *http.Request) bool { return true },
}

// Kafka 설정 개선
var kafkaWriter = kafka.NewWriter(kafka.WriterConfig{
    Brokers:      []string{"localhost:9092"},
    Topic:        "gaze-data",
    Balancer:     &kafka.LeastBytes{},
    BatchTimeout: 10 * time.Millisecond,
    BatchSize:    100,
})

func main() {
    defer kafkaWriter.Close()

    // Kafka 연결 테스트
    testKafkaConnection()

    http.HandleFunc("/ws", wsHandler)
    log.Println("✅ WebSocket 서버 실행 중 (http://localhost:8080/ws)")
    log.Fatal(http.ListenAndServe(":8080", nil))
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

        log.Printf("📊 가시선 데이터: x=%.2f, y=%.2f", gazeData.X, gazeData.Y)

        // JSON으로 Kafka에 전송
        jsonData, err := json.Marshal(gazeData)
        if err != nil {
            log.Printf("JSON 변환 실패: %v", err)
            continue
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

    log.Println("🔌 클라이언트 연결 종료")
}