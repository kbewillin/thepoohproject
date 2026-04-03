use axum::{
    extract::{DefaultBodyLimit, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use mongodb::{Client, options::ClientOptions};
use mongodb::bson::doc; 
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use futures_util::StreamExt; 

// --- 1. DATA STRUCTURES ---

#[derive(Deserialize)]
struct AnswerRequest {
    answer: String,
}

#[derive(Serialize)]
struct AuthResponse {
    success: bool,
    message: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Post {
    image_data: String,
    caption: String,
    date: String,
}

#[derive(Serialize)]
struct StatsResponse {
    total_entries: u64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Poem {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    id: Option<mongodb::bson::oid::ObjectId>,
    title: String,
    content: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct DiaryEntry {
    date: String,
    content: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct LivePost {
    image_data: String,
    caption: String,
    timestamp: String,
}

// --- 2. HANDLERS ---

async fn check_answer(
    State(db_client): State<Client>, 
    Json(payload): Json<AnswerRequest>
) -> impl IntoResponse {
    let cleaned_answer = payload.answer.trim().to_lowercase();
    if cleaned_answer == "pink" {
        let collection = db_client.database("pink_db").collection::<mongodb::bson::Document>("entries");
        let new_entry = mongodb::bson::doc! { 
            "status": "success", 
            "timestamp": chrono::Utc::now().to_rfc3339() 
        };
        let _ = collection.insert_one(new_entry).await;
        (StatusCode::OK, Json(AuthResponse { success: true, message: "Welcome!".to_string() }))
    } else {
        (StatusCode::UNAUTHORIZED, Json(AuthResponse { success: false, message: "Try again!".to_string() }))
    }
}

async fn get_stats(State(db_client): State<Client>) -> impl IntoResponse {
    let collection = db_client.database("pink_db").collection::<mongodb::bson::Document>("entries");
    let count = collection.count_documents(mongodb::bson::doc! {}).await.unwrap_or(0);
    Json(StatsResponse { total_entries: count })
}



async fn upload_memory(
    State(db_client): State<Client>, 
    Json(payload): Json<Post>
) -> impl IntoResponse {
    // 1. Check if the image string is empty
    if payload.image_data.is_empty() {
        return (StatusCode::BAD_REQUEST, "No image data provided").into_response();
    }

    let collection = db_client.database("pink_db").collection::<Post>("gallery");
    
    match collection.insert_one(payload).await {
        Ok(_) => (StatusCode::CREATED, "Memory saved! 🍯").into_response(),
        Err(e) => {
            // This prints the ACTUAL error to your terminal so you can see it
            println!("CRITICAL MONGODB ERROR: {:?}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Database error").into_response()
        }
    }
}

async fn delete_memory(
    State(db_client): State<Client>, 
    Json(payload): Json<Post>
) -> impl IntoResponse {
    let collection = db_client.database("pink_db").collection::<Post>("gallery");
    
    // Find the document with the matching image data and delete it
    match collection.delete_one(mongodb::bson::doc! { "image_data": payload.image_data }).await {
        Ok(_) => (StatusCode::OK, "Memory removed from the jar 🕊️"),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error"),
    }
}

async fn get_gallery(State(db_client): State<Client>) -> impl IntoResponse {
    let collection = db_client.database("pink_db").collection::<Post>("gallery");
    
    let mut cursor = match collection.find(mongodb::bson::doc! {}).await {
        Ok(c) => c,
        // Explicitly tell Rust this is a Vec of Post
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json::<Vec<Post>>(vec![])).into_response(),
    };

    let mut posts = Vec::new();
    while let Some(result) = cursor.next().await {
        if let Ok(post) = result {
            posts.push(post);
        }
    }
    (StatusCode::OK, Json(posts)).into_response()
}

async fn update_caption(
    State(db_client): State<Client>, 
    Json(payload): Json<Post>
) -> impl IntoResponse {
    let collection = db_client.database("pink_db").collection::<Post>("gallery");
    
    // Find by the unique image string and set the new caption
    let filter = mongodb::bson::doc! { "image_data": &payload.image_data };
    let update = mongodb::bson::doc! { "$set": { "caption": &payload.caption } };

    match collection.update_one(filter, update).await {
        Ok(_) => (StatusCode::OK, "Caption updated! ✨"),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Failed to update database"),
    }
}


async fn get_poems(State(client): State<Client>) -> impl IntoResponse {
    let collection = client.database("pink_db").collection::<Poem>("poems");
    let mut cursor = collection.find(mongodb::bson::doc! {}).await.unwrap();
    let mut poems = Vec::new();
    while let Some(Ok(p)) = cursor.next().await { poems.push(p); }
    Json(poems)
}

async fn save_poem(State(client): State<Client>, Json(payload): Json<Poem>) -> impl IntoResponse {
    let collection = client.database("pink_db").collection::<Poem>("poems");
    match collection.insert_one(payload).await {
        Ok(_) => StatusCode::CREATED,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

//  The function to GET all entries
async fn get_diary(State(client): State<Client>) -> impl IntoResponse {
    let collection = client.database("pink_db").collection::<DiaryEntry>("diary");
    let mut cursor = collection.find(mongodb::bson::doc! {}).await.unwrap();
    let mut entries = Vec::new();
    while let Some(Ok(entry)) = cursor.next().await {
        entries.push(entry);
    }
    Json(entries)
}

//  The function to SAVE a new entry
async fn save_diary(State(client): State<Client>, Json(payload): Json<DiaryEntry>) -> impl IntoResponse {
    let collection = client.database("pink_db").collection::<DiaryEntry>("diary");
    match collection.insert_one(payload).await {
        Ok(_) => StatusCode::CREATED,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

async fn delete_diary(State(client): State<Client>, Json(payload): Json<DiaryEntry>) -> impl IntoResponse {
    let collection = client.database("pink_db").collection::<DiaryEntry>("diary");
    
    // The doc! macro now works because of the import above
    let filter = doc! { "date": &payload.date, "content": &payload.content };
    
    // We removed the ", None" argument to match your specific MongoDB crate version
    match collection.delete_one(filter).await {
        Ok(_) => StatusCode::OK,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

async fn get_live_posts(State(client): State<Client>) -> impl IntoResponse {
    let collection = client.database("pink_db").collection::<LivePost>("live_posts");
    let mut cursor = collection.find(mongodb::bson::doc! {}).await.unwrap();
    let mut posts = Vec::new();
    while let Some(Ok(post)) = cursor.next().await {
        posts.push(post);
    }
    Json(posts)
}

async fn save_live_post(State(client): State<Client>, Json(payload): Json<LivePost>) -> impl IntoResponse {
    let collection = client.database("pink_db").collection::<LivePost>("live_posts");
    match collection.insert_one(payload).await {
        Ok(_) => StatusCode::CREATED,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}


// --- 3. MAIN SERVER ---

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Replace with your real MongoDB Atlas URI
    let uri = "mongodb+srv://kbewillin:Krishna2607@thepoohproject.6xnsl9u.mongodb.net/?appName=ThePoohProject";
    let mut client_options = ClientOptions::parse(uri).await?;
    let server_api = mongodb::options::ServerApi::builder().version(mongodb::options::ServerApiVersion::V1).build();
    client_options.server_api = Some(server_api);
    let client = Client::with_options(client_options)?;

    let cors = CorsLayer::permissive();

    let app = Router::new()
        .route("/api/check", post(check_answer))
        .route("/api/stats", get(get_stats))
        .route("/api/upload", post(upload_memory))
        .route("/api/gallery", get(get_gallery))
        .route("/api/delete", post(delete_memory))
        .route("/api/update-caption", post(update_caption))
        .route("/api/poems", get(get_poems).post(save_poem))
        .route("/api/diary", get(get_diary).post(save_diary))
        .route("/api/delete-diary", post(delete_diary))
        .route("/api/live-posts", get(get_live_posts).post(save_live_post))
        .layer(DefaultBodyLimit::max(10 * 1024 * 1024))
        .layer(cors)
        .with_state(client);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    let listener = tokio::net::TcpListener::bind(addr).await?;
    println!("🚀 THE POOH PROJECT BACKEND is live on http://{}", addr);
    
    axum::serve(listener, app).await?; 

    Ok(())
}