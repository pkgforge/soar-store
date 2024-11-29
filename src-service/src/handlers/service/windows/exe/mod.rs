use std::fs;

use ahqstore_types::{AHQStoreApplication, RefId, Response};
use daemon::get_handles;
use pipe::{get_exe_process_handle, CONNECTED};
use serde_json::{json, to_string_pretty};
use tokio::{spawn, sync::oneshot, task::JoinHandle};

use crate::{
  handlers::InstallResult,
  utils::{get_custom_file, get_program_folder, now, ws_send},
};

static mut COUNTER: RefId = 0;

mod daemon;
pub mod pipe;

pub async fn install(
  path: &str,
  app: &AHQStoreApplication,
  update: bool,
  _user: bool,
  _username: &str,
) -> Option<InstallResult> {
  if unsafe { !CONNECTED } {
    return None;
  }

  unsafe {
    COUNTER += 1;
  };

  let icon_path = get_custom_file(app, "png");

  let icon = app.get_resource(0).await?;
  fs::write(&icon_path, icon);

  let count = unsafe { COUNTER };

  let mut resp = vec![0];

  if update {
    resp.push(1);
  } else {
    resp.push(0);
  }

  let windows_options = app.get_win_options()?;
  let args = windows_options
    .installerArgs
    .as_ref()
    .map_or_else(|| vec![], |x| x.iter().map(|x| x.as_str()).collect());

  let data = serde_json::to_string(&json!({
    "display": app.appDisplayName,
    "id": app.appId,
    "icon": &icon_path,
    "path": &path,
    "count": count,
    "args": args
  }))
  .ok()?;

  resp.append(&mut data.into_bytes());

  ws_send(&mut get_exe_process_handle()?, &resp).await;

  let install_folder = get_program_folder(&app.appId);
  let to_exec = format!("{}\\installer.exe", &install_folder);

  let path = path.to_string();

  let app_str = to_string_pretty(app).ok()?;
  let ver = app.version.clone();

  Some(InstallResult::Thread(spawn(async move {
    let (tx, rx) = oneshot::channel::<bool>();

    get_handles().insert(
      count,
      (
        now(),
        Box::new(move |success| {
          let res: Option<()> = (move || {
            fs::create_dir_all(&install_folder).ok()?;
            fs::copy(&path, to_exec).ok()?;
            fs::write(format!("{}\\app.json", &install_folder), app_str).ok()?;
            fs::write(format!("{}\\ahqStoreVersion", &install_folder), ver).ok()?;
            fs::remove_file(path).ok()?;
            fs::remove_file(icon_path).ok()?;

            Some(())
          })();

          tx.send(success && res.is_some()).ok();
        }),
      ),
    );

    rx.await.ok().and_then(|x| if x { Some(()) } else { None })
  })))
}
