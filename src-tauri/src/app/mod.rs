#![allow(unused)]
#![allow(non_upper_case_globals)]

pub mod download;
pub mod extract;
#[macro_use]
pub mod utils;

mod ws;

use ahqstore_types::search::RespSearchEntry;
use tauri::{Emitter, Listener};
use tauri::menu::IconMenuItemBuilder;
use tauri::tray::{TrayIconBuilder, TrayIconEvent, MouseButton};
use tauri::window::{ProgressBarState, ProgressBarStatus};
use tauri::{AppHandle, Runtime, WebviewWindowBuilder};
use tauri::{
  ipc::Response,
  image::Image,
  menu::{Menu, MenuBuilder, MenuEvent, MenuId, MenuItem},
  Manager, RunEvent,
};
//modules
use crate::encryption::{decrypt, encrypt, to_hash_uid};

use std::panic::catch_unwind;
use std::path::PathBuf;
use std::process;
use std::time::{Duration, SystemTime};

use whatadistro::identify;

use std::{
  fs,
  fmt::Display,
  process::Command,
  process::Stdio,
  sync::{Arc, Mutex},
  thread,
};

//link Launcher
use open as open_2;

use utils::{get_service_url, is_an_admin};

use ahqstore_types::{
  internet, search, AHQStoreApplication, Commits, DevData
};

use serde::{Serialize, Deserialize};

use anyhow::Context;

#[derive(Debug, Serialize, Deserialize)]
pub enum AHQError {
  JustAnError
}

impl Display for AHQError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      AHQError::JustAnError => write!(f, "JustAnError"),
    }
  }
}

impl std::error::Error for AHQError {}

impl From<anyhow::Error> for AHQError {
  fn from(_: anyhow::Error) -> Self {
    AHQError::JustAnError
  }
}

#[derive(Debug, Clone)]
struct AppData {
  pub name: String,
  pub data: String,
}

static mut WINDOW: Option<tauri::WebviewWindow<tauri::Wry>> = None;

lazy_static::lazy_static! {
  static ref ready: Arc<Mutex<bool>> = Arc::new(Mutex::new(false));
  static ref queue: Arc<Mutex<Vec<AppData>>> = Arc::new(Mutex::new(Vec::<AppData>::new()));
}

pub fn main() {
  let context = tauri::generate_context!();

  let app = tauri::Builder::default()
    .setup(|app| {
      println!(
        "Webview v{}",
        tauri::webview_version().unwrap_or("UNKNOWN".to_string())
      );
      let args = std::env::args();
      let buf = std::env::current_exe().unwrap().to_owned();
      let exec = buf.to_str().unwrap().to_owned();

      let window = app.get_webview_window("main").unwrap();

      let listener = window.clone();

      let ready_clone = ready.clone();
      let queue_clone = queue.clone();

      {
        let window = window.clone();
        listener.listen("ready", move |_| {
          #[cfg(debug_assertions)]
          println!("ready");

          *ready_clone.lock().unwrap() = true;

          for item in queue_clone.lock().unwrap().iter() {
            window.emit(item.name.as_str(), item.data.clone()).unwrap();
          }

          let lock = queue_clone.lock();

          if lock.is_ok() {
            *lock.unwrap() = Vec::<AppData>::new();
          }
        });
      }

      {
        let window = window.clone();
        listener.listen("activate", move |_| {
          window.show().unwrap();
        });
      }

      if std::env::args().last().unwrap().as_str() != exec.clone().as_str() {
        let args = args.last().unwrap_or(String::from(""));

        #[cfg(debug_assertions)]
        println!("Started with {}", args);

        if *ready.clone().lock().unwrap() {
          window.emit("launch_app", args.clone()).unwrap();
        } else {
          queue.clone().lock().unwrap().push(AppData {
            data: args.clone(),
            name: String::from("launch_app"),
          });
        }
      }

      Ok(())
    })
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_http::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_process::init())
    .plugin(tauri_plugin_single_instance::init(|app, args, _| {
      if let Some(main) = app.get_webview_window("main") {
        let _ = main.show();
        let _ = main.set_focus();

        if args.len() == 3 {
          if *ready.clone().lock().unwrap() {
            main.emit("launch_app", args[2].clone()).unwrap();
          } else {
            queue.clone().lock().unwrap().push(AppData {
              data: args[2].clone(),
              name: String::from("launch_app"),
            });
          }
        }
      }
    }))
    .invoke_handler(tauri::generate_handler![
      get_windows,
      sys_handler,
      encrypt,
      decrypt,
      to_hash_uid,
      open,
      set_progress,
      is_an_admin,
      is_development,
      show_code,
      rem_code,
      hash_username,
      get_linux_distro,
      set_commit,
      get_all_search,
      get_home,
      get_app,
      get_dev_data,
      get_app_asset,
      get_devs_apps
    ])
    .menu(|handle| Menu::new(handle))
    .build(context)
    .unwrap();

  TrayIconBuilder::with_id("main")
    .tooltip("Soar Store is running")
    .icon(Image::from_bytes(include_bytes!("../../icons/icon.png")).unwrap())
    .menu_on_left_click(false)
    .menu(
      &MenuBuilder::new(&app)
        .id("tray-menu")
        .item(
          &IconMenuItemBuilder::new("&Soar Store")
            .enabled(false)
            .icon(Image::from_bytes(include_bytes!("../../icons/icon.png")).unwrap())
            .build(&app)
            .unwrap(),
        )
        .separator()
        .item(&MenuItem::with_id(&app, "open", "Open App", true, None::<String>).unwrap())
        // .item(
        //   &MenuItem::with_id(&app, "update", "Check for Updates", true, None::<String>).unwrap(),
        // )
        .separator()
        .item(&MenuItem::with_id(&app, "quit", "Quit", true, None::<String>).unwrap())
        .build()
        .unwrap(),
    )
    .on_tray_icon_event(|app, event| match event {
      TrayIconEvent::Click { button, .. } => match button {
        MouseButton::Left => {
          let _ = app.app_handle().get_webview_window("main").unwrap().show();
        }
        _ => {}
      }
      _ => {}
    })
    .on_menu_event(|app, ev| {
      let MenuEvent { id: MenuId(id) } = ev;

      match id.as_str() {
        "open" => {
          let window = app.get_webview_window("main").unwrap();
          window.show().unwrap();
        }
        "update" => {

        }
        "quit" => {
          process::exit(0);
        }
        _ => {}
      }
    })
    .build(&app)
    .unwrap();

  app.run(move |app, event| match event {
    RunEvent::ExitRequested { api, .. } => {
      api.prevent_exit();
    }
    RunEvent::WindowEvent { event, label, .. } => match event {
      tauri::WindowEvent::CloseRequested { api, .. } => {
        api.prevent_close();

        if let Some(win) = app.get_webview_window(&label) {
          let _ = win.hide();
        }
      }
      _ => {}
    },
    _ => {}
  });
}

