// main.go
package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/segmentio/kafka-go"
	_ "github.com/lib/pq"
)

// 확장된 GazeData 구조체
type GazeData struct {
	X           float64 `json:"x"`
	Y           float64 `json:"y"`
	Timestamp   int64   `json:"timestamp"`
	SectionID   *string `json:"sectionId,omitempty"`
	CurrentPage *string `json:"currentPage,omitempty"`
}

// 페이지 변경 데이터
type PageChangeData struct {
	CurrentPage string `json:"currentPage"`
	Timestamp   int64  `json:"timestamp"`
}

// WebSocket 메시지 구조체
type WebSocketMessage struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

var (
	db          *sql.DB
	upgrader    = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}
	kafkaWriter *kafka.Writer
	
	// 디바운스용 변수들
	lastGazeData GazeData
	dataChannel  = make(chan GazeData, 1000)
	mu           sync.Mutex
	
	// 클라이언트 연결 관리
	clients    = make(map[*websocket.Conn]bool)
	clientsMu  sync.RWMutex
	
	// 현재 페이지 상태
	currentPage string
	pageMu      sync.RWMutex
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
		BatchTimeout: 100 * time.Millisecond,
		BatchSize:    100,
	})
	defer kafkaWriter.Close()

	// PostgreSQL 연결
	initDB()
	defer db.Close()

	testKafkaConnection()

	// 0.1초마다 데이터 전송하는 고루틴
	go func() {
		ticker := time.NewTicker(100 * time.Millisecond) // 0.1초
		defer ticker.Stop()
		
		for range ticker.C {
			mu.Lock()
			if lastGazeData.X != 0 || lastGazeData.Y != 0 {
				// 최신 데이터를 Kafka로 전송
				sendToKafka(lastGazeData)
				// 모든 클라이언트에게 브로드캐스트
				broadcastToClients("gazeData", lastGazeData)
				// 데이터베이스에 저장
				saveGazeDataToDB(lastGazeData)
				// 전송 후 초기화
				lastGazeData = GazeData{}
			}
			mu.Unlock()
		}
	}()

	// 1시간마다 오래된 데이터 정리
	go func() {
		ticker := time.NewTicker(1 * time.Hour)
		for range ticker.C {
			cleanOldData()
		}
	}()

	http.HandleFunc("/ws", wsHandler)
	http.HandleFunc("/data", dataHandler)
	http.HandleFunc("/clear", clearDataHandler)
	http.HandleFunc("/page-status", pageStatusHandler)

	log.Println("✅ 서버 실행: http://localhost:8080")
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

	// 확장된 테이블 생성
	_, err = db.Exec(`
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
		log.Fatal("❌ 테이블 생성 실패:", err)
	}

	// 페이지 변경 이력 테이블
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS page_changes (
			id SERIAL PRIMARY KEY,
			current_page VARCHAR(100) NOT NULL,
			timestamp BIGINT NOT NULL,
			created_at TIMESTAMP DEFAULT NOW()
		)
	`)
	if err != nil {
		log.Fatal("❌ 페이지 변경 테이블 생성 실패:", err)
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
	defer func() {
		clientsMu.Lock()
		delete(clients, conn)
		clientsMu.Unlock()
		conn.Close()
	}()

	// 클라이언트 연결 등록
	clientsMu.Lock()
	clients[conn] = true
	clientsMu.Unlock()

	log.Printf("🟢 클라이언트 연결됨 (총 %d개)", len(clients))

	for {
		var message WebSocketMessage
		err := conn.ReadJSON(&message)
		if err != nil {
			log.Printf("읽기 종료: %v", err)
			break
		}

		switch message.Type {
		case "gazeData":
			handleGazeData(message.Data)
		case "pageChange":
			handlePageChange(message.Data)
		default:
			log.Printf("알 수 없는 메시지 타입: %s", message.Type)
		}
	}
}

func handleGazeData(data interface{}) {
    jsonData, err := json.Marshal(data)
    if err != nil {
        log.Printf("시선 데이터 마샬링 실패: %v", err)
        return
    }

    var gazeData GazeData
    err = json.Unmarshal(jsonData, &gazeData)
    if err != nil {
        log.Printf("시선 데이터 언마샬링 실패: %v", err)
        return
    }

    // 최신 데이터로 업데이트
    mu.Lock()
    lastGazeData = gazeData
    mu.Unlock()
}

