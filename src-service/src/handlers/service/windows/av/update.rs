use tokio::process::Command;

use super::DEFENDER_CMD;

pub async fn update_win_defender() -> Option<()> {
  if !Command::new(DEFENDER_CMD)
    .args(["-SignatureUpdate"])
    .spawn()
    .ok()?
    .wait()
    .await
    .ok()?
    .success()
  {
    return None;
  }

  Some(())
}
