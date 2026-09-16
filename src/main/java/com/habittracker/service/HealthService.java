package com.habittracker.service;

import org.springframework.stereotype.Service;

@Service
public class HealthService {

    public String status() {
        return "ok";
    }
}
