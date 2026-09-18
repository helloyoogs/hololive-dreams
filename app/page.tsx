import cardsData from '@/data/cards.json';
import { Card } from '@/types/card';

export default function Home() {
  // JSON 내부의 cards 객체에서 값(카드 객체들)만 배열로 추출합니다.
  const rawCardsObj = (cardsData as any).cards || {};
  const cards: Card[] = Object.values(rawCardsObj);

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Hololive Dreams</h1>
          <p className="text-gray-400 mt-2">카드 도감 및 덱 편성 시뮬레이터 (포트폴리오)</p>
          <div className="mt-4 text-sm text-indigo-400">
            총 로드된 카드 수: {cards.length}개
          </div>
        </header>

        {/* 카드 그리드 영역 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div 
              key={card.id} 
              className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex flex-col items-center hover:border-indigo-500 transition-all shadow-lg"
            >
              {/* 이미지 영역 (원본 사이트 썸네일 경로 활용) */}
              <div className="w-full bg-gray-800 rounded-lg overflow-hidden relative mb-2 flex items-center justify-center">
                <img 
  src={`/cdn.holodori.dev/assets/${card.image}_unsquished.webp`}
  alt={card.name}
className="object-cover w-full aspect-[1.77778/1] aspect-[16/9]"
  loading="lazy"
/>
                <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-xs font-bold text-yellow-400">
                  ★ {card.rarity}
                </span>
              </div>

              {/* 텍스트 정보 */}
              <span className="text-xs text-gray-400 font-medium truncate w-full text-center">
                {card.character}
              </span>
              <h3 className="text-sm font-bold truncate w-full text-center mt-0.5" title={card.name}>
                {card.name}
              </h3>
              
              {/* 속성 배지 */}
              <span className="mt-2 text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                {card.attributeName}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}