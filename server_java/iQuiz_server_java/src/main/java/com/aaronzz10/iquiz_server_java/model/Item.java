package com.aaronzz10.iquiz_server_java.model;

import java.util.ArrayList;
import java.util.List;

public record Item(
        String question,
        String answer,
        List<String> choices,
        String explanation,
        List<String> tags
) {
    public static Item of(String q, String a, List<String> c, String ex, List<String> t) {
        return new Item(q, a, c != null ? c : new ArrayList<>(), ex != null ? ex : "", t != null ? t : new ArrayList<>());
    }
}