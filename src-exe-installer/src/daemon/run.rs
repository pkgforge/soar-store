use tokio::process::Command;

async fn run_inner(path: &str) -> Option<bool> {
  let success = Command::new(path)
    .spawn()
    .ok()?
    .wait()
    .await
    .ok()?
    .success();

  Some(success)
}

pub async fn run(path: &str) -> bool {
  run_inner(path).await.unwrap_or(false)
}
