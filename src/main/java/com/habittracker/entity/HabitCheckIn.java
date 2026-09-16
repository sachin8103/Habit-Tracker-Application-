package com.habittracker.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(
        name = "habit_check_ins",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_habit_check_in_date",
                columnNames = {"habit_id", "check_in_date"}
        )
)
public class HabitCheckIn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "habit_id", nullable = false)
    private Habit habit;

    @Column(name = "check_in_date", nullable = false)
    private LocalDate checkInDate;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected HabitCheckIn() {
    }

    public HabitCheckIn(Habit habit, LocalDate checkInDate) {
        this.habit = habit;
        this.checkInDate = checkInDate;
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Habit getHabit() {
        return habit;
    }

    public LocalDate getCheckInDate() {
        return checkInDate;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
