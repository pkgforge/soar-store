use std::{env::var, ffi::OsStr, process::{Child, Command, Stdio}};

fn exec<T: AsRef<OsStr>>(args: &[T]) -> Option<Child> {
    let home = var("HOME").ok()?;
    Command::new(format!("{home}/.local/share/soar/soar"))
        .arg("--json")
        .args(args)
        .stdout(Stdio::piped())
        .stdin(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .unwrap()
        .into()
}

pub fn search(query: &str) -> String {
    let exec = exec(&["search", query]).expect("");

    let out = exec.wait_with_output().unwrap().stdout;
    String::from_utf8(out).unwrap()
}

#[cfg(test)]
mod tests {
    use crate::search;

    #[test]
    fn search_test() {
        search("firefox");
    }
}