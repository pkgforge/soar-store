#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#![allow(static_mut_refs, unused, dead_code)]

slint::include_modules!();

use slint::{ComponentHandle, SharedString};
use std::env::args;

mod elevate;
mod install;

mod uninstall;

pub mod utils;

#[derive(Debug, Clone, Copy)]
pub enum InstallMode {
  None,
  Uninstall,
  Install,
  InstallPR,
}

fn main() -> Result<(), slint::PlatformError> {
  let arg = args().collect::<Vec<_>>();

  let update = if arg.len() > 1 {
    if &arg[1] == "uninstall" {
      InstallMode::Uninstall
    } else if &arg[1] == "update" {
      InstallMode::Install
    } else {
      InstallMode::InstallPR
    }
  } else {
    InstallMode::None
  };

  elevate::relaunch_if_needed(&update);
  let ui = AppWindow::new()?;

  if !matches!(update, InstallMode::None) && !matches!(update, InstallMode::Uninstall) {
    ui.set_counter(0.0);
    ui.set_msg(SharedString::from("Updating..."));
    ui.set_preview(matches!(update, InstallMode::InstallPR));

    install::start_install(ui.clone_strong(), update);
  } else if matches!(update, InstallMode::Uninstall) {
    ui.set_uninstall(true);
    ui.set_counter(0.0);
    ui.set_msg(SharedString::from("Uninstalling..."));
    ui.set_preview(false);

    uninstall::uninstall(ui.clone_strong());
  }

  ui.on_tos(|| {
    let _ = open::that("https://ahqstore.github.io/en/tos");
  });
  ui.on_site(|| {
    let _ = open::that("https://ahqstore.github.io");
  });
  ui.on_start_install({
    let ui_handle = ui.as_weak();
    move || {
      let handle = ui_handle.unwrap();
      handle.set_counter(0.0);
      let install_mode = if handle.get_preview() {
        InstallMode::InstallPR
      } else {
        InstallMode::Install
      };

      install::start_install(handle, install_mode);
    }
  });

  ui.run()
}
