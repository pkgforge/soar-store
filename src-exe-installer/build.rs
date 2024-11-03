fn main() -> std::io::Result<()> {
  if cfg!(target_os = "windows") {
    let mut res = tauri_winres::WindowsResource::new();
    res
      .set_icon("icon.ico")
      .set("InternalName", "ahqstore_user_daemon.exe")
      .set("OriginalFilename", "ahqstore_user_daemon.exe")
      .set("ProductName", "AHQ Store User Side Daemon")
      .set(
        "FileDescription",
        "AHQ Store EXE Application Installer Daemon",
      )
      .set("LegalCopyright", "©️ AHQ Store 2024");

    return res.compile();
  }

  Ok(())
}