static mut COMMIT: Option<Commits> = None;

#[tauri::command(async)]
async fn set_commit(commit: Commits) {
  unsafe {
    COMMIT = Some(commit);
  }
}

#[tauri::command(async)]
async fn get_all_search(query: &str) -> Result<Vec<RespSearchEntry>, AHQError> {
  Ok(search::get_search(unsafe { COMMIT.as_ref() }, query).await?)
}

#[tauri::command(async)]
async fn get_home() -> Result<Vec<(String, Vec<String>)>, AHQError> {
  Ok(internet::get_home(unsafe { &COMMIT.as_ref().unwrap().ahqstore }).await?)
}

#[tauri::command(async)]
async fn get_app(app: &str) -> Result<AHQStoreApplication, AHQError> {
  Ok(internet::get_app(unsafe { COMMIT.as_ref().unwrap() }, app).await?)
}

#[tauri::command(async)]
async fn get_app_asset(app: &str, asset: &str) -> Result<Response, AHQError> {
  let bytes = internet::get_app_asset(unsafe { COMMIT.as_ref().unwrap() }, app, asset).await.context("")?;

  Ok(Response::new(bytes))
}

#[tauri::command(async)]
async fn get_dev_data(dev: &str) -> Result<DevData, AHQError> {
  Ok(internet::get_dev_data(unsafe { COMMIT.as_ref().unwrap() }, dev).await?)
}

#[tauri::command(async)]
async fn get_devs_apps(dev: &str) -> Result<Vec<String>, AHQError> {
  Ok(internet::get_devs_apps(unsafe { COMMIT.as_ref().unwrap() }, dev).await?)
}

#[tauri::command(async)]
fn hash_username(username: String) -> String {
  ahqstore_gh_hash::compute(username.as_str())
}

#[tauri::command(async)]
fn show_code<R: Runtime>(app: AppHandle<R>, code: String) {
  WebviewWindowBuilder::new(&app, "code", tauri::WebviewUrl::App(PathBuf::from(&format!("/{code}"))))
    .skip_taskbar(true)
    .title("Login to GitHub")
    .inner_size(400.0, 150.0)
    .max_inner_size(400.0, 150.0)
    .min_inner_size(400.0, 150.0)
    .decorations(false)
    .always_on_top(true)
    .fullscreen(false)
    .content_protected(true)
    .maximizable(false)
    .minimizable(false)
    .closable(true)
    .focused(true)
    .build();
}

#[tauri::command(async)]
fn rem_code<R: Runtime>(app: tauri::AppHandle<R>) {
  app.get_webview_window("code")
    .unwrap()
    .destroy()
    .unwrap()
}

#[tauri::command(async)]
fn is_development() -> bool {
  cfg!(debug_assertions) || env!("CARGO_PKG_VERSION").contains("-alpha")
}

pub fn chmod(typ: &str, regex: &str) -> Option<bool> {
  use std::process::Command;

  Command::new("chmod")
    .args([typ, regex])
    .spawn()
    .ok()?
    .wait()
    .ok()?
    .success()
    .into()
}

#[tauri::command(async)]
fn open(url: String) -> Option<()> {
  match open_2::that(url) {
    Ok(_) => Some(()),
    _ => None,
  }
}

async fn now() -> u64 {
  use std::time::UNIX_EPOCH;

  SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap()
    .as_secs()
}

#[tauri::command(async)]
fn sys_handler() -> String {
  return "/".into();
}

#[tauri::command(async)]
fn set_progress(
  window: tauri::WebviewWindow<tauri::Wry>,
  state: i32,
  c: Option<u64>,
  t: Option<u64>,
) {
  let progress = match (c, t) {
    (Some(c), Some(t)) => Some((c * 100) / t),
    _ => None,
  };
  let _ = window.set_progress_bar(ProgressBarState {
    progress,
    status: Some(match state {
      1 => ProgressBarStatus::Indeterminate,
      2 => ProgressBarStatus::Normal,
      4 => ProgressBarStatus::Error,
      8 => ProgressBarStatus::Paused,
      _ => ProgressBarStatus::None,
    }),
  });
}

#[tauri::command(async)]
fn get_linux_distro() -> Option<String> {
  return Some(identify()?.name().into());
}

#[tauri::command(async)]
fn get_windows() -> &'static str {
  return "linux";
}
