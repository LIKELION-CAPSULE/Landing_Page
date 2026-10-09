export default function Notice() {
  return (
    <section className="notice" aria-labelledby="notice-title" data-reveal>
      <h2 className="notice__title" id="notice-title">알려드려요!</h2>
      <p className="notice__body">
        캡슐은 2026년 12월 기말고사 시즌에 웹으로 오픈합니다.<br />
        노트북 웹캠으로 이용하는 서비스이며, 출시 후에는 노트북에서 만나요!<br />
        카메라 영상은 기기 안에서만 분석하고 저장하거나 전송하지 않으며,<br />
        카메라 없이 쓰는 모드도 있어요.
      </p>
      <p className="notice__body">
        캐릭터는 공부 시간 대부분 조용히 같이 공부하고, 딴짓·휴식·세션<br />
        종료 시 말을 걸어요. 기본 캐릭터는 무료입니다. 등장하는 모든<br />
        캐릭터는 가상의 인물이며 실존 인물과 관계 없습니다.
      </p>
    </section>
  )
}
