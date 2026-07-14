mod cache;
mod commands;
mod config;
mod encode;
mod log;
mod options;
mod processing;
mod types;

pub use commands::convert_cli;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                use tauri::Manager;
                if let Some(window) = app.get_webview_window("main") {
                    window.open_devtools();
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::load_image,
            commands::preview_image,
            commands::convert_image
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
