package com.habittracker.service;

import com.habittracker.dto.CheckInRequest;
import com.habittracker.dto.CheckInResponse;
import com.habittracker.dto.CreateHabitRequest;
import com.habittracker.dto.HabitResponse;
import com.habittracker.dto.UpdateHabitRequest;
import com.habittracker.entity.Habit;
import com.habittracker.entity.HabitCheckIn;
import com.habittracker.exception.DuplicateCheckInException;
import com.habittracker.exception.ResourceNotFoundException;
import com.habittracker.repository.HabitCheckInRepository;
import com.habittracker.repository.HabitRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class HabitService {

    private final HabitRepository habitRepository;
    private final HabitCheckInRepository checkInRepository;

    public HabitService(HabitRepository habitRepository, HabitCheckInRepository checkInRepository) {
        this.habitRepository = habitRepository;
        this.checkInRepository = checkInRepository;
    }

    @Transactional
    public HabitResponse create(CreateHabitRequest request) {
        Habit habit = new Habit();
        applyFields(habit, request.name(), request.description(), request.frequency());
        return toResponse(habitRepository.save(habit));
    }

    @Transactional(readOnly = true)
    public List<HabitResponse> findAll() {
        return habitRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public HabitResponse findById(Long id) {
        return toResponse(findHabit(id));
    }

    @Transactional
    public HabitResponse update(Long id, UpdateHabitRequest request) {
        Habit habit = findHabit(id);
        applyFields(habit, request.name(), request.description(), request.frequency());
        return toResponse(habit);
    }

    @Transactional
    public void delete(Long id) {
        habitRepository.delete(findHabit(id));
    }

    @Transactional
    public CheckInResponse checkIn(Long habitId, CheckInRequest request) {
        Habit habit = findHabit(habitId);
        if (checkInRepository.existsByHabitIdAndCheckInDate(habitId, request.checkInDate())) {
            throw new DuplicateCheckInException(
                    "Habit " + habitId + " is already checked in for " + request.checkInDate()
            );
        }

        try {
            HabitCheckIn checkIn = checkInRepository.save(new HabitCheckIn(habit, request.checkInDate()));
            return toCheckInResponse(checkIn);
        } catch (DataIntegrityViolationException exception) {
            throw new DuplicateCheckInException(
                    "Habit " + habitId + " is already checked in for " + request.checkInDate()
            );
        }
    }

    @Transactional(readOnly = true)
    public List<CheckInResponse> findCheckIns(Long habitId) {
        findHabit(habitId);
        return checkInRepository.findAllByHabitIdOrderByCheckInDateDesc(habitId).stream()
                .map(this::toCheckInResponse)
                .toList();
    }

    private Habit findHabit(Long id) {
        return habitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Habit " + id + " was not found"));
    }

    private void applyFields(Habit habit, String name, String description,
                             com.habittracker.entity.HabitFrequency frequency) {
        habit.setName(name.trim());
        habit.setDescription(description == null || description.isBlank() ? null : description.trim());
        habit.setFrequency(frequency);
    }

    private HabitResponse toResponse(Habit habit) {
        return new HabitResponse(
                habit.getId(),
                habit.getName(),
                habit.getDescription(),
                habit.getFrequency(),
                habit.getCreatedAt(),
                habit.getUpdatedAt(),
                habit.getCheckIns().size()
        );
    }

    private CheckInResponse toCheckInResponse(HabitCheckIn checkIn) {
        return new CheckInResponse(
                checkIn.getId(),
                checkIn.getHabit().getId(),
                checkIn.getCheckInDate(),
                checkIn.getCreatedAt()
        );
    }
}
