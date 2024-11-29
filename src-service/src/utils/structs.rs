pub use ahqstore_types::*;

static mut CURRENT_USER: Option<String> = None;

pub fn set_current_user(user: String) {
  unsafe {
    CURRENT_USER = Some(user);
  }
}

pub fn rem_current_user() {
  unsafe {
    CURRENT_USER = None;
  }
}

pub fn get_current_user() -> Option<&'static str> {
  unsafe { CURRENT_USER.as_ref().map(|x| x.as_str()) }
}
