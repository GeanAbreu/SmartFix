// tsx uses os.userInfo() to name its temporary directory on platforms where
// process.geteuid is unavailable. Some restricted Windows environments fail
// that lookup before a TypeScript entry point is loaded, so provide the same
// stable numeric identifier used on POSIX systems.
if (process.platform === "win32" && typeof process.geteuid !== "function") {
  process.geteuid = () => 0;
}
