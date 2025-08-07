package services

import (
    "log"
    "sync"
    "time"

    "shinhan-eyetracking/server/database"
    "shinhan-eyetracking/server/models"
)

type GazeService struct {
    db               *database.DB
    kafkaService     *KafkaService
    websocketService *WebSocketService
    
    lastGazeData models.GazeData
    currentPage  string
    mu           sync.Mutex
    pageMu       sync.RWMutex
}

func NewGazeService(db *database.DB, kafka *KafkaService, websocket *WebSocketService) *GazeService {
    service := &GazeService{
        db:               db,
        kafkaService:     kafka,
        websocketService: websocket,
    }

    // 0.1초마다 데이터 전송하는 고루틴 시작
    go service.startDataBroadcast()
    
    // 1시간마다 오래된 데이터 정리
    go service.startDataCleanup()

    return service
}

func (g *GazeService) HandleGazeData(data models.GazeData) {
    g.mu.Lock()
    g.lastGazeData = data
    g.mu.Unlock()
}

func (g *GazeService) HandlePageChange(data models.PageChangeData) {
    // 현재 페이지 상태 업데이트
    g.pageMu.Lock()
    g.currentPage = data.CurrentPage
    g.pageMu.Unlock()

    // 데이터베이스에 페이지 변경 이력 저장
    if err := g.db.SavePageChange(data); err != nil {
        log.Printf("❌ 페이지 변경 DB 저장 실패: %v", err)
    }

    // 모든 클라이언트에게 페이지 변경 알림
    g.websocketService.BroadcastToClients("pageChange", data)

    log.Printf("📄 페이지 변경: %s", data.CurrentPage)
}

func (g *GazeService) GetCurrentPage() string {
    g.pageMu.RLock()
    defer g.pageMu.RUnlock()
    return g.currentPage
}

func (g *GazeService) startDataBroadcast() {
    ticker := time.NewTicker(100 * time.Millisecond)
    defer ticker.Stop()

    for range ticker.C {
        g.mu.Lock()
        if g.lastGazeData.X != 0 || g.lastGazeData.Y != 0 {
            // Kafka로 전송 (DB 저장은 Consumer가 담당)
            if err := g.kafkaService.SendGazeData(g.lastGazeData); err != nil {
                log.Printf("⚠️ Kafka 전송 실패: %v", err)
            }

            // 실시간 브로드캐스트만 담당
            g.websocketService.BroadcastToClients("gazeData", g.lastGazeData)
						
            g.lastGazeData = models.GazeData{}
        }
        g.mu.Unlock()
    }
}

func (g *GazeService) startDataCleanup() {
    ticker := time.NewTicker(1 * time.Hour)
    defer ticker.Stop()

    for range ticker.C {
        gazeRows, pageRows, err := g.db.CleanOldData()
        if err != nil {
            log.Printf("❌ 데이터 정리 실패: %v", err)
        } else {
            log.Printf("🗑️ 7일 이전 데이터 정리 완료: 시선 %d개, 페이지 변경 %d개", gazeRows, pageRows)
        }
    }
}