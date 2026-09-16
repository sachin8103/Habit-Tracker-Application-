package com.habittracker.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;

import java.time.LocalDate;

public record CheckInRequest(
        @NotNull(message = "Check-in date is required")
        @PastOrPresent(message = "Check-in date cannot be in the future")
        LocalDate checkInDate
) {
}
