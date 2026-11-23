export interface RepositoryFileNode {
  path: string;
  name: string;
  type: "file" | "dir";
  size?: number;
  language?: string;
  content?: string;
  children?: RepositoryFileNode[];
}

/**
 * Standard C academic capstone project source tree
 */
export const SAMPLE_C_PROJECT_FILES: RepositoryFileNode[] = [
  {
    path: "src",
    name: "src",
    type: "dir",
    children: [
      {
        path: "src/main.c",
        name: "main.c",
        type: "file",
        size: 1420,
        language: "c",
        content: `/**
 * UniCodeTrack AI — Academic C Project
 * Course: CS492 / SE3102 Capstone
 * Module: Real-time Telemetry & Sensor Packet Ingestion
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#define MAX_SENSORS 4
#define BUFFER_CAPACITY 8

typedef struct {
    int sensor_id;
    char sensor_type[20];
    double reading_value;
    int status_flag; // 1 = OK, 0 = Anomaly Alert
} SensorPacket;

typedef struct {
    SensorPacket buffer[BUFFER_CAPACITY];
    int head;
    int tail;
    int count;
} CircularQueue;

void init_queue(CircularQueue* q) {
    q->head = 0;
    q->tail = 0;
    q->count = 0;
}

int enqueue(CircularQueue* q, SensorPacket packet) {
    if (q->count >= BUFFER_CAPACITY) {
        return 0; // Buffer Overflow
    }
    q->buffer[q->tail] = packet;
    q->tail = (q->tail + 1) % BUFFER_CAPACITY;
    q->count++;
    return 1;
}

int dequeue(CircularQueue* q, SensorPacket* out) {
    if (q->count <= 0) {
        return 0; // Empty Buffer
    }
    *out = q->buffer[q->head];
    q->head = (q->head + 1) % BUFFER_CAPACITY;
    q->count--;
    return 1;
}

int main(void) {
    printf("========================================\\n");
    printf(" UniCodeTrack AI — Embedded C Processor \\n");
    printf(" Real-Time Telemetry Pipeline v2.4       \\n");
    printf("========================================\\n\\n");

    CircularQueue queue;
    init_queue(&queue);

    SensorPacket p1 = {101, "Temperature", 38.6, 1};
    SensorPacket p2 = {102, "HeartRate", 84.0, 1};
    SensorPacket p3 = {103, "SpO2", 98.2, 1};
    SensorPacket p4 = {104, "Vibration", 4.8, 0}; // Anomaly

    enqueue(&queue, p1);
    enqueue(&queue, p2);
    enqueue(&queue, p3);
    enqueue(&queue, p4);

    printf("[INFO] Ingested %d sensor packets into circular telemetry buffer.\\n\\n", queue.count);

    SensorPacket current;
    int processed = 0;
    while (dequeue(&queue, &current)) {
        processed++;
        printf("[PACKET %d] Sensor #%d (%s) -> Value: %.2f | Status: %s\\n",
               processed,
               current.sensor_id,
               current.sensor_type,
               current.reading_value,
               current.status_flag ? "NORMAL" : "** ANOMALY DETECTED **");
    }

    printf("\\n[SUCCESS] Telemetry processing pipeline executed cleanly with 0 memory leaks.\\n");
    return 0;
}
`,
      },
      {
        path: "src/telemetry.c",
        name: "telemetry.c",
        type: "file",
        size: 980,
        language: "c",
        content: `/**
 * telemetry.c — Packet verification and CRC validation
 */

#include <stdio.h>
#include <stdlib.h>

unsigned short compute_crc16(const unsigned char* data, int length) {
    unsigned short crc = 0xFFFF;
    for (int i = 0; i < length; i++) {
        crc ^= (unsigned short)data[i];
        for (int j = 0; j < 8; j++) {
            if (crc & 0x0001) {
                crc = (crc >> 1) ^ 0xA001;
            } else {
                crc = crc >> 1;
            }
        }
    }
    return crc;
}

int validate_packet_integrity(const unsigned char* raw_packet, int len) {
    if (len < 4) return 0;
    unsigned short crc = compute_crc16(raw_packet, len - 2);
    unsigned short expected = (raw_packet[len-1] << 8) | raw_packet[len-2];
    return crc == expected;
}
`,
      },
      {
        path: "src/sensor.c",
        name: "sensor.c",
        type: "file",
        size: 720,
        language: "c",
        content: `/**
 * sensor.c — Calibration routines for peripheral sensors
 */

#include <stdio.h>

double calibrate_temperature(double raw_voltage, double v_ref) {
    // Converts raw millivolts to Celsius with polynomial correction
    double mv = (raw_voltage / v_ref) * 3300.0;
    double celsius = (mv - 500.0) / 10.0;
    return celsius;
}

double calibrate_pressure(double raw_adc) {
    return (raw_adc / 1023.0) * 101.325; // kPa conversion
}
`,
      },
    ],
  },
  {
    path: "include",
    name: "include",
    type: "dir",
    children: [
      {
        path: "include/telemetry.h",
        name: "telemetry.h",
        type: "file",
        size: 512,
        language: "c",
        content: `#ifndef TELEMETRY_H
#define TELEMETRY_H

#define PROTOCOL_VERSION 0x02

unsigned short compute_crc16(const unsigned char* data, int length);
int validate_packet_integrity(const unsigned char* raw_packet, int len);
double calibrate_temperature(double raw_voltage, double v_ref);

#endif // TELEMETRY_H
`,
      },
    ],
  },
  {
    path: "Makefile",
    name: "Makefile",
    type: "file",
    size: 420,
    language: "makefile",
    content: `CC = gcc
CFLAGS = -Wall -Wextra -std=c11 -O2 -Iinclude
TARGET = telemetry_runner

all: $(TARGET)

$(TARGET): src/main.c src/telemetry.c src/sensor.c
\t$(CC) $(CFLAGS) -o $(TARGET) src/main.c src/telemetry.c src/sensor.c

clean:
\trm -f $(TARGET) *.o
`,
  },
  {
    path: "README.md",
    name: "README.md",
    type: "file",
    size: 890,
    language: "markdown",
    content: `# Academic Embedded C Capstone Project

## Overview
This repository contains the C firmware and telemetry processing pipeline for the **UniCodeTrack AI** academic capstone project.

### Architecture
- \`src/main.c\`: Ring-buffer queue and stream processing pipeline.
- \`src/telemetry.c\`: CRC-16 hardware data verification.
- \`src/sensor.c\`: Multi-channel analog sensor calibration.
- \`include/telemetry.h\`: Global headers and function prototypes.
- \`database/schema.sql\`: Relational database DDL schema and foreign key constraints.

### Build and Run
\`\`\`bash
make
./telemetry_runner
\`\`\`
`,
  },
  {
    path: "database",
    name: "database",
    type: "dir",
    children: [
      {
        path: "database/schema.sql",
        name: "schema.sql",
        type: "file",
        size: 1850,
        language: "sql",
        content: `-- UniCodeTrack AI: Academic Capstone Database Schema
-- Module: Symposium Event Ledger & Edge Sensor Telemetry

CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    department_code VARCHAR(16) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attendees (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(32) NOT NULL UNIQUE,
    full_name VARCHAR(128) NOT NULL,
    email VARCHAR(128) NOT NULL UNIQUE,
    department_id INT NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE symposium_events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    venue VARCHAR(128) NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    is_active BOOLEAN DEFAULT true
);

-- Associative Entity for Many-to-Many relationship: Attendees <-> Events
CREATE TABLE event_registrations (
    id SERIAL PRIMARY KEY,
    event_id INT NOT NULL REFERENCES symposium_events(id) ON DELETE CASCADE,
    attendee_id INT NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
    qr_hash VARCHAR(128) NOT NULL UNIQUE,
    checked_in BOOLEAN DEFAULT false,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_event_attendee UNIQUE (event_id, attendee_id)
);

CREATE TABLE sensor_telemetry (
    id BIGSERIAL PRIMARY KEY,
    sensor_id INT NOT NULL,
    sensor_type VARCHAR(32) NOT NULL,
    reading_value NUMERIC(8,2) NOT NULL,
    status_flag INT NOT NULL DEFAULT 1,
    crc16_checksum VARCHAR(8) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`,
      },
    ],
  },
];

