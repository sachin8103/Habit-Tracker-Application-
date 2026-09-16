package com.habittracker.dto;

import java.time.Instant;
import java.time.LocalDate;

public record CheckInResponse(
        Long id,
        Long habitId,
        LocalDate checkInDate,
        Instant createdAt
) {
}
