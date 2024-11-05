use std::future::Future;
use std::io::ErrorKind;
use std::os::windows::io::AsRawHandle;
use std::time::Duration;
use std::{ffi::c_void, ptr};
use tokio::net::windows::named_pipe::{NamedPipeServer, PipeMode, ServerOptions};
use windows::Win32::{
  Foundation::HANDLE,
  Security::{
    InitializeSecurityDescriptor, SetSecurityDescriptorDacl, PSECURITY_DESCRIPTOR,
    SECURITY_ATTRIBUTES, SECURITY_DESCRIPTOR,
  },
  System::{Pipes::GetNamedPipeClientProcessId, SystemServices::SECURITY_DESCRIPTOR_REVISION},
};

use crate::encryption::decrypt2;
use crate::handlers::service::windows::exe::daemon::get_exe_tx;
use crate::utils::write_log;

use super::daemon::start_exe_daemon;

pub static mut EXE_DAEMON_PROCESS: Option<NamedPipeServer> = None;

pub fn get_exe_process_handle() -> Option<&'static mut NamedPipeServer> {
  unsafe { EXE_DAEMON_PROCESS.as_mut() }
}

pub fn launch() -> impl Future<Output = ()> {
  println!("[EXE]: Hosting EXE Service handler");
  write_log("[EXE]: Hosting EXE Service handler");

  let mut obj = SECURITY_DESCRIPTOR::default();

  // make it have full rights over the named pipe
  unsafe {
    InitializeSecurityDescriptor(
      PSECURITY_DESCRIPTOR(&mut obj as *mut _ as *mut c_void),
      SECURITY_DESCRIPTOR_REVISION,
    )
    .unwrap();

    SetSecurityDescriptorDacl(
      PSECURITY_DESCRIPTOR(&mut obj as *mut _ as *mut c_void),
      true,
      Some(ptr::null()),
      false,
    )
    .unwrap();
  }

  let mut attr = SECURITY_ATTRIBUTES::default();
  attr.lpSecurityDescriptor = &mut obj as *mut _ as *mut c_void;

  let pipe = unsafe {
    ServerOptions::new()
      .first_pipe_instance(true)
      .reject_remote_clients(true)
      .pipe_mode(PipeMode::Message)
      .create_with_security_attributes_raw(
        r"\\.\pipe\ahqstore-service-exe-v3",
        &mut attr as *mut _ as *mut c_void,
      )
      .unwrap()
  };

  unsafe {
    EXE_DAEMON_PROCESS = pipe.into();
  }

  let pipe = get_exe_process_handle().unwrap();

  async move {
    start_exe_daemon().await;
    loop {
      write_log("[EXE]: Loop");

      if let Ok(()) = pipe.connect().await {
        println!("[EXE]: Connected");
        let handle = pipe.as_raw_handle();

        let mut process_id = 0u32;

        unsafe {
          let handle = HANDLE(handle);

          let _ = GetNamedPipeClientProcessId(handle, &mut process_id as *mut _);
        }

        let mut authenticated = false;

        // Wait for 1 min 30 seconds to connect
        // 1 minute 30 seconds
        'auth: for _ in 0..=9_000 {
          match read_msg(pipe).await {
            ReadResponse::Data(msg) => {
              #[cfg(debug_assertions)]
              println!("Got Data");
              if "%Qzn835y37z%%^&*&^%&^%^&%^" == &decrypt2(msg).unwrap_or_default() {
                println!("[EXE]: Authenticated");
                authenticated = true;
              }

              break 'auth;
            }
            ReadResponse::Disconnect => {
              println!("[EXE]: SIG Disconnect");
              break 'auth;
            }
            _ => {}
          }

          tokio::time::sleep(Duration::from_millis(10)).await;
        }

        if !authenticated {
          println!("[EXE]: Disconnect, authenticated = {authenticated}");
          let _ = pipe.disconnect();
          continue;
        }

        'a: loop {
          match read_msg(pipe).await {
            ReadResponse::Data(msg) => {
              get_exe_tx().send(msg.into()).await;
            }
            ReadResponse::Disconnect => {
              let _ = pipe.disconnect();
              break 'a;
            }
            _ => {}
          }
          tokio::time::sleep(Duration::from_nanos(10)).await;
        }

        unsafe {
          EXE_DAEMON_PROCESS = None;
        }
      }
      tokio::time::sleep(Duration::from_millis(100)).await;
    }
  }
}

pub enum ReadResponse {
  None,
  Data(Vec<u8>),
  Disconnect,
}

pub async fn read_msg(pipe: &mut NamedPipeServer) -> ReadResponse {
  let mut val = [0u8; 8];

  match pipe.try_read(&mut val) {
    Ok(0) => {
      return ReadResponse::None;
    }
    Ok(_) => {
      println!("[EXE]: Reading bytes");
      let total = usize::from_be_bytes(val);

      let mut buf: Vec<u8> = Vec::new();
      let mut byte = [0u8];

      println!("Total {total}");

      for _ in 0..total {
        match pipe.try_read(&mut byte) {
          Ok(_) => {
            buf.push(byte[0]);
          }
          Err(e) => match e.kind() {
            ErrorKind::WouldBlock => {
              return ReadResponse::None;
            }
            ErrorKind::BrokenPipe => {
              println!("[EXE]: Broken Pipe");
              return ReadResponse::Disconnect;
            }
            e => {
              let err = format!("{e:?}");

              write_log(&err);
              if &err != "Uncategorized" {
                let _ = pipe.disconnect();
                return ReadResponse::Disconnect;
              }

              return ReadResponse::None;
            }
          },
        }
      }

      return ReadResponse::Data(buf);
    }
    Err(e) => match e.kind() {
      ErrorKind::BrokenPipe => {
        println!("[EXE]: Broken Pipe");
        return ReadResponse::Disconnect;
      }
      ErrorKind::WouldBlock => ReadResponse::None,
      e => {
        let err = format!("[EXE]: {e:?}");

        println!("{}", &err);
        write_log(&err);
        if &err != "Uncategorized" {
          let _ = pipe.disconnect();
          return ReadResponse::Disconnect;
        }

        ReadResponse::None
      }
    },
  }
}
