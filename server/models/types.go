package models

import (
    "encoding/json"
    "strconv"
)

// 확장된 GazeData 구조체
type GazeData struct {
    X           float64 `json:"x"`
    Y           float64 `json:"y"`
    Timestamp   int64   `json:"timestamp"`
    SectionID   *string `json:"sectionId,omitempty"`
    CurrentPage *string `json:"currentPage,omitempty"`
}

func (g *GazeData) UnmarshalJSON(data []byte) error {
    type Alias GazeData
    aux := &struct {
        Timestamp interface{} `json:"timestamp"`
        *Alias
    }{
        Alias: (*Alias)(g),
    }

    if err := json.Unmarshal(data, &aux); err != nil {
        return err
    }

    // timestamp 타입에 따라 처리
    switch v := aux.Timestamp.(type) {
    case float64:
        g.Timestamp = int64(v)
    case string:
        if ts, err := strconv.ParseInt(v, 10, 64); err == nil {
            g.Timestamp = ts
        }
    case int64:
        g.Timestamp = v
    }

    return nil
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