use crate::{ServerJSONResp, Str};
use serde::{Deserialize, Serialize};
use serde_json::from_str;
use std::{collections::HashMap, env::consts::ARCH};

pub mod install;
mod other_fields;

pub use install::*;
pub use other_fields::*;

#[allow(non_snake_case)]
#[derive(Serialize, Deserialize, Debug, Clone)]
#[doc = "Use the official ahqstore (https://crates.io/crates/ahqstore_cli_rs) cli\n🎯 Introduced in v1, Revamped in v2"]
pub struct AHQStoreApplication {
  /// The ID of the application
  pub appId: Str,

  /// The name of the shortcut of the app
  pub appShortcutName: Str,

  /// The name that'll be displayed in the app
  pub appDisplayName: Str,

  /// Unique ID of the author
  pub authorId: Str,

  /// Download URLs that the app will address
  pub downloadUrls: HashMap<u8, DownloadUrl>,

  /// Install options
  pub install: InstallerOptions,

  /// App display images, let the cli do it
  pub displayImages: Vec<Str>,

  /// App description
  pub description: Str,

  /// App Icon (base64), let the cli do it
  pub icon: Str,

  /// Your Github Repo associated
  pub repo: AppRepo,

  /// Will be generated by the cli, it is the unique-version-hash of your app
  pub version: Str,

  /// The Site to your app
  pub site: Option<Str>,

  /// This'll be ignored unless you're ahq_verified tag which no one except AHQ Store Team has
  /// 
  /// The general dev isn't meant to redistribute others' apps unless they own right to do so
  pub source: Option<Str>,

  /// License type or Terms of Service Page
  pub license_or_tos: Option<Str>,

  /// Page of Application
  pub app_page: Option<Str>,
}

impl AHQStoreApplication {
  pub fn list_os_arch(&self) -> Vec<&'static str> {
    self.install.list_os_arch()
  }

  pub fn is_supported(&self) -> bool {
    self.install.is_supported()
  }

  pub fn has_platform(&self) -> bool {
    self.install.has_platform()
  }

  #[doc = "🎯 Introduced in v2"]
  pub fn get_win_download(&self) -> Option<&DownloadUrl> {
    let get_w32 = || {
      let Some(x) = &self.install.win32 else {
        return None;
      };

      Some(x)
    };

    // If we are on aarch64, we prefer to use native arm build
    let win32 = if ARCH == "aarch64" {
      if let Some(arm) = &self.install.winarm {
        arm
      } else {
        get_w32()?
      }
    } else {
      get_w32()?
    };

    let url = self.downloadUrls.get(&win32.assetId)?;

    match &url.installerType {
      InstallerFormat::WindowsZip
      | InstallerFormat::WindowsInstallerExe
      | InstallerFormat::WindowsInstallerMsi
      | InstallerFormat::WindowsUWPMsix => Some(&url),
      _ => None,
    }
  }

  #[doc = "🎯 Introduced in v2"]
  /// Just a clone of get_win_download for backwards compatibility
  pub fn get_win32_download(&self) -> Option<&DownloadUrl> {
    self.get_win_download()
  }

  #[doc = "🎯 Introduced in v2"]
  pub fn get_win_extension(&self) -> Option<&'static str> {
    match self.get_win_download()?.installerType {
      InstallerFormat::WindowsZip => Some(".zip"),
      InstallerFormat::WindowsInstallerExe => Some(".exe"),
      InstallerFormat::WindowsInstallerMsi => Some(".msi"),
      InstallerFormat::WindowsUWPMsix => Some(".msix"),
      _ => None,
    }
  }

  #[doc = "🎯 Introduced in v2"]
  /// Just a clone of get_win_extention for backwards compatibility
  pub fn get_win32_extension(&self) -> Option<&'static str> {
    self.get_win_extension()
  }

  #[doc = "🎯 Introduced in v2"]
  pub fn get_linux_download(&self) -> Option<&DownloadUrl> {
    let linux = match ARCH {
      "x86_64" => self.install.linux.as_ref()?,
      "aarch64" => self.install.linuxArm64.as_ref()?,
      "arm" => self.install.linuxArm7.as_ref()?,
      _ => {
        return None;
      }
    };

    let url = self.downloadUrls.get(&linux.assetId)?;

    match &url.installerType {
      InstallerFormat::LinuxAppImage => Some(&url),
      _ => None,
    }
  }

  #[doc = "🎯 Introduced in v2"]
  pub fn get_linux_extension(&self) -> Option<&'static str> {
    match self.get_linux_download()?.installerType {
      InstallerFormat::LinuxAppImage => Some(".AppImage"),
      _ => None,
    }
  }

  #[doc = "🎯 Introduced in v2"]
  pub fn get_android_download(&self) -> Option<&DownloadUrl> {
    let Some(android) = &self.install.android else {
      return None;
    };

    let url = self.downloadUrls.get(&android.assetId)?;

    match &url.installerType {
      InstallerFormat::AndroidApkZip => Some(&url),
      _ => None,
    }
  }

  #[doc = "🎯 Introduced in v2"]
  pub fn get_android_extension(&self) -> Option<&'static str> {
    match self.get_android_download()?.installerType {
      InstallerFormat::AndroidApkZip => Some(".apk"),
      _ => None,
    }
  }
}

impl TryFrom<ServerJSONResp> for AHQStoreApplication {
  type Error = serde_json::Error;

  fn try_from(value: ServerJSONResp) -> Result<Self, Self::Error> {
    from_str(&value.config)
  }
}
