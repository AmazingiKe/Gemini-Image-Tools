use axum::{
    extract::{Json, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::net::TcpListener;
use tokio::sync::RwLock;
use tower_http::{cors::CorsLayer, services::ServeDir};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod models;
mod storage;

#[derive(Clone)]
struct AppState {
    config: Arc<RwLock<Config>>,
    client: reqwest::Client,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct Config {
    gemini_proxy_url: String,
    fallback_proxy_url: Option<String>,
    api_key: String,
    admin_token: String,
    storage_path: String,
    port: u16,
    #[serde(default = "default_timeout")]
    pub timeout: u64,
    #[serde(default = "default_retries")]
    pub retry_limit: usize,
}

fn default_timeout() -> u64 { 300 }
fn default_retries() -> usize { 10 }

impl Default for Config {
    fn default() -> Self {
        Self {
            gemini_proxy_url: "http://127.0.0.1:8045/v1".to_string(),
            fallback_proxy_url: None,
            api_key: "sk-52036e30e0c2472e9e1f981bd23b8b0b".to_string(),
            admin_token: "admin123".to_string(),
            storage_path: "./storage".to_string(),
            port: 3000,
            timeout: 300,
            retry_limit: 10,
        }
    }
}

async fn load_config() -> Config {
    match tokio::fs::read_to_string("config.json").await {
        Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
        Err(_) => {
            let config = Config::default();
            let _ = tokio::fs::write("config.json", serde_json::to_string_pretty(&config).unwrap()).await;
            config
        }
    }
}

async fn save_config(config: &Config) -> std::io::Result<()> {
    tokio::fs::write("config.json", serde_json::to_string_pretty(config).unwrap()).await
}

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info,gemini_drafting_backend=debug,tower_http=debug".into()))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let config = load_config().await;
    let port = config.port;
    let storage_path = config.storage_path.clone();
    
    let state = AppState {
        config: Arc::new(RwLock::new(config)),
        client: reqwest::Client::new(),
    };

    let _ = tokio::fs::create_dir_all(&storage_path).await;

    let app = Router::new()
        .route("/v1/images/generations", post(generate_image))
        .route("/api/config", get(get_config).post(update_config))
        .route("/health", get(|| async { "OK" }))
        .nest_service("/images", ServeDir::new(&storage_path))
        .layer(tower_http::trace::TraceLayer::new_for_http())
        .layer(tower::limit::ConcurrencyLimitLayer::new(32))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let addr = format!("0.0.0.0:{}", port);
    let listener = TcpListener::bind(&addr).await.unwrap();
    tracing::info!("后端服务已启动：{}", addr);
    axum::serve(listener, app).await.unwrap();
}

async fn get_config(State(state): State<AppState>) -> impl IntoResponse {
    let config = state.config.read().await;
    Json(config.clone())
}

async fn update_config(
    State(state): State<AppState>,
    Json(new_config): Json<Config>,
) -> impl IntoResponse {
    let mut config = state.config.write().await;
    *config = new_config.clone();
    let _ = save_config(&config).await;
    StatusCode::OK
}

async fn generate_image(
    State(state): State<AppState>,
    Json(payload): Json<models::openai::ImageGenerationRequest>,
) -> impl IntoResponse {
    let (proxy_url, fallback_url, api_key, storage_path, timeout, retry_limit) = {
        let config = state.config.read().await;
        (
            config.gemini_proxy_url.clone(),
            config.fallback_proxy_url.clone(),
            config.api_key.clone(),
            config.storage_path.clone(),
            config.timeout,
            config.retry_limit,
        )
    };

    tracing::info!("收到图像生成请求: {}", payload.prompt);

    match perform_generation(&state, &proxy_url, &api_key, &payload, &storage_path, timeout, retry_limit).await {
        Ok(data) => (StatusCode::OK, Json(data)).into_response(),
        Err(e) => {
            tracing::warn!("主代理失败: {}, 尝试备用代理...", e);
            if let Some(fallback) = fallback_url {
                match perform_generation(&state, &fallback, &api_key, &payload, &storage_path, timeout, retry_limit).await {
                    Ok(data) => (StatusCode::OK, Json(data)).into_response(),
                    Err(e) => (StatusCode::BAD_GATEWAY, format!("主备代理均失败: {}", e)).into_response()
                }
            } else {
                (StatusCode::BAD_GATEWAY, format!("请求失败且无备用代理: {}", e)).into_response()
            }
        }
    }
}

async fn perform_generation(
    state: &AppState,
    url_str: &str,
    api_key: &str,
    payload: &models::openai::ImageGenerationRequest,
    storage_path: &str,
    timeout: u64,
    retry_limit: usize,
) -> Result<models::openai::ImageResponse, String> {
    let mut url = if !url_str.starts_with("http://") && !url_str.starts_with("https://") {
        format!("http://{}", url_str)
    } else {
        url_str.to_string()
    };
    
    // ... existing url logic ...
    if url.contains("/images/generations") {
        url = url.replace("/images/generations", "/chat/completions");
    } else if !url.ends_with("/chat/completions") {
        if url.ends_with("/v1") || url.ends_with("/v1/") {
            url = format!("{}/chat/completions", url.trim_end_matches('/'));
        }
    }

    // ... existing messages logic ...
    let mut messages = Vec::new();
    let content = if let Some(img_data) = &payload.image {
        serde_json::json!([
            { "type": "text", "text": payload.prompt },
            { "type": "image_url", "image_url": { "url": img_data } }
        ])
    } else {
        serde_json::json!(payload.prompt)
    };

    messages.push(models::openai::ChatMessage {
        role: "user".to_string(),
        content,
    });

    let chat_payload = models::openai::ChatCompletionRequest {
        model: payload.model.clone(),
        messages,
        size: Some(payload.size.clone()),
    };

    for attempt in 0..retry_limit {
        tracing::info!("🚀 正在尝试生成图像 [第 {}/{} 次] | 目标: {}", attempt + 1, retry_limit, url);
        
        if attempt > 0 {
            let delay = 2;
            tracing::warn!("等待 {} 秒后进行下一次重试...", delay);
            tokio::time::sleep(tokio::time::Duration::from_secs(delay)).await;
        }

        let response = state.client
            .post(&url)
            .header("Authorization", format!("Bearer {}", api_key))
            .timeout(tokio::time::Duration::from_secs(timeout))
            .json(&chat_payload)
            .send()
            .await;

        match response {
            Ok(resp) => {
                let status = resp.status();
                if status.is_success() {
                    tracing::info!("✅ 上游请求成功！正在解析内容...");
                    let chat_resp: models::openai::ChatCompletionResponse = resp.json().await.map_err(|e| {
                        tracing::error!("❌ 解析上游 JSON 失败: {}", e);
                        e.to_string()
                    })?;
                    
                    let mut image_data_vec = Vec::new();
                    
                    for choice in chat_resp.choices {
                        let content = choice.message.content;
                        let url = extract_url(&content).ok_or_else(|| {
                            tracing::error!("❌ 响应文本中找不到图片地址: {}", content);
                            format!("无法解析响应中的图片地址: {}", content)
                        })?;

                        tracing::debug!("🔗 提取到原始 URL: {}", url);
                        
                        let mut item = models::openai::ImageData {
                            url: Some(url.clone()),
                            b64_json: None,
                            revised_prompt: Some(content.clone()),
                        };

                        if let Ok(filename) = storage::download_and_save_image(&url, storage_path, &state.client).await {
                            tracing::info!("💾 图片保存成功: {}", filename);
                            item.url = Some(format!("/images/{}", filename));
                        } else {
                            tracing::error!("❌ 下载图片失败: {}", url);
                        }
                        
                        image_data_vec.push(item);
                    }
                    
                    if image_data_vec.is_empty() {
                        tracing::warn!("⚠️ 响应成功但没有生成任何图片数据，准备重试...");
                        continue;
                    }

                    return Ok(models::openai::ImageResponse {
                        created: std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs(),
                        data: image_data_vec,
                    });
                } else {
                    let error_text = resp.text().await.unwrap_or_default();
                    tracing::error!("❌ 上游返回错误 ({}) | 详情: {}", status, error_text);
                    
                    // 只要不是 400 这种参数错误，都进行重试
                    if status.as_u16() != 400 {
                        tracing::warn!("状态码 {} 可能是临时性错误，继续重试...", status);
                        continue;
                    }
                    return Err(format!("上游返回错误 ({}): {}", status, error_text));
                }
            }
            Err(e) => {
                tracing::error!("📡 网络请求异常 (超时或连接断开): {}", e);
                if attempt == 9 { return Err(format!("最终尝试失败: {}", e)); }
                continue;
            }
        }
    }
    Err("重试耗尽".to_string())
}

/// 从字符串中提取第一个看起来像 URL 的部分
fn extract_url(content: &str) -> Option<String> {
    // 处理 Markdown 格式 ![alt](url)
    if let Some(start) = content.find("](") {
        let sub = &content[start + 2..];
        if let Some(end) = sub.find(')') {
            return Some(sub[..end].to_string());
        }
    }
    
    // 处理纯 URL (寻找 http)
    if let Some(start) = content.find("http") {
        let sub = &content[start..];
        let end = sub.find(|c: char| c.is_whitespace() || c == '"' || c == ')' || c == ']').unwrap_or(sub.len());
        return Some(sub[..end].to_string());
    }
    
    None
}
