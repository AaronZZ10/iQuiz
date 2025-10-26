package com.aaronzz10.iquiz_server_java.model;

import java.util.List;

public record GenerateRequest(
        List<String> slides,
        String model,
        Integer target
) {}
