import StarIcon from '@/components/StarIcon';
import cardsData from '@/data/cards.json';
import { Card } from '@/types/card';

export default function Home() {
  // JSON 내부의 cards 객체에서 값(카드 객체들)만 배열로 추출합니다.
  const rawCardsObj = (cardsData as any).cards || {};
  const cards: Card[] = Object.values(rawCardsObj);

  return (
    <main className="card-main">
      <header className="card-header">
        <StarIcon />
        <h1 className="text-3xl font-extrabold tracking-tight text-blue-100 font-rubik">CARD</h1>
        <StarIcon />
        {/* <div className="mt-4 text-sm text-indigo-400">
            총 로드된 카드 수: {cards.length}개
          </div> */}
      </header>
      {/* 배경 이미지 영역 */}
      <div className="card-content-area">
        {/* 카드 그리드 영역 */}
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-w-[120rem] mx-auto ">
          {cards.map((card) => (
            <div
              key={card.id}
              className="border border-white-a90 bg-white-a90 rounded-xl p-2 flex flex-col items-center hover:border-blue-100 transition-all shadow-lg"
            >
              {/* 이미지 영역 (원본 사이트 썸네일 경로 활용) */}
              <div className="w-full bg-gray-800 relative mb-2 flex items-center justify-center">
                <img
                  src={`/cdn.holodori.dev/assets/${card.image}_unsquished.webp`}
                  alt={card.name}
                  className="object-cover w-full rounded-sm aspect-[16/9] rounded-sm border border-color-transparent"
                  loading="lazy"
                />
                <div className="card-badges">
                  <img className="card-badge" alt={card.attributeName} src={`/api.holodori.best/manual_assets/${card.attributeIcon}.webp`} />
                </div>
                <span className="absolute bottom-0 left-[-5px] flex-col -space-y-1.5">
                  {Array.from({ length: card.rarity }).map((_, i) => (
                    <img
                      key={i}
                      src="/api.holodori.best/manual_assets/rarity-star.webp"
                      alt="star"
                      className="w-6 h-6 drop-shadow-md"
                    />
                  ))}
                </span>
              </div>

              {/* 텍스트 정보 */}
              <span className="text-xs text-blue-100 font-medium truncate w-full text-center">
                {card.character}
              </span>
              <h3 className="text-sm font-bold truncate w-full text-center mt-0.5 text-black-100" title={card.name}>
                {card.name}
              </h3>

              {/* 속성 배지 */}
              <span className="mt-2 text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                {card.attributeName}ddd
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}