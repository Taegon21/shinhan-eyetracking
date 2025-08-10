package services

import (
    "encoding/json"
    "log"
    "sync"
    "time"
    "shinhan-eyetracking/server/models"
    "github.com/gorilla/websocket"
)

type WebSocketService struct {
    clients   map[*websocket.Conn]bool
    clientsMu sync.RWMutex
}

func NewWebSocketService() *WebSocketService {
    log.Println("🔧 WebSocket 서비스 초기화")
    return &WebSocketService{
        clients: make(map[*websocket.Conn]bool),
    }
}

func (ws *WebSocketService) AddClient(conn *websocket.Conn) {
    ws.clientsMu.Lock()
    ws.clients[conn] = true
    clientCount := len(ws.clients)
    ws.clientsMu.Unlock()

    // 클라이언트 정보 로깅
    remoteAddr := conn.RemoteAddr().String()
    log.Printf("🟢 새 클라이언트 연결: %s (총 %d개 클라이언트)", remoteAddr, clientCount)
    
    // 연결 상태를 다른 클라이언트들에게 알림
    ws.broadcastClientCount()
}

func (ws *WebSocketService) RemoveClient(conn *websocket.Conn) {
    ws.clientsMu.Lock()
    if _, exists := ws.clients[conn]; exists {
        delete(ws.clients, conn)
        clientCount := len(ws.clients)
        ws.clientsMu.Unlock()

        remoteAddr := conn.RemoteAddr().String()
        log.Printf("🔴 클라이언트 연결 해제: %s (총 %d개 클라이언트)", remoteAddr, clientCount)
        
        // 연결 상태를 다른 클라이언트들에게 알림
        ws.broadcastClientCount()
    } else {
        ws.clientsMu.Unlock()
        log.Printf("⚠️ 존재하지 않는 클라이언트 삭제 시도")
    }
}

func (ws *WebSocketService) BroadcastToClients(messageType string, data interface{}) {
    message := models.WebSocketMessage{
        Type: messageType,
        Data: data,
    }

    ws.clientsMu.RLock()
    clientCount := len(ws.clients)
    ws.clientsMu.RUnlock()

    if clientCount == 0 {
        log.Printf("📭 클라이언트가 없어서 브로드캐스트 스킵: %s", messageType)
        return
    }

    // 성공/실패 카운터
    successCount := 0
    failedCount := 0
    var failedClients []*websocket.Conn

    ws.clientsMu.RLock()
    for client := range ws.clients {
        err := client.WriteJSON(message)
        if err != nil {
            failedCount++
            failedClients = append(failedClients, client)
            log.Printf("❌ 브로드캐스트 실패 [%s]: %s -> %v", 
                messageType, client.RemoteAddr().String(), err)
        } else {
            successCount++
        }
    }
    ws.clientsMu.RUnlock()

    // 실패한 클라이언트들 정리
    if len(failedClients) > 0 {
        ws.cleanupFailedClients(failedClients)
    }

    // 브로드캐스트 결과 로깅
    if messageType == "gazeData" {
        if failedCount > 0 {
            log.Printf("👁️ 시선 데이터 전송: 성공 %d, 실패 %d", successCount, failedCount)
        }
    } else {
        // 페이지 변경 등 중요한 메시지는 상세히
        log.Printf("📢 브로드캐스트 [%s]: 성공 %d, 실패 %d, 총 클라이언트 %d", 
            messageType, successCount, failedCount, clientCount)
        
        if messageType == "pageChange" {
            if jsonData, err := json.Marshal(data); err == nil {
                log.Printf("📄 전송된 페이지 변경 데이터: %s", string(jsonData))
            }
        }
    }
}

func (ws *WebSocketService) cleanupFailedClients(failedClients []*websocket.Conn) {
    ws.clientsMu.Lock()
    cleanedCount := 0
    for _, client := range failedClients {
        if _, exists := ws.clients[client]; exists {
            delete(ws.clients, client)
            cleanedCount++
            client.Close() // 연결 정리
        }
    }
    ws.clientsMu.Unlock()
    
    if cleanedCount > 0 {
        log.Printf("🧹 실패한 클라이언트 %d개 정리 완료", cleanedCount)
    }
}

func (ws *WebSocketService) broadcastClientCount() {
    // 현재 연결된 클라이언트 수를 모든 클라이언트에게 알림
    ws.BroadcastToClients("clientCount", map[string]interface{}{
        "count":     ws.GetClientCount(),
        "timestamp": time.Now().Unix(),
    })
}

func (ws *WebSocketService) GetClientCount() int {
    ws.clientsMu.RLock()
    defer ws.clientsMu.RUnlock()
    return len(ws.clients)
}

// 서비스 상태 정보 제공
func (ws *WebSocketService) GetStatus() map[string]interface{} {
    ws.clientsMu.RLock()
    defer ws.clientsMu.RUnlock()
    
    clientAddresses := make([]string, 0, len(ws.clients))
    for client := range ws.clients {
        clientAddresses = append(clientAddresses, client.RemoteAddr().String())
    }
    
    return map[string]interface{}{
        "client_count":     len(ws.clients),
        "client_addresses": clientAddresses,
        "service_status":   "running",
        "last_update":      time.Now().Format("2006-01-02 15:04:05"),
    }
}

// 주기적으로 서비스 상태 로깅
func (ws *WebSocketService) StartStatusLogger() {
    go func() {
        ticker := time.NewTicker(30 * time.Second) // 30초마다
        defer ticker.Stop()
        
        for range ticker.C {
            status := ws.GetStatus()
            log.Printf("📊 WebSocket 서비스 상태: 클라이언트 %d개 연결됨", 
                status["client_count"])
            
            if clientAddrs, ok := status["client_addresses"].([]string); ok && len(clientAddrs) > 0 {
                log.Printf("🔗 연결된 클라이언트: %v", clientAddrs)
            }
        }
    }()
}