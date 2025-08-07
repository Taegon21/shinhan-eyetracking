package services

import (
    "context"
    "encoding/json"
    "fmt"
    "log"
    "net"
    "strconv"
    "time"

    "shinhan-eyetracking/server/models"

    "github.com/segmentio/kafka-go"
)

type KafkaService struct {
    writer *kafka.Writer
}

func NewKafkaService(brokers string) *KafkaService {
    log.Printf("🔧 Kafka 연결 시도: %s", brokers)

    // 토픽 생성 시도
    // createTopicIfNotExists(brokers, "gaze-data")

    writer := kafka.NewWriter(kafka.WriterConfig{
        Brokers:      []string{brokers},
        Topic:        "gaze-data",
        Balancer:     &kafka.LeastBytes{},
        BatchTimeout: 100 * time.Millisecond,
        BatchSize:    100,
    })

    service := &KafkaService{writer: writer}
    service.testConnection()

    return service
}

func (k *KafkaService) Close() error {
    return k.writer.Close()
}

func (k *KafkaService) testConnection() {
    err := k.writer.WriteMessages(context.Background(),
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

func (k *KafkaService) SendGazeData(data models.GazeData) error {
    jsonData, err := json.Marshal(data)
    if err != nil {
        return fmt.Errorf("JSON 변환 실패: %w", err)
    }

    err = k.writer.WriteMessages(context.Background(),
        kafka.Message{
            Key:   []byte("gaze"),
            Value: jsonData,
        },
    )
    if err != nil {
        return fmt.Errorf("Kafka 전송 실패: %w", err)
    }

    return nil
}

func createTopicIfNotExists(brokers, topic string) {
    conn, err := kafka.Dial("tcp", brokers)
    if err != nil {
        log.Printf("⚠️ 토픽 생성을 위한 연결 실패: %v", err)
        return
    }
    defer conn.Close()

    controller, err := conn.Controller()
    if err != nil {
        log.Printf("⚠️ Controller 정보 가져오기 실패: %v", err)
        return
    }

    controllerConn, err := kafka.Dial("tcp", net.JoinHostPort(controller.Host, strconv.Itoa(controller.Port)))
    if err != nil {
        log.Printf("⚠️ Controller 연결 실패: %v", err)
        return
    }
    defer controllerConn.Close()

    topicConfig := kafka.TopicConfig{
        Topic:             topic,
        NumPartitions:     1,
        ReplicationFactor: 1,
    }

    err = controllerConn.CreateTopics(topicConfig)
    if err != nil {
        log.Printf("⚠️ 토픽 생성 실패: %v", err)
    } else {
        log.Printf("✅ 토픽 생성됨: %s", topic)
    }
}