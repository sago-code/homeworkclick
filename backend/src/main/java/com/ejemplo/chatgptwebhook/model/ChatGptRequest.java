package com.ejemplo.chatgptwebhook.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;
import java.util.Collections;
import com.fasterxml.jackson.annotation.JsonCreator;

/**
 * Modelo para las peticiones a la API de ChatGPT
 */
public class ChatGptRequest {
    
    @JsonProperty("model")
    private final String model;
    
    @JsonProperty("messages")
    private final List<Map<String, String>> messages;
    
    @JsonProperty("max_tokens")
    private final Integer maxTokens;
    
    @JsonProperty("temperature")
    private final Double temperature;

    @JsonCreator
    public ChatGptRequest(@JsonProperty("model") String model,
                          @JsonProperty("messages") List<Map<String, String>> messages,
                          @JsonProperty("max_tokens") Integer maxTokens,
                          @JsonProperty("temperature") Double temperature) {
        this.model = model;
        this.messages = messages == null ? Collections.emptyList() : Collections.unmodifiableList(messages);
        this.maxTokens = maxTokens;
        this.temperature = temperature;
    }

    public String getModel() { return model; }
    public List<Map<String, String>> getMessages() { return messages; }
    public Integer getMaxTokens() { return maxTokens; }
    public Double getTemperature() { return temperature; }
}
