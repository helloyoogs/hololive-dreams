import fs from 'fs';
import path from 'path';

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function CardDetailPage({ params }: PageProps) {
    // 1. Next.js 15+ 버전에서는 params가 Promise이므로 await로 풀어주어야 합니다.
    const resolvedParams = await params;
    const id = resolvedParams.id;

    try {
        // 2. data/card-detail 폴더에서 해당 ID의 json 파일 읽기
        const filePath = path.join(process.cwd(), 'data', 'card-detail', `${id}.json`);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const card = JSON.parse(fileContent);

        return (
            <main className="p-6 text-white">
                <h1 className="text-2xl font-bold">{card.name}</h1>
                <p>캐릭터: {card.character}</p>
                {/* 필요한 상세 데이터 렌더링 */}
            </main>
        );
    } catch (error) {
        console.error("에러 발생 상세 내용:", error);
        return <div className="p-6 text-white">존재하지 않거나 불러올 수 없는 카드입니다.</div>;
    }
}