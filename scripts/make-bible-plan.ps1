# ============================================================
# 1년 성경읽기표 생성 — js/bible-plan.js 를 만듭니다.
# 성경 txt 파일에서 "권·장·절 개수"만 세어 쓰고, 성경 본문은 저장하지 않습니다.
#   (개역개정 본문은 저작권이 있어 홈페이지·GitHub 에 올리지 않습니다)
#
# 실행: powershell -ExecutionPolicy Bypass -File scripts\make-bible-plan.ps1 "C:\...\개역개정4판(구약+신약).txt"
# 날마다 읽는 분량(절 수)이 비슷하도록 창세기→요한계시록 순서로 365일에 나눕니다.
# ============================================================
param(
  [Parameter(Mandatory = $true)][string]$BibleTxt,
  [int]$Days = 365
)

$names = @(
  "창세기","출애굽기","레위기","민수기","신명기","여호수아","사사기","룻기","사무엘상","사무엘하",
  "열왕기상","열왕기하","역대상","역대하","에스라","느헤미야","에스더","욥기","시편","잠언",
  "전도서","아가","이사야","예레미야","예레미야애가","에스겔","다니엘","호세아","요엘","아모스",
  "오바댜","요나","미가","나훔","하박국","스바냐","학개","스가랴","말라기",
  "마태복음","마가복음","누가복음","요한복음","사도행전","로마서","고린도전서","고린도후서","갈라디아서","에베소서",
  "빌립보서","골로새서","데살로니가전서","데살로니가후서","디모데전서","디모데후서","디도서","빌레몬서","히브리서","야고보서",
  "베드로전서","베드로후서","요한일서","요한이서","요한삼서","유다서","요한계시록"
)

$enc = [Text.Encoding]::GetEncoding(949)
$lines = [IO.File]::ReadAllLines($BibleTxt, $enc)

# 권 약칭 순서 + 장별 절 수
$order = New-Object System.Collections.Generic.List[string]
$verses = @{}
foreach ($l in $lines) {
  if ($l -match '^(\D+?)(\d+):(\d+)\s') {
    $a = $matches[1]; $c = [int]$matches[2]
    if (-not $verses.ContainsKey($a)) { $order.Add($a); $verses[$a] = @{} }
    $verses[$a][$c] = 1 + [int]$verses[$a][$c]
  }
}
if ($order.Count -ne 66) { throw "66권이 아닙니다: $($order.Count)권" }

# 장 목록 (권 번호 1~66, 장, 절 수)
$chapters = @()
for ($b = 0; $b -lt 66; $b++) {
  $a = $order[$b]
  $max = ($verses[$a].Keys | Measure-Object -Maximum).Maximum
  for ($c = 1; $c -le $max; $c++) { $chapters += ,@(($b + 1), $c, [int]$verses[$a][$c]) }
}
$total = ($chapters | ForEach-Object { $_[2] } | Measure-Object -Sum).Sum

# 각 장의 "가운데 지점"이 속하는 날에 배정 → 날마다 절 수가 고르게
$dayOf = @()
$cum = 0
foreach ($ch in $chapters) {
  $mid = $cum + $ch[2] / 2
  $dayOf += [Math]::Min($Days - 1, [Math]::Floor($mid / $total * $Days))
  $cum += $ch[2]
}
# 빈 날이 생기지 않도록 앞뒤로 조정 (긴 장 때문에 하루가 비는 경우)
for ($i = 1; $i -lt $dayOf.Count; $i++) { if ($dayOf[$i] -gt $dayOf[$i - 1] + 1) { $dayOf[$i] = $dayOf[$i - 1] + 1 } }
$used = ($dayOf | Select-Object -Unique).Count
if ($used -ne $Days) { throw "빈 날이 있습니다: $used / $Days 일" }

# 날마다 [권, 시작장, 끝장] 묶음으로 압축
$plan = @()
for ($d = 0; $d -lt $Days; $d++) { $plan += ,(New-Object System.Collections.Generic.List[string]) }
$prev = $null
for ($i = 0; $i -lt $chapters.Count; $i++) {
  $b = $chapters[$i][0]; $c = $chapters[$i][1]; $d = $dayOf[$i]
  $list = $plan[$d]
  if ($prev -and $prev.d -eq $d -and $prev.b -eq $b) { $prev.to = $c; $list[$list.Count - 1] = "[$b,$($prev.from),$c]" }
  else { $prev = @{ d = $d; b = $b; from = $c; to = $c }; $list.Add("[$b,$c,$c]") }
}

$bookLines = for ($b = 0; $b -lt 66; $b++) {
  $max = ($verses[$order[$b]].Keys | Measure-Object -Maximum).Maximum
  $t = if ($b -lt 39) { "OT" } else { "NT" }
  "  { abbr: `"$($order[$b])`", name: `"$($names[$b])`", chapters: $max, testament: `"$t`" },"
}
$planLines = $plan | ForEach-Object { "  [" + ($_ -join ",") + "]," }

$out = @"
/* 1년 성경읽기표 — scripts/make-bible-plan.ps1 로 자동 생성된 파일입니다. 직접 고치지 마세요.
   BIBLE_BOOKS: 66권 (권 번호 = 배열 순서 + 1)
   BIBLE_PLAN[day]: 그날 읽을 [권 번호, 시작 장, 끝 장] 목록 (day 0 = 1일째)
   창세기→요한계시록 순서, 하루 분량은 절 수 기준으로 고르게 나눴습니다. (총 $($chapters.Count)장 / $Days 일) */
window.BIBLE_BOOKS = [
$($bookLines -join "`n")
];

window.BIBLE_PLAN = [
$($planLines -join "`n")
];
"@

$dest = Join-Path $PSScriptRoot "..\js\bible-plan.js"
[IO.File]::WriteAllText((Resolve-Path (Split-Path $dest)).Path + "\bible-plan.js", $out, (New-Object Text.UTF8Encoding $false))
"완료: $($chapters.Count)장 / $Days 일 → js/bible-plan.js"
