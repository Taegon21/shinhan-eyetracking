// main.go
package main

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true }, // CORS 허용
}

func main() {
	http.HandleFunc("/ws", wsHandler)
	log.Println("✅ WebSocket 서버 실행 중 (http://localhost:8080/ws)")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func wsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("업그레이드 실패:", err)
		return
	}
	defer conn.Close()

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Println("읽기 종료:", err)
			break
		}
		log.Println("📩 수신된 메시지:", string(msg))
	}
}
