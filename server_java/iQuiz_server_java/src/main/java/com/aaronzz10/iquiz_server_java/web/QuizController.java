package com.aaronzz10.iquiz_server_java.web;


import com.aaronzz10.iquiz_server_java.model.GenerateRequest;
import com.aaronzz10.iquiz_server_java.model.Item;
import com.aaronzz10.iquiz_server_java.service.OpenAIService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import org.springframework.http.codec.ServerSentEvent;

@RestController
public class QuizController {

    private final OpenAIService svc;

    public QuizController(OpenAIService svc) {
        this.svc = svc;
    }

    @GetMapping("/health")
    public String health() {
        return "ok";
    }

    @PostMapping("/generate-quiz")
    public Mono<ResponseEntity<Map<String, List<Item>>>> generate(@RequestBody GenerateRequest req) {
        if (req.slides() == null || req.slides().isEmpty()) {
            return Mono.just(ResponseEntity.badRequest().body(Map.of("error", List.of())));
        }
        return svc.generate(req).map(items -> ResponseEntity.ok(Map.of("items", items)));
    }

    // Server-Sent Events: "text/event-stream"; we forward "event: item" and "event: done"
    @PostMapping(value = "/generate-quiz-stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<String>> stream(@RequestBody GenerateRequest req) {
        if (req.slides() == null || req.slides().isEmpty()) {
            return Flux.just(
                ServerSentEvent.<String>builder()
                    .event("error")
                    .data("{\"error\":\"slides[] required\"}")
                    .build()
            );
        }
        System.out.println(req);
        return svc.stream(req);
    }
}