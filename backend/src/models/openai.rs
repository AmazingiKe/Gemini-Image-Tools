use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ImageGenerationRequest {
    pub prompt: String,
    pub image: Option<String>,
    #[serde(default = "default_model")]
    pub model: String,
    #[serde(default = "default_n")]
    pub n: usize,
    #[serde(default = "default_size")]
    pub size: String,
    #[serde(default = "default_response_format")]
    pub response_format: String,
}

fn default_model() -> String { "gemini-3-pro-image".to_string() }
fn default_n() -> usize { 1 }
fn default_size() -> String { "1024x1024".to_string() }
fn default_response_format() -> String { "url".to_string() }

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ImageResponse {
    pub created: u64,
    pub data: Vec<ImageData>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ImageData {
    pub url: Option<String>,
    pub b64_json: Option<String>,
    pub revised_prompt: Option<String>,
}

// --- Chat Completion Structures (for upstream proxy) ---

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatCompletionRequest {
    pub model: String,
    pub messages: Vec<ChatMessage>,
    pub size: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatMessage {
    pub role: String,
    pub content: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatCompletionResponse {
    pub choices: Vec<ChatChoice>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatChoice {
    pub message: ChatMessageResponse,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatMessageResponse {
    pub content: String,
}
