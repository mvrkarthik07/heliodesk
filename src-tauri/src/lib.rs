use tauri::{Emitter, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
      println!("[single-instance] argv: {:?}", argv);
      // Forward deep-link URLs from secondary launches to the primary instance.
      if let Some(url) = argv
        .iter()
        .find(|arg| arg.starts_with("heliodesk://") || arg.starts_with("tauri://"))
      {
        println!("[single-instance] forwarding deep link: {}", url);
        let _ = app.emit("deep-link", url.clone());
      }
    }))
    .plugin(tauri_plugin_deep_link::init())
    .plugin(tauri_plugin_shell::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Force-set the window icon at runtime (helps on Windows where icons can be cached).
      // Uses the generated `src-tauri/icons/icon.png`.
      if let Ok(icon) = tauri::image::Image::from_bytes(include_bytes!("../icons/icon.png")) {
        if let Some(window) = app.get_webview_window("main") {
          let _ = window.set_icon(icon);
        }
      }
      
      // Emit deep link if app was launched with a protocol URL.
      let args: Vec<String> = std::env::args().collect();
      if let Some(url) = args
        .iter()
        .find(|arg| arg.starts_with("heliodesk://") || arg.starts_with("tauri://"))
      {
        println!("[startup] found deep link arg: {}", url);
        let _ = app.handle().emit("deep-link", url.clone());
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
