// tsx uses os.userInfo() to name its temporary directory on platforms where
// process.geteuid is unavailable. Some restricted Windows environments fail
// that lookup before the test files are loaded, so provide the same stable
// numeric identifier used on POSIX systems. This shim is loaded only by tests.
if (process.platform === "win32" && typeof process.geteuid !== "function") {
  process.geteuid = () => 0;
}
