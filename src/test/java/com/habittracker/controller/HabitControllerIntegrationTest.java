package com.habittracker.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.habittracker.dto.CreateHabitRequest;
import com.habittracker.dto.UpdateHabitRequest;
import com.habittracker.entity.HabitFrequency;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class HabitControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldCreateReadUpdateCheckInAndDeleteHabit() throws Exception {
        CreateHabitRequest createRequest = new CreateHabitRequest(
                "Morning Run",
                "A 5 km run before breakfast",
                HabitFrequency.DAILY
        );

        String createdJson = mockMvc.perform(post("/api/habits")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Morning Run"))
                .andExpect(jsonPath("$.frequency").value("DAILY"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        long habitId = objectMapper.readTree(createdJson).get("id").asLong();

        mockMvc.perform(get("/api/habits"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        mockMvc.perform(get("/api/habits/{id}", habitId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(habitId));

        UpdateHabitRequest updateRequest = new UpdateHabitRequest(
                "Morning Run Updated",
                "Updated description",
                HabitFrequency.WEEKLY
        );

        mockMvc.perform(put("/api/habits/{id}", habitId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Morning Run Updated"))
                .andExpect(jsonPath("$.frequency").value("WEEKLY"));

        mockMvc.perform(post("/api/habits/{id}/check-ins", habitId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"checkInDate\":\"2026-09-15\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.habitId").value(habitId));

        mockMvc.perform(get("/api/habits/{id}/check-ins", habitId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        mockMvc.perform(post("/api/habits/{id}/check-ins", habitId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"checkInDate\":\"2026-09-15\"}"))
                .andExpect(status().isConflict());

        mockMvc.perform(delete("/api/habits/{id}", habitId))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/habits"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }
}
