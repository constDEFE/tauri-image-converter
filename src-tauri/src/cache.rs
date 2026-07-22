use image::DynamicImage;
use std::collections::HashMap;
use std::sync::{Arc, LazyLock, Mutex};
use std::time::Instant;

const DEFAULT_CACHE_MAX_SIZE: usize = 5;
const DEFAULT_MAX_BUFFERS: usize = 10;

pub struct ImageCache {
    cache: Mutex<HashMap<String, (Arc<DynamicImage>, Instant)>>,
    max_size: usize,
}

impl ImageCache {
    fn new() -> Self {
        let max_size = std::env::var("IMAGE_CACHE_SIZE")
            .ok()
            .and_then(|s| s.parse().ok())
            .unwrap_or(DEFAULT_CACHE_MAX_SIZE);

        Self {
            cache: Mutex::new(HashMap::new()),
            max_size,
        }
    }

    fn cache_key(path: &str) -> String {
        path.to_lowercase()
    }

    pub fn get(&self, path: &str) -> Option<Arc<DynamicImage>> {
        let mut cache = self.cache.lock().unwrap();
        let key = Self::cache_key(path);

        if let Some((img, timestamp)) = cache.get_mut(&key) {
            *timestamp = Instant::now();
            Some(Arc::clone(img))
        } else {
            None
        }
    }

    pub fn insert(&self, path: String, img: DynamicImage) {
        let mut cache = self.cache.lock().unwrap();
        let key = Self::cache_key(&path);

        if cache.len() >= self.max_size && !cache.contains_key(&key) {
            if let Some(oldest_key) = cache
                .iter()
                .min_by_key(|(_, (_, timestamp))| *timestamp)
                .map(|(k, _)| k.clone())
            {
                cache.remove(&oldest_key);
            }
        }

        cache.insert(key, (Arc::new(img), Instant::now()));
    }
}
pub static IMAGE_CACHE: LazyLock<ImageCache> = LazyLock::new(ImageCache::new);

pub struct BufferPool {
    buffers: Mutex<Vec<Vec<u8>>>,
    max_buffers: usize,
}

impl BufferPool {
    fn new(max_buffers: usize) -> Self {
        Self {
            buffers: Mutex::new(Vec::new()),
            max_buffers,
        }
    }

    pub fn get(&self, min_capacity: usize) -> Vec<u8> {
        let mut buffers = self.buffers.lock().unwrap();
        if let Some(pos) = buffers.iter().position(|b| b.capacity() >= min_capacity) {
            let mut buffer = buffers.swap_remove(pos);
            buffer.clear();
            buffer
        } else {
            Vec::with_capacity(min_capacity)
        }
    }

    pub fn return_buffer(&self, mut buffer: Vec<u8>) {
        buffer.clear();
        let mut buffers = self.buffers.lock().unwrap();
        if buffers.len() < self.max_buffers {
            buffers.push(buffer);
        }
    }
}

pub static BUFFER_POOL: LazyLock<BufferPool> =
    LazyLock::new(|| BufferPool::new(DEFAULT_MAX_BUFFERS));
