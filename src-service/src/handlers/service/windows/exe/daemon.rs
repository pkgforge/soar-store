use std::{collections::HashMap, time::Duration};

use tokio::{
  spawn,
  sync::mpsc::{channel, Sender},
  time::sleep,
};

use crate::utils::{now, ws_send};

use super::pipe::get_exe_process_handle;

static mut TX: Option<Sender<Vec<u8>>> = None;

static mut HANDLES: Option<HashMap<u64, (u64, Box<dyn FnOnce(bool) -> ()>)>> = None;

pub fn get_exe_tx() -> &'static Sender<Vec<u8>> {
  unsafe { TX.as_ref().unwrap() }
}

pub fn get_handles() -> &'static mut HashMap<u64, (u64, Box<dyn FnOnce(bool) -> ()>)> {
  unsafe { HANDLES.as_mut().unwrap() }
}

pub async fn start_exe_daemon() {
  let (tx, mut rx) = channel::<Vec<u8>>(10240);

  unsafe {
    TX = Some(tx);
    HANDLES = Some(HashMap::new());
  }

  tokio::spawn(async move {
    let mut count: u16 = 0;

    loop {
      count += 1;

      // Check after 3k loops (~5 mins)
      if count >= 3000 {
        count = 0;

        let handles = get_handles();

        let mut to_remove = vec![];
        handles.values().for_each(|(t, _)| {
          if now() > *t {
            to_remove.push(*t);
          }
        });

        for entry in to_remove {
          let mut ws_val = vec![1];

          ws_val.append(&mut entry.to_be_bytes().to_vec());

          spawn(async move {
            ws_send(&mut get_exe_process_handle()?, &ws_val).await;

            Some(())
          });

          let (id, c) = handles.remove(&entry).unwrap();

          c(false);
        }
      }

      if let Some(mut x) = rx.try_recv().ok() {
        println!("Resp {x:?}");

        let data: Vec<u8> = x.drain(1..).collect();

        if data.len() == 8 {
          let data: [u8; 8] = data[0..8].try_into().unwrap();
          let data = u64::from_be_bytes(data);

          let successful = x.pop().unwrap() == 0;

          println!("Got data... successful: {}, entry {}", successful, data);

          if let Some((_, x)) = get_handles().remove(&data) {
            println!("Got entry");
            x(successful);
          }
        }
      }

      sleep(Duration::from_millis(100)).await;
    }
  });
}
