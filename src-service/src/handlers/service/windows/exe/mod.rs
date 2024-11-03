use std::fs;

use ahqstore_types::{AHQStoreApplication, RefId, Response};
use daemon::get_handles;
use pipe::get_exe_process_handle;
use serde_json::json;
use tokio::{spawn, sync::oneshot, task::JoinHandle};

use crate::{
  handlers::InstallResult,
  utils::{get_custom_file, now, ws_send},
};

static mut COUNTER: RefId = 0;

mod daemon;
pub mod pipe;

pub async fn install(path: &str, app: &AHQStoreApplication, update: bool) -> Option<InstallResult> {
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

  let data = serde_json::to_string(&json!({
    "display": app.appDisplayName,
    "id": app.appId,
    "icon": &path,
    "path": path,
    "count": count,
  }))
  .ok()?;

  resp.append(&mut data.into_bytes());

  ws_send(&mut get_exe_process_handle()?, &resp).await;

  Some(InstallResult::Thread(spawn(async move {
    let (tx, rx) = oneshot::channel::<bool>();

    get_handles().insert(
      count + 300,
      (
        now(),
        Box::new(move |success| {
          tx.send(success);
        }),
      ),
    );

    rx.await.ok().and_then(|x| if x { Some(()) } else { None })
  })))
}
