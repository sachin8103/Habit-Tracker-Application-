package com.habittracker.repository;

import com.habittracker.entity.HabitCheckIn;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface HabitCheckInRepository extends JpaRepository<HabitCheckIn, Long> {

    boolean existsByHabitIdAndCheckInDate(Long habitId, LocalDate checkInDate);

    List<HabitCheckIn> findAllByHabitIdOrderByCheckInDateDesc(Long habitId);
}
