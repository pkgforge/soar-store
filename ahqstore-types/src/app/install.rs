use crate::Str;
use serde::{Deserialize, Serialize};

#[allow(non_snake_case)]
#[derive(Serialize, Deserialize, Debug)]
pub struct InstallerOptions {
  pub win32: Option<InstallerOptionsWin32>,
  pub linux: Option<InstallerOptionsLinux>,
}

#[allow(non_snake_case)]
#[derive(Serialize, Deserialize, Debug)]
pub struct InstallerOptionsWin32 {
  pub assetId: u8,
  pub exec: Option<Str>,
  pub deps: Option<Vec<Win32Deps>>,
}

#[derive(Serialize, Deserialize, Debug)]
pub enum Win32Deps {
  VisualCpp,
  AHQStoreAPI,
  Node21,
  Node18,
}

#[allow(non_snake_case)]
#[derive(Serialize, Deserialize, Debug)]
pub struct InstallerOptionsLinux {
  pub assetId: u8,
  pub deps: Option<Vec<UnixDeps>>,
}

#[derive(Serialize, Deserialize, Debug)]
pub enum UnixDeps {
  AHQStoreAPI,
  Node21,
  Node18,
}
