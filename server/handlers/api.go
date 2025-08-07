package handlers

import (
    "encoding/json"
    "log"
    "net/http"
    "time"

    "shinhan-eyetracking/server/database"
    "shinhan-eyetracking/server/services"
)

type APIHandler struct {
    db               *database.DB
    gazeService      *services.GazeService
    websocketService *services.WebSocketService
}

func NewAPIHandler(db *database.DB, gazeService *services.GazeService, websocketService *services.WebSocketService) *APIHandler {
    return &APIHandler{
        db:               db,
        gazeService:      gazeService,
        websocketService: websocketService,
    }
}

func (h *APIHandler) DataHandler(w http.ResponseWriter, r *http.Request) {
    results, err := h.db.GetRecentGazeData(100)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "count": len(results),
        "data":  results,
    })
}

func (h *APIHandler) PageStatusHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "current_page": h.gazeService.GetCurrentPage(),
        "clients":      h.websocketService.GetClientCount(),
        "timestamp":    time.Now().Unix(),
    })
}

func (h *APIHandler) ClearDataHandler(w http.ResponseWriter, r *http.Request) {
    gazeRows, pageRows, err := h.db.ClearData()
    if err != nil {
        http.Error(w, "데이터 삭제 실패", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "message":           "데이터 삭제 완료",
        "deleted_gaze_rows": gazeRows,
        "deleted_page_rows": pageRows,
    })

    log.Printf("🗑️ 삭제 완료: 시선 데이터 %d개, 페이지 변경 %d개", gazeRows, pageRows)
}