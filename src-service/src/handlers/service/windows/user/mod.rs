mod zip;
pub use zip::*;

use crate::utils::get_main_drive;

pub(super) fn get_user_program_folder(app_id: &str, user: &str) -> String {
  format!(
    "{}\\Users\\{}\\AHQ Store Applications\\Programs\\{}",
    &get_main_drive(),
    user,
    app_id,
  )
}

pub(super) fn get_user_programs(user: &str) -> String {
  format!(
    "{}\\Users\\{}\\AHQ Store Applications\\Programs\\",
    &get_main_drive(),
    user,
  )
}