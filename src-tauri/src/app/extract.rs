use std::{env::current_exe, ffi::OsStr};
use std::process::Command;

pub fn run_admin<T: AsRef<OsStr>>(path: T) {
  Command::new("nohup").arg(path).spawn().unwrap();
}
