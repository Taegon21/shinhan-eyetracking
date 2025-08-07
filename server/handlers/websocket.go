package handlers

import (
    "encoding/json"
    "log"
    "net/http"

    "shinhan-eyetracking/server/models"
    "shinhan-eyetracking/server/services"

    "github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
    CheckOrigin: func(r *http.Request) bool { return true },
}

type WebSocketHandler struct {
    gazeService      *services.GazeService
    websocketService *services.WebSocketService
}

func NewWebSocketHandler(gazeService *services.GazeService, websocketService *services.WebSocketService) *WebSocketHandler {
    return &WebSocketHandler{
        gazeService:      gazeService,
        websocketService: websocketService,
    }
}

func (h *WebSocketHandler) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        log.Println("업그레이드 실패:", err)
        return
    }
    defer func() {
        h.websocketService.RemoveClient(conn)
        conn.Close()
    }()

    // 클라이언트 연결 등록
    h.websocketService.AddClient(conn)

    for {
        var message models.WebSocketMessage
        err := conn.ReadJSON(&message)
        if err != nil {
            log.Printf("읽기 종료: %v", err)
            break
        }

        switch message.Type {
        case "gazeData":
            h.handleGazeData(message.Data)
        case "pageChange":
            h.handlePageChange(message.Data)
        default:
            log.Printf("알 수 없는 메시지 타입: %s", message.Type)
        }
    }
}

func (h *WebSocketHandler) handleGazeData(data interface{}) {
    jsonData, err := json.Marshal(data)
    if err != nil {
        log.Printf("시선 데이터  실패: %v", err)
        return
    }

    var gazeData models.GazeData
    err = json.Unmarshal(jsonData, &gazeData)
    if err != nil {
        log.Printf("시선 데이터 언마샬링 실패: %v", err)
        return
    }

    h.gazeService.HandleGazeData(gazeData)
}

func (h *WebSocketHandler) handlePageChange(data interface{}) {
    jsonData, err := json.Marshal(data)
    if err != nil {
        log.Printf("페이지 변경 데이터 마샬링 실패: %v", err)
        return
    }

    var pageData models.PageChangeData
    err = json.Unmarshal(jsonData, &pageData)
    if err != nil {
        log.Printf("페이지 변경 데이터 언마샬링 실패: %v", err)
        return
    }

    h.gazeService.HandlePageChange(pageData)
}