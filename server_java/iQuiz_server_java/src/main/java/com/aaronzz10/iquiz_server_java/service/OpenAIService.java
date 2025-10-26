package com.aaronzz10.iquiz_server_java.service;

import com.aaronzz10.iquiz_server_java.model.GenerateRequest;
import com.aaronzz10.iquiz_server_java.model.Item;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class OpenAIService {
    private final WebClient http;
    private final ObjectMapper om = new ObjectMapper();

    private static final Set<String> ALLOWED = Set.of("gpt-5-nano","gpt-5-mini","gpt-5","gpt-4o-mini");

    private static final String SYSTEM_JSON = """
    You generate exam-style questions from slide text.
    Return STRICT JSON following this schema:
    {"items":[{"question":"string","answer":0,"choices":["string"],"explanation":"string","tags":["string"]}]}
    Rules:
    - Prefer concise, unambiguous phrasing.
    - MCQ and T/F only (3-4 choices for MCQ).
    - Use only provided slides.
    - Keep each question self-contained.
    """;

    private static final String SYSTEM_NDJSON = """
    You generate exam-style questions from slide text.
    STREAM output as NDJSON (one JSON object per line). Do NOT wrap with an array.
    Each line must be a single compact JSON object with: {"question":"string","answer":0,"choices":["string"],"explanation":"string","tags":["string"]}
    Rules:
    - Prefer concise, unambiguous phrasing.
    - MCQ and T/F only (3-4 choices for MCQ, 0/1 for T/F).
    - Use only provided slides.
    - Output one JSON object per line.
    """;

    public OpenAIService(@Value("${openai.base-url}") String base,
                         @Value("${openai.api-key}") String key) {
        this.http = WebClient.builder()
                .baseUrl(base)
                .defaultHeader("Authorization", "Bearer " + key)
                .build();
    }

    private String pickModel(String m) {
        return (m != null && ALLOWED.contains(m)) ? m : "gpt-5-nano";
    }

    /* ---------- Non-streaming ---------- */
    public Mono<List<Item>> generate(GenerateRequest req) {
        String model = pickModel(req.model());
        String extra = (req.target() != null && req.target() > 0)
                ? "Generate " + req.target() + " total questions."
                : "";

        String slides = String.join("\n---\n", req.slides());
        ObjectNode payload = om.createObjectNode();
        payload.put("model", model);
        ObjectNode responseFormat = om.createObjectNode().put("type", "json_object");
        payload.set("response_format", responseFormat);

        ArrayNode messages = om.createArrayNode();
        messages.add(om.createObjectNode().put("role","system").put("content", SYSTEM_JSON));

        ArrayNode userContent = om.createArrayNode()
                .add(om.createObjectNode().put("type","text").put("text", "Slides text:\n" + slides))
                .add(om.createObjectNode().put("type","text").put("text", "Produce JSON now. " + extra));

        messages.add(om.createObjectNode()
                .put("role","user")
                .set("content", userContent));

        payload.set("messages", messages);

        return http.post()
                .uri("/chat/completions")
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(payload))
                .retrieve()
                .bodyToMono(JsonNode.class)
                .map(resp -> {
                    String content = resp.path("choices").path(0).path("message").path("content").asText("");
                    try {
                        JsonNode json = om.readTree(content);
                        List<Item> items = new ArrayList<>();
                        if (json.has("items") && json.get("items").isArray()) {
                            for (JsonNode it : json.get("items")) {
                                Item norm = normalizeItem(it);
                                if (norm != null) items.add(norm);
                            }
                        }
                        // dedupe by question text
                        return dedupe(items);
                    } catch (Exception e) {
                        throw new RuntimeException("Bad JSON from OpenAI: " + e.getMessage());
                    }
                });
    }

    /* ---------- Streaming: returns Flux<Server-Sent Events payload lines> ---------- */
    public Flux<ServerSentEvent<String>> stream(GenerateRequest req) {
        String model = pickModel(req.model());
        String extra = (req.target() != null && req.target() > 0)
                ? "Please generate about " + req.target() + " total questions."
                : "";

        String slides = String.join("\n---\n", req.slides());

        // ---- build payload with ObjectNode/ArrayNode (omitted here for brevity) ----
        ObjectNode payload = om.createObjectNode()
                .put("model", model)
                .put("stream", true);
        ArrayNode messages = om.createArrayNode();
        messages.add(om.createObjectNode().put("role","system").put("content", SYSTEM_NDJSON));
        ArrayNode userContent = om.createArrayNode()
                .add(om.createObjectNode().put("type","text").put("text","Slides text:\n"+slides))
                .add(om.createObjectNode().put("type","text").put("text","Stream NDJSON now. "+extra));
        messages.add(om.createObjectNode().put("role","user").set("content", userContent));
        payload.set("messages", messages);

        Set<String> seen = new HashSet<>();
        StringBuilder buffer = new StringBuilder();

        return http.post()
                .uri("/chat/completions")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.valueOf("text/event-stream"))
                .body(BodyInserters.fromValue(payload))
                .retrieve()
                .bodyToFlux(byte[].class)                                  // Flux<byte[]>
                .map(bytes -> new String(bytes, StandardCharsets.UTF_8))   // Flux<String>
                .flatMapIterable(s -> Arrays.asList(s.split("\n")))        // Flux<String> (lines)
                .<ServerSentEvent<String>>handle((line, sink) -> {                          // <- explicit generic
                    if (!line.startsWith("data:")) return;
                    String data = line.substring(5).trim();
                    if ("[DONE]".equals(data)) return;

                    try {
                        JsonNode json = om.readTree(data);
                        String delta = json.path("choices").path(0).path("delta").path("content").asText("");
                        if (delta.isEmpty()) return;

                        buffer.append(delta);
                        int nl;
                        while ((nl = buffer.indexOf("\n")) >= 0) {
                            String one = buffer.substring(0, nl).trim();
                            buffer.delete(0, nl + 1);
                            if (one.isEmpty()) continue;

                            try {
                                Item it = normalizeItem(om.readTree(one));
                                if (it != null) {
                                    String key = it.question().toLowerCase(Locale.ROOT);
                                    if (seen.add(key)) {
                                        sink.next(sse("item", "{\"item\":" + safe(om, it) + "}")); // ServerSentEvent<String>
                                    }
                                }
                            } catch (Exception ignore) {}
                        }
                    } catch (Exception ignore) {}
                })
                .concatWith(Flux.defer(() -> {                              // Flux<ServerSentEvent<String>>
                    String last = buffer.toString().trim();
                    if (!last.isEmpty()) {
                        try {
                            Item it = normalizeItem(om.readTree(last));
                            if (it != null) {
                                String key = it.question().toLowerCase(Locale.ROOT);
                                if (seen.add(key)) {
                                    return Flux.just(sse("item", "{\"item\":" + safe(om, it) + "}"));
                                }
                            }
                        } catch (Exception ignore) {}
                    }
                    return Flux.empty();                              // <- typed empty
                }))
                .concatWith(Mono.fromSupplier(() -> sse("done", "{\"total\":" + seen.size() + "}")))
                .timeout(Duration.ofMinutes(5));
    }

    /* ---------- Helpers ---------- */
    private static ServerSentEvent<String> sse(String event, String jsonData) {
        return ServerSentEvent.<String>builder()
                .event(event)
                .data(jsonData)
                .build();
    }
    private static String safe(ObjectMapper om, Item it) {
        try { return om.writeValueAsString(it); } catch (Exception e) { return "{}"; }
    }
    private static List<Item> dedupe(List<Item> items) {
        Set<String> seen = new HashSet<>();
        return items.stream()
                .filter(i -> {
                    String k = (i.question() == null ? "" : i.question().toLowerCase(Locale.ROOT));
                    return !k.isEmpty() && seen.add(k);
                })
                .collect(Collectors.toList());
    }

    private Item normalizeItem(JsonNode node) {
        if (node == null || !node.hasNonNull("question")) return null;
        String question = node.path("question").asText("").trim();
        if (question.isEmpty()) return null;

        // Convert numeric answer to string (MCQ index or T/F 0/1)
        String answerOut;
        JsonNode ans = node.get("answer");
        JsonNode choices = node.get("choices");

        if (ans != null && ans.isNumber()) {
            int val = ans.asInt();
            if (choices != null && choices.isArray() && val >= 0 && val < choices.size()) {
                answerOut = choices.get(val).asText("");
            } else if (val == 0 || val == 1) {
                answerOut = (val == 0) ? "True" : "False";
            } else {
                answerOut = String.valueOf(val);
            }
        } else if (ans != null && ans.isTextual() && ans.asText().trim().matches("^[0-3]$")) {
            int idx = Integer.parseInt(ans.asText().trim());
            if (choices != null && choices.isArray() && idx >= 0 && idx < choices.size()) {
                answerOut = choices.get(idx).asText("");
            } else if (idx == 0 || idx == 1) {
                answerOut = (idx == 0) ? "True" : "False";
            } else {
                answerOut = ans.asText();
            }
        } else {
            answerOut = (ans == null) ? "" : ans.asText("");
        }

        List<String> choiceOut = new ArrayList<>();
        if (choices != null && choices.isArray()) {
            for (JsonNode c : choices) choiceOut.add(c.asText(""));
        }

        String explanation = node.path("explanation").asText("");
        List<String> tags = new ArrayList<>();
        JsonNode tj = node.get("tags");
        if (tj != null && tj.isArray()) for (JsonNode t : tj) tags.add(t.asText(""));

        return Item.of(question, answerOut, choiceOut, explanation, tags);
    }
}