func handlePageChange(data interface{}) {
    jsonData, err := json.Marshal(data)
    if err != nil {
        log.Printf("페이지 변경 데이터 마샬링 실패: %v", err)
        return
    }

    var pageData PageChangeData
    err = json.Unmarshal(jsonData, &pageData)
    if err != nil {
        log.Printf("페이지 변경 데이터 언마샬링 실패: %v", err)
        return
    }

    // 현재 페이지 상태 업데이트
    pageMu.Lock()
    currentPage = pageData.CurrentPage
    pageMu.Unlock()

    // 데이터베이스에 페이지 변경 이력 저장
    savePageChangeToDB(pageData)

    // 모든 클라이언트에게 페이지 변경 알림
    broadcastToClients("pageChange", pageData)

    log.Printf("📄 페이지 변경: %s", pageData.CurrentPage)
}

func broadcastToClients(messageType string, data interface{}) {
    message := WebSocketMessage{
        Type: messageType,
        Data: data,
    }

    clientsMu.RLock()
    defer clientsMu.RUnlock()

    for client := range clients {
        err := client.WriteJSON(message)
        if err != nil {
            log.Printf("클라이언트 전송 실패: %v", err)
            // 연결이 끊어진 클라이언트는 삭제하지 않고 다음 메시지에서 처리
        }
    }
}

func saveGazeDataToDB(data GazeData) {
    _, err := db.Exec(`
        INSERT INTO gaze_data (x, y, timestamp, section_id, current_page) 
        VALUES ($1, $2, $3, $4, $5)`,
        data.X, data.Y, data.Timestamp, data.SectionID, data.CurrentPage)
    if err != nil {
        log.Printf("❌ 시선 데이터 DB 저장 실패: %v", err)
    }
}

func savePageChangeToDB(data PageChangeData) {
    _, err := db.Exec(`
        INSERT INTO page_changes (current_page, timestamp) 
        VALUES ($1, $2)`,
        data.CurrentPage, data.Timestamp)
    if err != nil {
        log.Printf("❌ 페이지 변경 DB 저장 실패: %v", err)
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
    }
}

func dataHandler(w http.ResponseWriter, r *http.Request) {
    rows, err := db.Query(`
        SELECT id, x, y, timestamp, section_id, current_page, created_at 
        FROM gaze_data 
        ORDER BY created_at DESC 
        LIMIT 100`)
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
        var sectionID, currentPage sql.NullString
        var createdAt time.Time

        err := rows.Scan(&id, &x, &y, &timestamp, &sectionID, &currentPage, &createdAt)
        if err != nil {
            continue
        }
        
        result := map[string]interface{}{
            "id":         id,
            "x":          x,
            "y":          y,
            "timestamp":  timestamp,
            "created_at": createdAt.Format("2006-01-02 15:04:05"),
        }
        
        if sectionID.Valid {
            result["section_id"] = sectionID.String
        }
        if currentPage.Valid {
            result["current_page"] = currentPage.String
        }
        
        results = append(results, result)
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "count": len(results),
        "data":  results,
    })
}

func pageStatusHandler(w http.ResponseWriter, r *http.Request) {
    pageMu.RLock()
    page := currentPage
    pageMu.RUnlock()

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "current_page": page,
        "clients":      len(clients),
        "timestamp":    time.Now().Unix(),
    })
}

func clearDataHandler(w http.ResponseWriter, r *http.Request) {
    result1, err1 := db.Exec("DELETE FROM gaze_data")
    result2, err2 := db.Exec("DELETE FROM page_changes")
    
    if err1 != nil || err2 != nil {
        http.Error(w, "데이터 삭제 실패", http.StatusInternalServerError)
        return
    }
    
    gazeRows, _ := result1.RowsAffected()
    pageRows, _ := result2.RowsAffected()

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "message":           "데이터 삭제 완료",
        "deleted_gaze_rows": gazeRows,
        "deleted_page_rows": pageRows,
    })

    log.Printf("🗑️ 삭제 완료: 시선 데이터 %d개, 페이지 변경 %d개", gazeRows, pageRows)
}

func cleanOldData() {
    result1, err1 := db.Exec("DELETE FROM gaze_data WHERE created_at < NOW() - INTERVAL '7 days'")
    result2, err2 := db.Exec("DELETE FROM page_changes WHERE created_at < NOW() - INTERVAL '7 days'")
    
    if err1 != nil {
        log.Printf("❌ 시선 데이터 정리 실패: %v", err1)
    }
    if err2 != nil {
        log.Printf("❌ 페이지 변경 데이터 정리 실패: %v", err2)
    }
    
    if err1 == nil && err2 == nil {
        gazeRows, _ := result1.RowsAffected()
        pageRows, _ := result2.RowsAffected()
        log.Printf("🗑️ 7일 이전 데이터 정리 완료: 시선 %d개, 페이지 변경 %d개", gazeRows, pageRows)
    }
}
