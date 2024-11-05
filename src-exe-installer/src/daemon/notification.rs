use std::{collections::HashMap, thread};

use win32_notif::{
  notification::{
    actions::{
      action::{ActivationType, HintButtonStyle},
      ActionButton,
    },
    header::{Header, HeaderActivationType},
    visual::{progress::ProgressValue, Image, Placement, Progress, Text},
    Scenario,
  },
  Notification, NotificationActivatedEventHandler, NotificationBuilder,
};

use crate::{ws_send, NOTIFIER};

use super::{run, QuickApplicationData, PIPE};

pub static mut NOTIF_MAP: Option<HashMap<u64, (QuickApplicationData, Notification<'static>)>> =
  None;

pub(crate) fn get_notif_map(
) -> &'static mut HashMap<u64, (QuickApplicationData, Notification<'static>)> {
  unsafe {
    if NOTIF_MAP.is_none() {
      NOTIF_MAP = Some(HashMap::new());
    }

    NOTIF_MAP.as_mut().unwrap()
  }
}

pub fn send_update_notif(
  id: u64,
  icon_path: &str,
  app_name: &str,
) -> Option<Notification<'static>> {
  let Ok(x) = NotificationBuilder::new()
    .header(Header::new(
      "update",
      "Update Application",
      "update",
      Some(HeaderActivationType::Foreground),
    ))
    .set_use_button_style(true)
    .set_scenario(Scenario::Urgent)
    .visual(Text::create(
      1,
      &format!("Would you like to update {}?", app_name),
    ))
    .visual(Image::new(
      3,
      format!("file:///{}", &icon_path),
      None,
      false,
      Placement::AppLogoOverride,
      true,
    ))
    .action(
      ActionButton::create("Yes")
        .set_activation_type(ActivationType::Foreground)
        .set_id("yes")
        .set_button_style(HintButtonStyle::Success),
    )
    .action(
      ActionButton::create("No")
        .set_activation_type(ActivationType::Foreground)
        .set_id("no"),
    )
    .on_activated(NotificationActivatedEventHandler::new(move |_, args| {
      if let Some(args) = args {
        let map = get_notif_map();

        let Some((app, _x)) = map.remove(&id) else {
          return Ok(());
        };

        // yes
        if &args.button_id.unwrap_or_default() == "yes" {
          send_update_notif(app.count, &app.icon, &app.display);
          thread::spawn(move || {
            tokio::runtime::Builder::new_current_thread()
              .build()
              .unwrap()
              .block_on(async move {
                let success = run::run(&app.path).await;
                let mut resp = app.count.to_be_bytes().to_vec();

                resp.push(if success { 0 } else { 1 });

                if let Some(x) = unsafe { PIPE.as_mut() } {
                  ws_send(x, &resp).await;
                }
              })
          });
        }
        // no
        else {
          thread::spawn(move || {
            tokio::runtime::Builder::new_current_thread()
              .build()
              .unwrap()
              .block_on(async move {
                let success = run::run(&app.path).await;
                let mut resp = app.count.to_be_bytes().to_vec();

                resp.push(if success { 0 } else { 1 });

                if let Some(x) = unsafe { PIPE.as_mut() } {
                  println!("Responded");
                  ws_send(x, &resp).await;
                }
              })
          });
        }
      }

      Ok(())
    }))
    .build(0, &NOTIFIER, &format!("{id}"), "update")
  else {
    return None;
  };

  x.show().ok()?;

  Some(x)
}

pub fn send_installing(app: &QuickApplicationData, update: bool) {
  let Ok(x) = NotificationBuilder::new()
    .header(Header::new(
      "update",
      "Update Application",
      "update",
      Some(HeaderActivationType::Foreground),
    ))
    .set_use_button_style(true)
    .set_scenario(Scenario::Urgent)
    .visual(Text::create(
      1,
      &(if !update {
        format!("Installing {}", &app.display)
      } else {
        format!("Updating {}", &app.display)
      }),
    ))
    .visual(Image::new(
      3,
      format!("file:///{}", &app.icon),
      None,
      false,
      Placement::AppLogoOverride,
      true,
    ))
    .visual(Progress::create(
      if update {
        "Updating..."
      } else {
        "Installing..."
      },
      ProgressValue::Indeterminate,
    ))
    .build(0, &NOTIFIER, &format!("install_{}", app.id), "install")
  else {
    return;
  };

  let _ = x.show().ok();
}
