package com.habittracker.dto;

import com.habittracker.entity.HabitFrequency;

import java.time.Instant;

public record HabitResponse(
        Long id,
        String name,
        String description,
        HabitFrequency frequency,
        Instant createdAt,
        Instant updatedAt,
        int checkInCount
) {
}
