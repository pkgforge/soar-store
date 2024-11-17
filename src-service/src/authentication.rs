use crate::utils::*;
use sysinfo::{Pid, ProcessRefreshKind, ProcessesToUpdate, System, Users};

#[cfg(windows)]
pub fn is_current_logged_in_user(pid: usize) -> bool {
  use windows::{
    core::PWSTR,
    Win32::System::RemoteDesktop::{
      WTSGetActiveConsoleSessionId, WTSQuerySessionInformationW, WTSUserName,
      WTS_CURRENT_SERVER_HANDLE,
    },
  };

  let mut system = System::new();
  let mut users = Users::new();
  users.refresh_list();
  system.refresh_processes_specifics(
    ProcessesToUpdate::Some(&[Pid::from(pid)]),
    true,
    ProcessRefreshKind::everything(),
  );

  (|| unsafe {
    let process = system.process(Pid::from(pid))?;

    let user = users.get_user_by_id(process.user_id()?)?.name();

    let sessionid = WTSGetActiveConsoleSessionId();

    let mut user_name: PWSTR = PWSTR::null();
    let mut user_name_len: u32 = 0;

    WTSQuerySessionInformationW(
      WTS_CURRENT_SERVER_HANDLE,
      sessionid,
      WTSUserName,
      &mut user_name as *mut _ as _,
      &mut user_name_len as *mut _,
    )
    .unwrap();

    let user_name = user_name.to_string().unwrap();

    if user == user_name {
      return Some(true);
    }

    Some(false)
  })()
  .unwrap_or(false)
}

pub fn authenticate_process(pid: usize, time: bool) -> (bool, bool) {
  #[cfg(all(not(debug_assertions), windows))]
  let exe = [format!(
    r"{}\Program Files\AHQ Store\ahq-store-app.exe",
    get_main_drive()
  )];

  #[cfg(all(not(debug_assertions), unix))]
  let exe = [
    format!("/bin/ahq-store-app"),
    format!("/usr/bin/ahq-store-app"),
  ];

  #[cfg(debug_assertions)]
  let exe: [String; 0] = [];

  let mut system = System::new();
  let mut users = Users::new();
  users.refresh_list();
  system.refresh_processes_specifics(
    ProcessesToUpdate::Some(&[Pid::from(pid)]),
    true,
    ProcessRefreshKind::everything(),
  );

  let process = system.process(Pid::from(pid));

  if let Some(process) = process {
    let admin = (|| {
      let groups = users.get_user_by_id(process.user_id()?)?.groups();

      #[cfg(windows)]
      let admin = "Administrators";

      #[cfg(unix)]
      let admin = "sudo";

      return Some(groups.iter().find(|x| x.name() == admin).is_some());
    })()
    .unwrap_or(false);

    let Some(ex) = process.exe() else {
      return (false, false);
    };
    let exe_path = ex.to_string_lossy();
    let exe_path = exe_path.to_string();

    #[cfg(feature = "no_auth")]
    return (true, admin);

    let running_for_secs = now() - process.start_time();

    write_log(format!(
      "{:?} {} {} {}",
      &exe,
      &exe_path,
      &running_for_secs,
      exe.contains(&exe_path)
    ));

    if exe.contains(&exe_path) {
      if time && running_for_secs > 20 {
        return (false, admin);
      }
      return (true, admin);
    }
  }

  (false, false)
}
