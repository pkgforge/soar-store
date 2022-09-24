#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

pub mod download;
pub mod extract;

use dirs;
use mslnk::ShellLink;
use std::path::Path;
use std::{fs, thread};
use tauri::{CustomMenuItem, SystemTray, SystemTrayEvent, SystemTrayMenu};

fn main() {
    /*download(String::from("https://github.com/ahqsoftwares/Simple-Host-App/releases/download/v2.1.0/Simple-Host-Desktop-Setup-2.1.0.exe"), String::from("./installs/"));
    install(String::from("./installs/Simple-Host-Desktop-Setup-2.1.0.exe"));*/
    let context = tauri::generate_context!();
    tauri::Builder::default()
        .setup(|app| {
            let main = tauri::Manager::get_window(app, "main").unwrap();
            main.hide().unwrap();
	    fs::create_dir_all("C:\\ProgramData\\AHQ Store Applications\\Installers");
            fs::create_dir_all("C:\\ProgramData\\AHQ Store Applications\\Programs");
            fs::create_dir_all("C:\\ProgramData\\AHQ Store Applications\\Updaters");
            Ok(())
        })
        .system_tray(SystemTray::new().with_menu(
            SystemTrayMenu::new().add_item(CustomMenuItem::new("quit".to_string(), "Close App")),
        ))
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick { .. } => {
                println!("Received a left Click");
                tauri::Manager::get_window(app, "main")
                    .unwrap()
                    .show()
                    .unwrap();
            }
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "quit" => std::process::exit(0),
                _ => println!("Not found!"),
            },
            _ => {
                println!("Unknown command!");
            }
        })
        .invoke_handler(tauri::generate_handler![
            download, install, extract, clean, shortcut, check_app, uninstall
        ])
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            println!("{}, {argv:?}, {cwd}", app.package_info().name);
        }))
        .menu(if cfg!(target_os = "macos") {
            tauri::Menu::os_default(&context.package_info().name)
        } else {
            tauri::Menu::default()
        })
        .run(context)
        .expect("error while running tauri application");
}

#[tauri::command(async)]
fn download(url: String) -> Result<i32, i32> {
    thread::spawn(move || {
        let result = fs::create_dir_all("C:\\ProgramData\\AHQ Store Applications\\Installers");
        match result {
            Ok(()) => println!("Success!"),
            Err(_status) => println!("Error"),
        }
        download::download(
            url.as_str(),
            "C:\\ProgramData\\AHQ Store Applications\\Installers",
        );
    })
    .join()
    .expect("Thread panicked");

    Ok(0.into())
}

#[tauri::command(async)]
fn install(path: String) -> Result<bool, i32> {
    let status = extract::run(path);
    Ok(status.into())
}

#[tauri::command(async)]
fn extract(app: &str, installer: &str) -> Result<i32, i32> {
    let status = extract::extract(
        &Path::new(
            &("C:\\ProgramData\\AHQ Store Applications\\Installers\\".to_owned() + installer),
        ),
        &Path::new(&("C:\\ProgramData\\AHQ Store Applications\\Programs\\".to_owned() + app)),
    );

    Ok(status.into())
}

#[tauri::command(async)]
fn clean(path: String) {
    fs::remove_file(path).unwrap();
}

#[tauri::command(async)]
fn shortcut(app: &str, app_short: &str) {
    let base = r"C:\ProgramData\AHQ Store Applications\Programs\".to_owned() + app;

    let sl = ShellLink::new(base).unwrap();
    let mut path = dirs::desktop_dir().unwrap();
    path.push(format!("{}.lnk", app_short));

    sl.create_lnk(&path.as_path()).unwrap();
}

#[tauri::command(async)]
fn check_app(app_name: &str) -> Result<bool, bool> {
    Ok(
        Path::new(
            format!("C:\\ProgramData\\AHQ Store Applications\\Programs\\{app_name}").as_str(),
        )
        .is_dir()
        .into(),
    )
}

#[tauri::command(async)]
fn uninstall(app_name: &str) -> Result<(), bool> {
    fs::remove_dir_all(
        format!("C:\\ProgramData\\AHQ Store Applications\\Programs\\{app_name}").as_str(),
    )
    .expect("Failed!");

    let mut path = dirs::desktop_dir().unwrap();
    path.push(format!("{}.lnk", app_name));

    fs::remove_file(
        format!("C:\\ProgramData\\AHQ Store Applications\\Updaters\\{app_name}.updater").as_str(),
    )
    .expect("Failed!");

    match fs::remove_file(&path) {
        Err(_err) => {
            println!("App wasn't found maybe?");
            Ok(())
        }
        Ok(()) => Ok(()),
    }
}
