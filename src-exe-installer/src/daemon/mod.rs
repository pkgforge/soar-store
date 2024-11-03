use std::{io::ErrorKind, time::Duration};

use notification::{get_notif_map, send_installing, send_update_notif};
use tokio::{
  net::windows::named_pipe::{ClientOptions, NamedPipeClient},
  time::sleep,
};

use crate::{ws_send, QuickApplicationData};

mod notification;
pub(super) mod run;

pub static mut PIPE: Option<NamedPipeClient> = None;

pub async fn run() -> Option<()> {
  let pipe = ClientOptions::new()
    .open(r"\\.\pipe\ahqstore-service-exe-v3")
    .ok()?;

  unsafe {
    PIPE = Some(pipe);
  }

  let pipe = unsafe { PIPE.as_mut().unwrap() };

  sleep(Duration::from_millis(100)).await;

  #[cfg(debug_assertions)]
  let _ = ws_send(
    pipe,
    &[
      26, 97, 112, 73, 14, 113, 63, 39, 122, 138, 205, 175, 4, 88, 184, 130, 93, 52, 153, 166,
      124, 141, 100, 50, 81, 59, 182, 116, 92, 85, 209, 2, 250, 2, 46, 43, 217, 163, 69, 186, 77,
      253,
    ],
  )
  .await;

  loop {
    match read_msg(pipe).await {
      ReadResponse::Data(mut data) => {
        // data[0] == 1 means that remove the entry
        if &data[0] == &1 {
          let data = data.drain(1..=8).collect::<Vec<u8>>();
          let data: [u8; 8] = data[0..].try_into().ok()?;

          let _entry = u64::from_be_bytes(data);
        } else {
          let string_data = data.drain(2..).collect::<Vec<u8>>();
          let _ = (|| async {
            let update = data.remove(0) == 1;

            let data = String::from_utf8(string_data).ok()?;
            let data = serde_json::from_str::<QuickApplicationData>(&data).ok()?;

            if update {
              let notif = send_update_notif(data.count, &data.icon, &data.display)?;

              let _ = get_notif_map().insert(data.count, (data, notif));
            } else {
              send_installing(&data, false);
              let success = run::run(&data.path).await;

              let mut data = data.count.to_be_bytes().to_vec();

              data.push(if success { 1 } else { 0 });

              let _ = ws_send(pipe, &data).await;
            }
            Some(())
          })()
          .await;
        }
      }
      ReadResponse::Disconnect => {
        return Some(());
      }
      ReadResponse::None => {}
    }

    sleep(Duration::from_nanos(100)).await;
  }
}

pub enum ReadResponse {
  None,
  Data(Vec<u8>),
  Disconnect,
}

pub async fn read_msg(pipe: &mut NamedPipeClient) -> ReadResponse {
  let mut val = [0u8; 8];

  match pipe.try_read(&mut val) {
    Ok(0) => {
      return ReadResponse::None;
    }
    Ok(_) => {
      let total = usize::from_be_bytes(val);

      let mut buf: Vec<u8> = Vec::new();
      let mut byte = [0u8];

      loop {
        if buf.len() >= total {
          break;
        }

        match pipe.try_read(&mut byte) {
          Ok(_) => {
            buf.push(byte[0]);
          }
          Err(e) => match e.kind() {
            ErrorKind::BrokenPipe => {
              return ReadResponse::Disconnect;
            }
            _ => {}
          },
        }
      }

      ReadResponse::Data(buf)
    }
    Err(e) => match e.kind() {
      ErrorKind::WouldBlock => ReadResponse::None,
      _ => ReadResponse::None,
    },
  }
}
