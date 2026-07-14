use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ImageData {
    pub data: Vec<u8>,
    pub width: u32,
    pub height: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_downscaled: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub original_width: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub original_height: Option<u32>,
}
