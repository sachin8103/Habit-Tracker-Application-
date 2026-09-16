package com.habittracker.controller;

import com.habittracker.dto.CheckInRequest;
import com.habittracker.dto.CheckInResponse;
import com.habittracker.dto.CreateHabitRequest;
import com.habittracker.dto.HabitResponse;
import com.habittracker.dto.UpdateHabitRequest;
import com.habittracker.service.HabitService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class HabitController {

    private final HabitService habitService;

    public HabitController(HabitService habitService) {
        this.habitService = habitService;
    }

    @GetMapping("/habits")
    public List<HabitResponse> getHabits() {
        return habitService.findAll();
    }

    @GetMapping("/habits/{id}")
    public HabitResponse getHabit(@PathVariable Long id) {
        return habitService.findById(id);
    }

    @PostMapping("/habits")
    public ResponseEntity<HabitResponse> createHabit(@Valid @RequestBody CreateHabitRequest request) {
        HabitResponse response = habitService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/habits/{id}")
    public HabitResponse updateHabit(@PathVariable Long id, @Valid @RequestBody UpdateHabitRequest request) {
        return habitService.update(id, request);
    }

    @DeleteMapping("/habits/{id}")
    public ResponseEntity<Void> deleteHabit(@PathVariable Long id) {
        habitService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/habits/{id}/check-ins")
    public List<CheckInResponse> getCheckIns(@PathVariable Long id) {
        return habitService.findCheckIns(id);
    }

    @PostMapping("/habits/{id}/check-ins")
    public ResponseEntity<CheckInResponse> createCheckIn(
            @PathVariable Long id,
            @Valid @RequestBody CheckInRequest request
    ) {
        CheckInResponse response = habitService.checkIn(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
