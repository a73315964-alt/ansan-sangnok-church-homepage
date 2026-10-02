# ============================================================
# 성경 본문을 Supabase bible_verses 표에 넣습니다. (SQL실행하기/07_bible_text.sql 을 먼저 실행)
# 본문은 저작권이 있어 저장소에 남기지 않습니다 — 임시 폴더에 SQL 을 만들어 바로 넣고 지웁니다.
#
# 실행 (Supabase CLI 로그인 필요):
#   powershell -ExecutionPolicy Bypass -File scripts\import-bible-text.ps1 "C:\...\개역개정4판(구약+신약).txt"
# 여러 번 실행해도 안전합니다 (같은 절은 덮어씀).
# ============================================================
param(
  [Parameter(Mandatory = $true)][string]$BibleTxt,
  [string]$ProjectRef = "mhdcsjdmcswxldjjatgk",
  [string]$Supabase = "$env:USERPROFILE\.supabase-cli\supabase.exe"
)

$enc = [Text.Encoding]::GetEncoding(949)
$lines = [IO.File]::ReadAllLines($BibleTxt, $enc)

# 권 약칭 → 권 번호 (파일에 나오는 순서 = 창세기~요한계시록)
$bookNo = @{}
$verses = New-Object System.Collections.Generic.List[object]
foreach ($l in $lines) {
  if ($l -match '^(\D+?)(\d+):(\d+)\s+(.*)$') {
    $abbr = $matches[1]; $ch = [int]$matches[2]; $vs = [int]$matches[3]; $text = $matches[4].Trim()
    if (-not $bookNo.ContainsKey($abbr)) { $bookNo[$abbr] = $bookNo.Count + 1 }
    $heading = $null
    if ($text -match '^<([^>]+)>\s*(.*)$') { $heading = $matches[1].Trim(); $text = $matches[2].Trim() }
    $verses.Add([pscustomobject]@{ b = $bookNo[$abbr]; c = $ch; v = $vs; h = $heading; t = $text })
  } elseif ($l.Trim() -and $verses.Count) {
    # 줄바꿈으로 넘어온 긴 절 → 앞 절에 이어 붙임
    $verses[$verses.Count - 1].t += " " + $l.Trim()
  }
}
if ($bookNo.Count -ne 66) { throw "66권이 아닙니다: $($bookNo.Count)권" }
"절 수: $($verses.Count)"

function Q($s) { if ([string]::IsNullOrEmpty($s)) { "null" } else { "'" + ([string]$s).Replace("'", "''") + "'" } }

$tmp = Join-Path ([IO.Path]::GetTempPath()) ("bible-import-" + [Guid]::NewGuid())
New-Item -ItemType Directory $tmp | Out-Null
try {
  $batch = 1500
  for ($i = 0; $i -lt $verses.Count; $i += $batch) {
    $rows = $verses.GetRange($i, [Math]::Min($batch, $verses.Count - $i)) | ForEach-Object {
      "($($_.b),$($_.c),$($_.v),$(Q $_.h),$(Q $_.t))"
    }
    $sql = "insert into public.bible_verses (book, chapter, verse, heading, body) values`n" + ($rows -join ",`n") +
      "`non conflict (book, chapter, verse) do update set heading = excluded.heading, body = excluded.body;"
    $f = Join-Path $tmp ("part-{0:D3}.sql" -f ($i / $batch))
    [IO.File]::WriteAllText($f, $sql, (New-Object Text.UTF8Encoding $false))
    & $Supabase db query --linked --project-ref $ProjectRef -f $f | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "넣기 실패: $f" }
    "  $([Math]::Min($i + $batch, $verses.Count)) / $($verses.Count)"
  }
} finally {
  Remove-Item -Recurse -Force $tmp
}
"완료"
