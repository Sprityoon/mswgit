// T64: HUDGroup.ui에 FishingGauge 신설 + UIFishingGaugeController 바인딩 주입
// 아이덴티티: HUD 공용 프레임(4fea64a3)·UIMyInfo 바 프레임(f7ebaa33)+fill(f0911af5)·골드 액센트(#F0A830 계열)
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const FRAME = "4fea64a3307cda641809ad8be0d4890b";    // QuestToast/BuffBar/SkillSlot 공용 패널 스프라이트
const BAR_BG = "f7ebaa33f3f71eb428de9c2075d44c73";   // UIMyInfo 바 배경 프레임 (Sliced)
const BAR_FILL = "f0911af597259044aa624a11332c0595"; // UIMyInfo 바 fill

const b = UIBuilder.read("ui/HUDGroup.ui");

// 루트: 스크립트 홀더 (상시 enable — 컨트롤러가 Panel만 토글). 하단 중앙, 퀵슬롯 위.
b.script("FishingGauge", "script.UIFishingGaugeController", {
  anchor: "bottom-center", pos: [0, 200], rect_size: [480, 148],
});

// Panel: HUD 공용 프레임 + 어두운 서피스 틴트 (§2 프레임 RUID 경로)
b.sprite("FishingGauge/Panel", {
  anchor: "middle-center", pos: [0, 0], rect_size: [480, 148],
  image_ruid: FRAME, color: "#212922", alpha: 0.92,
});

// 헤더: 타이틀 (골드 액센트 = BuffBar 텍스트와 동일 계열)
b.text("FishingGauge/Panel/Title", "릴링!", {
  size: 22, bold: true, color: "#F0A830", alignment: 4,
  anchor: "middle-center", pos: [0, 52], rect_size: [440, 30],
});

// 진행 게이지 (금색) — UIMyInfo 바와 동일 프레임/fill 패밀리
b.sprite("FishingGauge/Panel/ProgressBg", {
  anchor: "middle-center", pos: [0, 18], rect_size: [420, 30],
  image_ruid: BAR_BG, sprite_type: 1, alpha: 1.0,
});
b.sprite("FishingGauge/Panel/ProgressBg/ProgressFill", {
  anchor: "middle-center", pos: [0, 0], rect_size: [412, 22],
  image_ruid: BAR_FILL, color: "#F0A830", alpha: 1.0,
});
b.patchComponent("FishingGauge/Panel/ProgressBg/ProgressFill", "MOD.Core.SpriteGUIRendererComponent", {
  Type: 3, FillMethod: 0, FillOrigin: 0, FillAmount: 0.0,
});

// 텐션 게이지 (적색, 더 얇게 — 역할 구분)
b.sprite("FishingGauge/Panel/TensionBg", {
  anchor: "middle-center", pos: [0, -18], rect_size: [420, 20],
  image_ruid: BAR_BG, sprite_type: 1, alpha: 1.0,
});
b.sprite("FishingGauge/Panel/TensionBg/TensionFill", {
  anchor: "middle-center", pos: [0, 0], rect_size: [412, 12],
  image_ruid: BAR_FILL, color: "#F05050", alpha: 1.0,
});
b.patchComponent("FishingGauge/Panel/TensionBg/TensionFill", "MOD.Core.SpriteGUIRendererComponent", {
  Type: 3, FillMethod: 0, FillOrigin: 0, FillAmount: 0.0,
});

// 힌트 (평시) / 위험 경고 (danger 중 점멸 — 컨트롤러 토글)
b.text("FishingGauge/Panel/HintText", "F / 버튼을 꾹 눌러 릴 감기", {
  size: 18, color: "#C9C0B2", alignment: 4,
  anchor: "middle-center", pos: [0, -50], rect_size: [440, 26],
});
b.text("FishingGauge/Panel/WarnText", "⚠ 위험! 손을 떼세요!", {
  size: 20, bold: true, color: "#F05050", alignment: 4,
  anchor: "middle-center", pos: [0, -50], rect_size: [440, 28], enable: false,
});

b.write("ui/HUDGroup.ui", {
  bind: {
    mlua: "RootDesk/MyDesk/UI/Scripts/UIFishingGaugeController.mlua",
    props: {
      panel: "FishingGauge/Panel",
      progressFill: "FishingGauge/Panel/ProgressBg/ProgressFill",
      tensionFill: "FishingGauge/Panel/TensionBg/TensionFill",
      warnText: "FishingGauge/Panel/WarnText",
      hintText: "FishingGauge/Panel/HintText",
    },
  },
});

console.log("FishingGauge built. root id =", b.getId("FishingGauge"));
