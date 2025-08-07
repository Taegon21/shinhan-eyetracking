// main.go
package main

import (
	"log"
	"net/http"

	"shinhan-eyetracking/server/config"
	"shinhan-eyetracking/server/database"
	"shinhan-eyetracking/server/handlers"
	"shinhan-eyetracking/server/services"
)

func main() {
	// 설정 로드
	cfg := config.LoadConfig()

	// 데이터베이스 초기화
	db, err := database.New(cfg)
	if err != nil {
		log.Fatal("❌ 데이터베이스 초기화 실패:", err)
	}
	defer db.Close()

	// 서비스들 초기화
	kafkaService := services.NewKafkaService(cfg.KafkaBrokers)
	defer kafkaService.Close()

	websocketService := services.NewWebSocketService()
	gazeService := services.NewGazeService(db, kafkaService, websocketService)

	// 핸들러들 초기화
	wsHandler := handlers.NewWebSocketHandler(gazeService, websocketService)
	apiHandler := handlers.NewAPIHandler(db, gazeService, websocketService)

	// 라우트 설정
	http.HandleFunc("/ws", wsHandler.HandleWebSocket)
	http.HandleFunc("/data", apiHandler.DataHandler)
	http.HandleFunc("/clear", apiHandler.ClearDataHandler)
	http.HandleFunc("/page-status", apiHandler.PageStatusHandler)

	log.Printf("✅ 서버 실행: http://localhost:%s", cfg.Port)
	log.Fatal(http.ListenAndServe(":"+cfg.Port, nil))
}
