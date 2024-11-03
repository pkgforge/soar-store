#![allow(static_mut_refs)]

use daemon::PIPE;
use serde::{Deserialize, Serialize};
use std::{sync::LazyLock, time::Duration};
use tokio::{net::windows::named_pipe::NamedPipeClient, time::sleep};
use win32_notif::ToastsNotifier;

pub(crate) static NOTIFIER: LazyLock<ToastsNotifier> =
  LazyLock::new(|| ToastsNotifier::new("com.ahqstore.app").unwrap());

mod daemon;

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct QuickApplicationData {
  pub display: String,
  pub id: String,
  pub icon: String,
  pub path: String,
  pub count: u64,
}

#[tokio::main(flavor = "current_thread")]
async fn main() {
  loop {
    unsafe {
      PIPE = None;
    }

    daemon::run().await;

    sleep(Duration::from_secs(1)).await;
  }
}

pub async fn ws_send(ipc: &mut NamedPipeClient, val: &[u8]) {
  let len = val.len().to_be_bytes();
  let mut data = len.to_vec();

  for byte in val {
    data.push(*byte);
  }

  let _ = ipc.try_write(&data);
}