export const SAMPLE_PULL_REQUESTS = [
  {
    id: "pr-1",
    number: 14,
    title: "feat(core): implement circular buffer packet enqueue and CRC16 checksum",
    description: "Introduces fixed-capacity ring buffer for real-time sensor packets with overflow detection and telemetry sanity checks.",
    author: "Alex Chen",
    sourceBranch: "feature/telemetry-buffer",
    targetBranch: "main",
    status: "merged" as const,
    additions: 142,
    deletions: 18,
    changedFilesCount: 3,
    createdAt: "2026-11-18T14:32:00Z",
    updatedAt: "2026-11-19T10:15:00Z",
    reviewStatus: "approved" as const,
    reviewer: "Dr. Evelyn Reed",
    reviewComments: "Clean C memory management and bounds checks. Merged to default branch.",
  },
  {
    id: "pr-2",
    number: 15,
    title: "feat(db): symposium schema DDL with foreign key constraints",
    description: "Adds PostgreSQL DDL script defining attendees, symposium_events, event_registrations, and sensor_telemetry tables with cascading rules.",
    author: "Sarah Lin",
    sourceBranch: "feature/db-schema",
    targetBranch: "main",
    status: "merged" as const,
    additions: 89,
    deletions: 4,
    changedFilesCount: 2,
    createdAt: "2026-11-20T09:45:00Z",
    updatedAt: "2026-11-20T16:20:00Z",
    reviewStatus: "approved" as const,
    reviewer: "Alex Chen",
    reviewComments: "Normalization satisfies 3NF requirements. Referential integrity constraints confirmed.",
  },
  {
    id: "pr-3",
    number: 16,
    title: "feat(qr): edge sensor anomaly alert routine and telemetry batching",
    description: "Implements real-time telemetry threshold verification and anomaly flag dispatch for edge sensors.",
    author: "Priya Patel",
    sourceBranch: "feature/qr-scanner",
    targetBranch: "dev",
    status: "open" as const,
    additions: 64,
    deletions: 12,
    changedFilesCount: 2,
    createdAt: "2026-11-22T11:20:00Z",
    updatedAt: "2026-11-23T08:10:00Z",
    reviewStatus: "pending" as const,
    reviewer: "Course Supervisor",
    reviewComments: "Under academic peer review. Pending automated unit test pass.",
  },
];
