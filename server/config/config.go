package config

import "os"

type Config struct {
    DBHost       string
    KafkaBrokers string
    Port         string
    DBUser       string
    DBPassword   string
    DBName       string
}

func LoadConfig() *Config {
    return &Config{
        DBHost:       getEnv("DB_HOST", "localhost"),
        KafkaBrokers: getEnv("KAFKA_BROKERS", "localhost:9092"),
        Port:         getEnv("PORT", "8080"),
        DBUser:       getEnv("DB_USER", "admin"),
        DBPassword:   getEnv("DB_PASSWORD", "1q2w3e4r"),
        DBName:       getEnv("DB_NAME", "eyetracking"),
    }
}

func getEnv(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}